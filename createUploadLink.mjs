import { ApolloLink } from "@apollo/client/link/core/ApolloLink.js";
import { createSignalIfSupported } from "@apollo/client/link/http/createSignalIfSupported.js";
import { parseAndCheckHttpResponse } from "@apollo/client/link/http/parseAndCheckHttpResponse.js";
import { rewriteURIForGET } from "@apollo/client/link/http/rewriteURIForGET.js";
import {
  fallbackHttpConfig,
  selectHttpOptionsAndBody,
} from "@apollo/client/link/http/selectHttpOptionsAndBody.js";
import { selectURI } from "@apollo/client/link/http/selectURI.js";
import { serializeFetchParameter } from "@apollo/client/link/http/serializeFetchParameter.js";
import { Observable } from "@apollo/client/utilities/observables/Observable.js";
import extractFiles from "extract-files/public/extractFiles.js";

import formDataAppendFile from "./formDataAppendFile.mjs";
import isExtractableFile from "./isExtractableFile.mjs";

/**
 * Creates a
 * [terminating Apollo Link](https://apollographql.com/docs/react/api/link/introduction/#the-terminating-link)
 * for [Apollo Client](https://apollographql.com/docs/react) that fetches a
 * [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec)
 * if the GraphQL variables contain files (by default
 * [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList),
 * [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File),
 * [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob), or
 * [`ReactNativeFile`](#class-reactnativefile) instances), or else fetches a
 * regular
 * [GraphQL POST or GET request](https://apollographql.com/docs/apollo-server/requests)
 * (depending on the config and GraphQL operation).
 *
 * Some of the options are similar to the
 * [`createHttpLink` options](https://apollographql.com/docs/react/api/link/apollo-link-http/#httplink-constructor-options).
 * @see [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec).
 * @kind function
 * @name createUploadLink
 * @param {object} options Options.
 * @param {string} [options.uri="/graphql"] GraphQL endpoint URI.
 * @param {boolean} [options.useGETForQueries] Should GET be used to fetch queries, if there are no files to upload.
 * @param {ExtractableFileMatcher} [options.isExtractableFile=isExtractableFile] Customizes how files are matched in the GraphQL operation for extraction.
 * @param {class} [options.FormData] [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) implementation to use, defaulting to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) global.
 * @param {FormDataFileAppender} [options.formDataAppendFile=formDataAppendFile] Customizes how extracted files are appended to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance.
 * @param {Function} [options.fetch] [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) global.
 * @param {FetchOptions} [options.fetchOptions] [`fetch` options]{@link FetchOptions}; overridden by upload requirements.
 * @param {string} [options.credentials] Overrides `options.fetchOptions.credentials`.
 * @param {object} [options.headers] Merges with and overrides `options.fetchOptions.headers`.
 * @param {boolean} [options.includeExtensions=false] Toggles sending `extensions` fields to the GraphQL server.
 * @returns {ApolloLink} A [terminating Apollo Link](https://apollographql.com/docs/react/api/link/introduction/#the-terminating-link).
 * @example <caption>How to import.</caption>
 * ```js
 * import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
 * ```
 * @example <caption>A basic Apollo Client setup.</caption>
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
  fetch: customFetch,
  fetchOptions,
  credentials,
  headers,
  includeExtensions,
} = {}) {
  const linkConfig = {
    http: { includeExtensions },
    options: fetchOptions,
    credentials,
    headers,
  };

  return new ApolloLink((operation) => {
    const context = operation.getContext();
    const {
      // Apollo Studio client awareness `name` and `version` can be configured
      // via `ApolloClient` constructor options:
      // https://apollographql.com/docs/studio/client-awareness/#using-apollo-server-and-apollo-client
      clientAwareness: { name, version } = {},
      headers,
    } = context;

    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: {
        // Client awareness headers can be overridden by context `headers`.
        ...(name && { "apollographql-client-name": name }),
        ...(version && { "apollographql-client-version": version }),
        ...headers,
      },
    };

    const { options, body } = selectHttpOptionsAndBody(
      operation,
      fallbackHttpConfig,
      linkConfig,
      contextConfig
    );

    const { clone, files } = extractFiles(body, "", customIsExtractableFile);

    let uri = selectURI(operation, fetchUri);

    if (files.size) {
      // Automatically set by `fetch` when the `body` is a `FormData` instance.
      delete options.headers["content-type"];

      // GraphQL multipart request spec:
      // https://github.com/jaydenseric/graphql-multipart-request-spec

      const RuntimeFormData = CustomFormData || FormData;

      const form = new RuntimeFormData();

      form.append("operations", serializeFetchParameter(clone, "Payload"));

      const map = {};
      let i = 0;
      files.forEach((paths) => {
        map[++i] = paths;
      });
      form.append("map", JSON.stringify(map));

      i = 0;
      files.forEach((paths, file) => {
        customFormDataAppendFile(form, ++i, file);
      });

      options.body = form;
    } else {
      if (
        useGETForQueries &&
        // If the operation contains some mutations GET shouldn’t be used.
        !operation.query.definitions.some(
          (definition) =>
            definition.kind === "OperationDefinition" &&
            definition.operation === "mutation"
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
      } else options.body = serializeFetchParameter(clone, "Payload");
    }

    const { controller } = createSignalIfSupported();

    if (controller) {
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
              }
            );

      options.signal = controller.signal;
    }

    const runtimeFetch = customFetch || fetch;

    return new Observable((observer) => {
      // Used to track if the observable is being cleaned up.
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
          if (!cleaningUp) {
            // For errors such as an invalid fetch URI there will be no GraphQL
            // result with errors or data to forward.
            if (error.result && error.result.errors && error.result.data)
              observer.next(error.result);

            observer.error(error);
          }
        });

      // Cleanup function.
      return () => {
        cleaningUp = true;

        // Abort fetch. It’s ok to signal an abort even when not fetching.
        if (controller) controller.abort();
      };
    });
  });
}

/**
 * A function that checks if a value is an extractable file.
 * @kind typedef
 * @name ExtractableFileMatcher
 * @type {Function}
 * @param {*} value Value to check.
 * @returns {boolean} Is the value an extractable file.
 * @see [`isExtractableFile`]{@link isExtractableFile} has this type.
 * @example <caption>How to check for the default exactable files, as well as a custom type of file.</caption>
 * ```js
 * import isExtractableFile from "apollo-upload-client/isExtractableFile.mjs";
 *
 * const isExtractableFileEnhanced = (value) =>
 *   isExtractableFile(value) ||
 *   (typeof CustomFile !== "undefined" && value instanceof CustomFile);
 * ```
 */

/**
 * GraphQL request `fetch` options.
 * @kind typedef
 * @name FetchOptions
 * @type {object}
 * @see [Polyfillable fetch options](https://github.github.io/fetch#options).
 * @prop {object} headers HTTP request headers.
 * @prop {string} [credentials] Authentication credentials mode.
 */

/**
 * Appends a file extracted from the GraphQL operation to the
 * [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 * instance used as the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
 * `options.body` for the [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).
 * @kind typedef
 * @name FormDataFileAppender
 * @param {FormData} formData [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance to append the specified file to.
 * @param {string} fieldName Field name for the file.
 * @param {*} file File to append. The file type depends on what the [`ExtractableFileMatcher`]{@link ExtractableFileMatcher} extracts.
 * @see [`formDataAppendFile`]{@link formDataAppendFile} has this type.
 * @see [`createUploadLink`]{@link createUploadLink} accepts this type in `options.formDataAppendFile`.
 */
