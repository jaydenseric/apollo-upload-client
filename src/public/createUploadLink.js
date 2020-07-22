'use strict';

const { ApolloLink, Observable } = require('@apollo/client/core');
const {
  createSignalIfSupported,
  fallbackHttpConfig,
  parseAndCheckHttpResponse,
  selectHttpOptionsAndBody,
  selectURI,
  serializeFetchParameter,
} = require('@apollo/client/link/http');
const extractFiles = require('extract-files/lib/extractFiles');
const formDataAppendFile = require('./formDataAppendFile');
const isExtractableFile = require('./isExtractableFile');

/**
 * Creates a [terminating Apollo Link](https://apollographql.com/docs/link/overview/#terminating-links)
 * capable of file uploads.
 *
 * The link matches and extracts files in the GraphQL operation. If there are
 * files it uses a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 * instance as the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
 * `options.body` to make a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec),
 * otherwise it sends a regular POST request.
 *
 * Some of the options are similar to the [`createHttpLink` options](https://apollographql.com/docs/link/links/http/#options).
 * @see [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec).
 * @see [`apollo-link` on GitHub](https://github.com/apollographql/apollo-link).
 * @kind function
 * @name createUploadLink
 * @param {object} options Options.
 * @param {string} [options.uri='/graphql'] GraphQL endpoint URI.
 * @param {ExtractableFileMatcher} [options.isExtractableFile=isExtractableFile] Customizes how files are matched in the GraphQL operation for extraction.
 * @param {class} [options.FormData] [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) implementation to use, defaulting to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) global.
 * @param {FormDataFileAppender} [options.formDataAppendFile=formDataAppendFile] Customizes how extracted files are appended to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance.
 * @param {Function} [options.fetch] [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) global.
 * @param {FetchOptions} [options.fetchOptions] [`fetch` options]{@link FetchOptions}; overridden by upload requirements.
 * @param {string} [options.credentials] Overrides `options.fetchOptions.credentials`.
 * @param {object} [options.headers] Merges with and overrides `options.fetchOptions.headers`.
 * @param {boolean} [options.includeExtensions=false] Toggles sending `extensions` fields to the GraphQL server.
 * @returns {ApolloLink} A [terminating Apollo Link](https://apollographql.com/docs/link/overview/#terminating-links) capable of file uploads.
 * @example <caption>Ways to `import`.</caption>
 * ```js
 * import { createUploadLink } from 'apollo-upload-client';
 * ```
 *
 * ```js
 * import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
 * ```
 * @example <caption>Ways to `require`.</caption>
 * ```js
 * const { createUploadLink } = require('apollo-upload-client');
 * ```
 *
 * ```js
 * const createUploadLink = require('apollo-upload-client/public/createUploadLink');
 * ```
 * @example <caption>A basic Apollo Client setup.</caption>
 * ```js
 * import { ApolloClient, InMemoryCache } from '@apollo/client';
 * import { createUploadLink } from 'apollo-upload-client';
 *
 * const client = new ApolloClient({
 *   cache: new InMemoryCache(),
 *   link: createUploadLink(),
 * });
 * ```
 */
module.exports = function createUploadLink({
  uri: fetchUri = '/graphql',
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
    const uri = selectURI(operation, fetchUri);
    const context = operation.getContext();

    const {
      // Apollo Studio client awareness `name` and `version` can be configured
      // via `ApolloClient` constructor options:
      // https://www.apollographql.com/docs/studio/client-awareness/#using-apollo-server-and-apollo-client
      clientAwareness: { name, version },
      headers,
    } = context;

    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: {
        // Client awareness headers can be overridden by context `headers`.
        ...(name && { 'apollographql-client-name': name }),
        ...(version && { 'apollographql-client-version': version }),
        ...headers,
      },
    };

    const { options, body } = selectHttpOptionsAndBody(
      operation,
      fallbackHttpConfig,
      linkConfig,
      contextConfig
    );

    const { clone, files } = extractFiles(body, '', customIsExtractableFile);
    const payload = serializeFetchParameter(clone, 'Payload');

    if (files.size) {
      // Automatically set by fetch when the body is a FormData instance.
      delete options.headers['content-type'];

      // GraphQL multipart request spec:
      // https://github.com/jaydenseric/graphql-multipart-request-spec

      const RuntimeFormData = CustomFormData || FormData;

      const form = new RuntimeFormData();

      form.append('operations', payload);

      const map = {};
      let i = 0;
      files.forEach((paths) => {
        map[++i] = paths;
      });
      form.append('map', JSON.stringify(map));

      i = 0;
      files.forEach((paths, file) => {
        customFormDataAppendFile(form, ++i, file);
      });

      options.body = form;
    } else options.body = payload;

    const { controller } = createSignalIfSupported();

    if (controller) {
      if (options.signal)
        // Respect the user configured abort controller signal.
        options.signal.addEventListener('abort', () => {
          controller.abort();
        });

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
          if (!cleaningUp)
            error.result && error.result.errors && error.result.data
              ? // There is a GraphQL result with errors and data to forward.
                observer.next(error.result)
              : // Some sort of network or server error, e.g. an invalid fetch
                // URI or an `AbortError` from a user configured abort controller
                // signal.
                observer.error(error);
        });

      // Cleanup function.
      return () => {
        cleaningUp = true;

        // Abort fetch. It’s ok to signal an abort even when not fetching.
        if (controller) controller.abort();
      };
    });
  });
};
