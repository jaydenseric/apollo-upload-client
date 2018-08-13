import { ApolloLink, Observable } from 'apollo-link'
import {
  selectURI,
  selectHttpOptionsAndBody,
  fallbackHttpConfig,
  serializeFetchParameter,
  createSignalIfSupported,
  parseAndCheckHttpResponse
} from 'apollo-link-http-common'
import { extractFiles, ReactNativeFile } from 'extract-files'


/**
 * GraphQL request `fetch` options.
 * @kind typedef
 * @name FetchOptions
 * @type {Object}
 * @see {@link https://github.github.io/fetch/#options polyfillable fetch options}
 * @prop {Object} headers HTTP request headers.
 * @prop {string} [credentials] Authentication credentials mode.
 */

/**
 * Creates a file upload terminating `ApolloLink` instance. Options match [`createHttpLink`](https://www.apollographql.com/docs/link/links/http.html#options).
 * @see {@link https://github.com/jaydenseric/graphql-multipart-request-spec GraphQL multipart request spec}
 * @see {@link https://github.com/apollographql/apollo-link apollo-link on Github}
 * @kind function
 * @name createUploadLink
 * @param {Object} options Options.
 * @param {string} [options.uri=/graphql] GraphQL endpoint URI.
 * @param {function} [options.fetch] [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the `fetch` global.
 * @param {FetchOptions} [options.fetchOptions] `fetch` options; overridden by upload requirements.
 * @param {string} [options.credentials] Overrides `fetchOptions.credentials`.
 * @param {Object} [options.headers] Merges with and overrides `fetchOptions.headers`.
 * @param {boolean} [options.includeExtensions=false] Toggles sending `extensions` fields to the GraphQL server.
 * @returns {ApolloLink} File upload terminating Apollo link.
 */
export const createUploadLink = ({
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
    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: context.headers
    }

    const { options, body } = selectHttpOptionsAndBody(
      operation,
      fallbackHttpConfig,
      linkConfig,
      contextConfig
    )

    const files = extractFiles(body)
    const payload = serializeFetchParameter(body, 'Payload')

    if (files.length) {
      // Automatically set by fetch when the body is a FormData instance.
      delete options.headers['content-type']

      // GraphQL multipart request spec:
      // https://github.com/jaydenseric/graphql-multipart-request-spec
      options.body = new FormData()
      options.body.append('operations', payload)
      options.body.append(
        'map',
        JSON.stringify(
          files.reduce((map, { path }, index) => {
            map[`${index}`] = [path]
            return map
          }, {})
        )
      )
      files.forEach(({ file }, index) =>
        options.body.append(index, file, file.name)
      )
    } else options.body = payload

    return new Observable(observer => {
      // Allow aborting fetch, if supported.
      const { controller, signal } = createSignalIfSupported()
      if (controller) options.signal = signal

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
