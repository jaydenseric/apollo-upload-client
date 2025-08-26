// @ts-check

/** @import { BaseHttpLink } from "@apollo/client/link/http" */

import { ApolloLink } from "@apollo/client/link";
import {
  createSignalIfSupported,
  defaultPrinter,
  fallbackHttpConfig,
  parseAndCheckHttpResponse,
  rewriteURIForGET,
  selectHttpOptionsAndBodyInternal,
  selectURI,
} from "@apollo/client/link/http";
import { filterOperationVariables } from "@apollo/client/link/utils";
import extractFiles from "extract-files/extractFiles.mjs";
import { Observable } from "rxjs/internal/Observable";

import formDataAppendFile from "./formDataAppendFile.mjs";
import isExtractableFile from "./isExtractableFile.mjs";

/**
 * Creates a
 * [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link)
 * for [Apollo Client](https://www.apollographql.com/docs/react) that fetches a
 * [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec)
 * if the GraphQL variables contain files (by default
 * [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList),
 * [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), or
 * [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) instances),
 * or else fetches a regular
 * [GraphQL POST or GET request](https://www.apollographql.com/docs/apollo-server/workflow/requests)
 * (depending on the config and GraphQL operation).
 *
 * Some of the options are similar to the
 * [`createHttpLink` options](https://www.apollographql.com/docs/react/api/link/apollo-link-http/#httplink-constructor-options).
 * @see [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec).
 * @param {object} options Options.
 * @param {Parameters<typeof selectURI>[1]} [options.uri] GraphQL endpoint URI.
 *   Defaults to `"/graphql"`.
 * @param {boolean} [options.useGETForQueries] Should GET be used to fetch
 *   queries, if there are no files to upload.
 * @param {ExtractableFileMatcher} [options.isExtractableFile] Matches
 *   extractable files in the GraphQL operation. Defaults to
 *   {@linkcode isExtractableFile}.
 * @param {typeof FormData} [options.FormData]
 *   [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 *   class. Defaults to the {@linkcode FormData} global.
 * @param {FormDataFileAppender} [options.formDataAppendFile]
 *   Customizes how extracted files are appended to the
 *   [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 *   instance. Defaults to {@linkcode formDataAppendFile}.
 * @param {BaseHttpLink.Printer} [options.print] Prints the GraphQL query or
 *   mutation AST to a string for transport. Defaults to
 *   {@linkcode defaultPrinter}.
 * @param {typeof fetch} [options.fetch] [`fetch`](https://fetch.spec.whatwg.org)
 *   implementation. Defaults to the {@linkcode fetch} global.
 * @param {RequestInit} [options.fetchOptions] `fetch` options; overridden by
 *   upload requirements.
 * @param {string} [options.credentials] Overrides
 *   {@linkcode RequestInit.credentials credentials} in
 *   {@linkcode fetchOptions}.
 * @param {{ [headerName: string]: string }} [options.headers] Merges with and
 *   overrides {@linkcode RequestInit.headers headers} in
 *   {@linkcode fetchOptions}.
 * @param {boolean} [options.includeExtensions] Toggles sending `extensions`
 *   fields to the GraphQL server. Defaults to `false`.
 * @param {boolean} [options.includeUnusedVariables] Toggles including unused
 *   GraphQL variables in the request. Defaults to `false`.
 * @returns A [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link).
 * @example
 * A basic Apollo Client setup:
 *
 * ```js
 * import { ApolloClient, InMemoryCache } from "@apollo/client";
 * import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
 *
 * const client = new ApolloClient({
 *   cache: new InMemoryCache(),
 *   link: createUploadLink(),
 * });
 * ```
 */
