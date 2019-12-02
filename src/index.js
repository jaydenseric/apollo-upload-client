const { ApolloLink, Observable } = require('apollo-link')
const {
  selectURI,
  selectHttpOptionsAndBody,
  fallbackHttpConfig,
  serializeFetchParameter,
  createSignalIfSupported,
  parseAndCheckHttpResponse
} = require('apollo-link-http-common')
const { extractFiles, ReactNativeFile } = require('extract-files')

/**
 * A React Native [`File`](https://developer.mozilla.org/docs/web/api/file)
 * substitute.
 *
 * Be aware that inspecting network requests with Chrome dev tools interferes
 * with the React Native `FormData` implementation, causing network errors.
 * @kind typedef
 * @name ReactNativeFileSubstitute
 * @type {object}
 * @see [`extract-files` docs](https://github.com/jaydenseric/extract-files#type-reactnativefilesubstitute).
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
 * Used to mark a
 * [React Native `File` substitute]{@link ReactNativeFileSubstitute}.
 * It’s too risky to assume all objects with `uri`, `type` and `name` properties
 * are files to extract. Re-exported from [`extract-files`](https://npm.im/extract-files)
 * for convenience.
 * @kind class
 * @name ReactNativeFile
 * @param {ReactNativeFileSubstitute} file A React Native [`File`](https://developer.mozilla.org/docs/web/api/file) substitute.
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
exports.ReactNativeFile = ReactNativeFile

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
 * Creates a terminating [Apollo Link](https://apollographql.com/docs/link)
 * capable of file uploads. Options match [`createHttpLink`](https://apollographql.com/docs/link/links/http#options).
 * @see [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec).
 * @see [apollo-link on GitHub](https://github.com/apollographql/apollo-link).
 * @kind function
 * @name createUploadLink
 * @param {object} options Options.
 * @param {string} [options.uri=/graphql] GraphQL endpoint URI.
 * @param {Function} [options.fetch] [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the `fetch` global.
 * @param {FetchOptions} [options.fetchOptions] `fetch` options; overridden by upload requirements.
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
  fetch: linkFetch = fetch,
  fetchOptions,
  credentials,
  headers,
  includeExtensions
} = {}) => {
  const linkConfig = {
    http: { includeExtensions },
    options: fetchOptions,
    credentials,
    headers
  }

  return new ApolloLink(operation => {
    const uri = selectURI(operation, fetchUri)
    const context = operation.getContext()

    // Apollo Engine client awareness:
    // https://apollographql.com/docs/platform/client-awareness

    const {
      // From Apollo Client config.
      clientAwareness: { name, version } = {},
      headers
    } = context

    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: {
        // Client awareness headers are context overridable.
        ...(name && { 'apollographql-client-name': name }),
        ...(version && { 'apollographql-client-version': version }),
        ...headers
      }
    }

    const { options, body } = selectHttpOptionsAndBody(
      operation,
      fallbackHttpConfig,
      linkConfig,
      contextConfig
    )

    const { clone, files } = extractFiles(body)
    const payload = serializeFetchParameter(clone, 'Payload')

    if (files.size) {
      // Automatically set by fetch when the body is a FormData instance.
      delete options.headers['content-type']

      // GraphQL multipart request spec:
      // https://github.com/jaydenseric/graphql-multipart-request-spec

      const form = new FormData()

      form.append('operations', payload)

      const map = {}
      let i = 0
      files.forEach(paths => {
        map[++i] = paths
      })
      form.append('map', JSON.stringify(map))

      i = 0
      files.forEach((paths, file) => {
        form.append(++i, file, file.name)
      })

      options.body = form
    } else options.body = payload

    return new Observable(observer => {
      // Allow aborting fetch, if supported.
      let controller
      if (!options.signal) {
        const { controller: _controller, signal } = createSignalIfSupported()
        controller = _controller
        if (controller) options.signal = signal
      }

      linkFetch(uri, options)
        .then(response => {
          // Forward the response on the context.
          operation.setContext({ response })
          return response
        })
        .then(parseAndCheckHttpResponse(operation))
        .then(result => {
          observer.next(result)
          observer.complete()
        })
        .catch(error => {
          if (error.name === 'AbortError')
            // Fetch was aborted.
            return

          if (error.result && error.result.errors && error.result.data)
            // There is a GraphQL result to forward.
            observer.next(error.result)

          observer.error(error)
        })

      // Cleanup function.
      return () => {
        // Abort fetch.
        if (controller) controller.abort()
      }
    })
  })
}
