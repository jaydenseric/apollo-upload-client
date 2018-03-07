import extractFiles from 'extract-files'
import apolloLinkDefault, * as apolloLinkExports from 'apollo-link'
import apolloLinkHttpCommonDefault, * as apolloLinkHttpCommonExports from 'apollo-link-http-common'

// See: https://github.com/jaydenseric/apollo-upload-client/issues/72
const apolloLink = apolloLinkDefault || apolloLinkExports
const apolloLinkHttpCommon =
  apolloLinkHttpCommonDefault || apolloLinkHttpCommonExports

export { ReactNativeFile } from 'extract-files'

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

  return new apolloLink.ApolloLink(operation => {
    const uri = apolloLinkHttpCommon.selectURI(operation, fetchUri)
    const context = operation.getContext()
    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: context.headers
    }

    const { options, body } = apolloLinkHttpCommon.selectHttpOptionsAndBody(
      operation,
      apolloLinkHttpCommon.fallbackHttpConfig,
      linkConfig,
      contextConfig
    )

    const files = extractFiles(body)
    const payload = apolloLinkHttpCommon.serializeFetchParameter(
      body,
      'Payload'
    )

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

    return new apolloLink.Observable(observer => {
      // Allow aborting fetch, if supported.
      const {
        controller,
        signal
      } = apolloLinkHttpCommon.createSignalIfSupported()
      if (controller) options.signal = signal

      linkFetch(uri, options)
        .then(response => {
          // Forward the response on the context.
          operation.setContext({ response })
          return response
        })
        .then(apolloLinkHttpCommon.parseAndCheckHttpResponse(operation))
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