export default function createUploadLink({
  uri: fetchUri = "/graphql",
  useGETForQueries,
  isExtractableFile: customIsExtractableFile = isExtractableFile,
  FormData: CustomFormData,
  formDataAppendFile: customFormDataAppendFile = formDataAppendFile,
  print = defaultPrinter,
  fetch: customFetch,
  fetchOptions,
  credentials,
  headers,
  includeExtensions,
  includeUnusedVariables = false,
} = {}) {
  const linkConfig = {
    http: { includeExtensions },
    options: fetchOptions,
    credentials,
    headers,
  };

  return new ApolloLink((operation) => {
    const context = operation.getContext();
    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: context.headers,
    };

    const { options, body } = selectHttpOptionsAndBodyInternal(
      operation,
      print,
      fallbackHttpConfig,
      linkConfig,
      contextConfig,
    );

    if (body.variables && !includeUnusedVariables)
      body.variables = filterOperationVariables(
        body.variables,
        operation.query,
      );

    const { clone, files } = extractFiles(body, customIsExtractableFile, "");

    let uri = selectURI(operation, fetchUri);

    if (files.size) {
      if (options.headers)
        // Automatically set by `fetch` when the `body` is a `FormData` instance.
        delete options.headers["content-type"];

      // GraphQL multipart request spec:
      // https://github.com/jaydenseric/graphql-multipart-request-spec

      const RuntimeFormData = CustomFormData || FormData;

      const form = new RuntimeFormData();

      form.append("operations", JSON.stringify(clone));

      /** @type {{ [key: string]: Array<string> }} */
      const map = {};

      let i = 0;
      files.forEach((paths) => {
        map[++i] = paths;
      });
      form.append("map", JSON.stringify(map));

      i = 0;
      files.forEach((_paths, file) => {
        customFormDataAppendFile(form, String(++i), file);
      });

      options.body = form;
    } else {
      if (
        useGETForQueries &&
        // If the operation contains some mutations GET shouldn’t be used.
        !operation.query.definitions.some(
          (definition) =>
            definition.kind === "OperationDefinition" &&
            definition.operation === "mutation",
        )
      )
        options.method = "GET";

      if (options.method === "GET") {
        const { newURI, parseError } = rewriteURIForGET(uri, body);
        if (parseError)
          // Apollo’s `HttpLink` uses `fromError` for this, but it’s not
          // exported from `@apollo/client/link/http`.
          return new Observable((observer) => {
            observer.error(parseError);
          });
        uri = newURI;
      } else options.body = JSON.stringify(clone);
    }

    const { controller } = createSignalIfSupported();

    if (typeof controller !== "boolean") {
      if (options.signal)
        // Respect the user configured abort controller signal.
        options.signal.aborted
          ? // Signal already aborted, so immediately abort.
            controller.abort()
          : // Signal not already aborted, so setup a listener to abort when it
            // does.
            options.signal.addEventListener(
              "abort",
              () => {
                controller.abort();
              },
              {
                // Prevent a memory leak if the user configured abort controller
                // is long lasting, or controls multiple things.
                once: true,
              },
            );

      options.signal = controller.signal;
    }

    const runtimeFetch = customFetch || fetch;

    return new Observable((observer) => {
      /**
       * Is the observable being cleaned up.
       * @type {boolean}
       */
      let cleaningUp;

      runtimeFetch(uri, options)
        .then((response) => {
          // Forward the response on the context.
          operation.setContext({ response });
          return response;
        })
        .then(parseAndCheckHttpResponse(operation))
        .then((result) => {
          observer.next(result);
          observer.complete();
        })
        .catch((error) => {
          // If the observable is being cleaned up, there is no need to call
          // next or error because there are no more subscribers. An error after
          // cleanup begins is likely from the cleanup function aborting the
          // fetch.
          if (!cleaningUp) observer.error(error);
        });

      // Cleanup function.
      return () => {
        cleaningUp = true;

        // Abort fetch. It’s ok to signal an abort even when not fetching.
        if (typeof controller !== "boolean") controller.abort();
      };
    });
  });
}

/**
 * Checks if a value is an extractable file.
 * @template [ExtractableFile=any] Extractable file.
 * @callback ExtractableFileMatcher
 * @param {unknown} value Value to check.
 * @returns {value is ExtractableFile} Is the value an extractable file.
 * @example
 * How to check for the default exactable files, as well as a custom type of
 * file:
 *
 * ```js
 * import isExtractableFile from "apollo-upload-client/isExtractableFile.mjs";
 *
 * const isExtractableFileEnhanced = (value) =>
 *   isExtractableFile(value) ||
 *   (typeof CustomFile !== "undefined" && value instanceof CustomFile);
 * ```
 */

/**
 * Appends a file extracted from the GraphQL operation to the
 * [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 * instance used as the
 * [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
 * `options.body` for the
 * [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).
 * @template [ExtractableFile=any] Extractable file.
 * @callback FormDataFileAppender
 * @param {FormData} formData
 *   [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 *   instance to append the specified file to.
 * @param {string} fieldName Form data field name to append the file with.
 * @param {ExtractableFile} file File to append. The file type depends on what
 *   the extractable file matcher extracts.
 */
