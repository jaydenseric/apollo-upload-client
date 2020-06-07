'use strict';
const {
  ApolloLink,
  Observable,
  selectURI,
  selectHttpOptionsAndBody,
  fallbackHttpConfig,
  serializeFetchParameter,
  createSignalIfSupported,
  parseAndCheckHttpResponse,
  fromError,
  rewriteURIForGET,
} = require('@apollo/client');
const {
  extractFiles,
  isExtractableFile,
  ReactNativeFile,
} = require('extract-files');
/**
 * A React Native [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
 * substitute.
 *
 * Be aware that inspecting network requests with Chrome dev tools interferes
 * with the React Native `FormData` implementation, causing network errors.
 * @kind typedef
 * @name ReactNativeFileSubstitute
 * @type {object}
 * @see [`extract-files` `ReactNativeFileSubstitute` docs](https://github.com/jaydenseric/extract-files#type-reactnativefilesubstitute).
 * @see [React Native `FormData` polyfill source](https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js#L34).
 * @prop {string} uri Filesystem path.
 * @prop {string} [name] File name.
 * @prop {string} [type] File content type. Some environments (particularly Android) require a valid MIME type; Expo `ImageResult.type` is unreliable as it can be just `image`.
 * @example <caption>A camera roll file.</caption>
 * ```js
 * {
 *   uri: uriFromCameraRoll,
 *   name: 'a.jpg',
 *   type: 'image/jpeg'
 * }
 * ```
 */

/**
 * Used to mark [React Native `File` substitutes]{@link ReactNativeFileSubstitute}
 * as it’s too risky to assume all objects with `uri`, `type` and `name`
 * properties are extractable files.
 * @kind class
 * @name ReactNativeFile
 * @param {ReactNativeFileSubstitute} file A React Native [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) substitute.
 * @see [`extract-files` `ReactNativeFile` docs](https://github.com/jaydenseric/extract-files#class-reactnativefile).
 * @example <caption>A React Native file that can be used in query or mutation variables.</caption>
 * ```js
 * const { ReactNativeFile } = require('apollo-upload-client')
 *
 * const file = new ReactNativeFile({
 *   uri: uriFromCameraRoll,
 *   name: 'a.jpg',
 *   type: 'image/jpeg'
 * })
 * ```
 */
exports.ReactNativeFile = ReactNativeFile;

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
 * A function that checks if a value is an extractable file.
 * @kind typedef
 * @name ExtractableFileMatcher
 * @type {Function}
 * @param {*} value Value to check.
 * @returns {boolean} Is the value an extractable file.
 * @see [`isExtractableFile`]{@link isExtractableFile} has this type.
 * @example <caption>How to check for the default exactable files, as well as a custom type of file.</caption>
 * ```js
 * const { isExtractableFile } = require('apollo-upload-client')
 *
 * const isExtractableFileEnhanced = value =>
 *   isExtractableFile(value) ||
 *   (typeof CustomFile !== 'undefined' && value instanceof CustomFile)
 * ```
 */

/**
 * The default implementation for [`createUploadLink`]{@link createUploadLink}
 * `options.isExtractableFile`.
 * @kind function
 * @name isExtractableFile
 * @type {ExtractableFileMatcher}
 * @param {*} value Value to check.
 * @returns {boolean} Is the value an extractable file.
 * @see [`extract-files` `isExtractableFile` docs](https://github.com/jaydenseric/extract-files#function-isextractablefile).
 */
exports.isExtractableFile = isExtractableFile;

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

/**
 * The default implementation for [`createUploadLink`]{@link createUploadLink}
 * `options.formDataAppendFile` that uses the standard
 * [`FormData.append`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/append)
 * method.
 * @kind function
 * @name formDataAppendFile
 * @type {FormDataFileAppender}
 * @param {FormData} formData [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance to append the specified file to.
 * @param {string} fieldName Field name for the file.
 * @param {*} file File to append.
 */
function formDataAppendFile(formData, fieldName, file) {
  formData.append(fieldName, file, file.name);
}

exports.formDataAppendFile = formDataAppendFile;

/**
 * Creates a terminating [Apollo Link](https://apollographql.com/docs/link)
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
 * @param {string} [options.uri=/graphql] GraphQL endpoint URI.
 * @param {ExtractableFileMatcher} [options.isExtractableFile=isExtractableFile] Customizes how files are matched in the GraphQL operation for extraction.
 * @param {class} [options.FormData] [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) implementation to use, defaulting to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) global.
 * @param {FormDataFileAppender} [options.formDataAppendFile=formDataAppendFile] Customizes how extracted files are appended to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance.
 * @param {Function} [options.fetch] [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) global.
 * @param {FetchOptions} [options.fetchOptions] [`fetch` options]{@link FetchOptions}; overridden by upload requirements.
 * @param {string} [options.credentials] Overrides `options.fetchOptions.credentials`.
 * @param {object} [options.headers] Merges with and overrides `options.fetchOptions.headers`.
 * @param {boolean} [options.includeExtensions=false] Toggles sending `extensions` fields to the GraphQL server.
 * @returns {ApolloLink} A terminating [Apollo Link](https://apollographql.com/docs/link) capable of file uploads.
 * @example <caption>A basic Apollo Client setup.</caption>
 * ```js
 * const { ApolloClient } = require('apollo-client')
 * const { InMemoryCache } = require('apollo-cache-inmemory')
 * const { createUploadLink } = require('apollo-upload-client')
 *
 * const client = new ApolloClient({
 *   cache: new InMemoryCache(),
 *   link: createUploadLink()
 * })
 * ```
 */
exports.createUploadLink = ({
  uri: fetchUri = '/graphql',
  isExtractableFile: customIsExtractableFile = isExtractableFile,
  FormData: CustomFormData,
  formDataAppendFile: customFormDataAppendFile = formDataAppendFile,
  fetch: customFetch,
  fetchOptions,
  credentials,
  headers,
  includeExtensions,
  useGETForQueries,
} = {}) => {
  const linkConfig = {
    http: { includeExtensions },
    options: fetchOptions,
    credentials,
    headers,
  };

  return new ApolloLink((operation) => {
    let uri = selectURI(operation, fetchUri);
    const context = operation.getContext();

    // Apollo Graph Manager client awareness:
    // https://apollographql.com/docs/graph-manager/client-awareness

    const {
      // From Apollo Client config.
      clientAwareness: { name, version } = {},
      headers,
    } = context;

    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: {
        // Client awareness headers are context overridable.
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
    } else {
      // If requested, set method to GET if there are no mutations.
      if (
        useGETForQueries &&
        !operation.query.definitions.some(
          (definition) =>
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'mutation'
        )
      )
        options.method = 'GET';

      if (options.method === 'GET') {
        const { newURI, parseError } = rewriteURIForGET(uri, body);
        if (parseError) return fromError(parseError);
        uri = newURI;
      } else options.body = payload;
    }

    return new Observable((observer) => {
      // If no abort controller signal was provided in fetch options, and the
      // environment supports the AbortController interface, create and use a
      // default abort controller.
      let abortController;
      if (!options.signal) {
        const { controller } = createSignalIfSupported();
        if (controller) {
          abortController = controller;
          options.signal = abortController.signal;
        }
      }

      const runtimeFetch = customFetch || fetch;

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
          if (error.name === 'AbortError')
            // Fetch was aborted.
            return;

          if (error.result && error.result.errors && error.result.data)
            // There is a GraphQL result to forward.
            observer.next(error.result);

          observer.error(error);
        });

      // Cleanup function.
      return () => {
        if (abortController)
          // Abort fetch.
          abortController.abort();
      };
    });
  });
};
