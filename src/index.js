import { ApolloLink, Observable } from 'apollo-link'
import {
  selectURI,
  selectHttpOptionsAndBody,
  fallbackHttpConfig,
  serializeFetchParameter,
  createSignalIfSupported,
  parseAndCheckHttpResponse
} from 'apollo-link-http-common'
import {
  extractFilesOrStreams,
  isStream,
  isBrowserOrNative,
  NoFormDataException
} from './extract-streams-files'

export { ReactNativeFile } from 'extract-files'

export const createUploadLink = ({
  uri: fetchUri = '/graphql',
  fetch: linkFetch = fetch,
  fetchOptions,
  credentials,
  headers,
  includeExtensions,
  serverFormData
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

    const files = extractFilesOrStreams(body)
    const payload = serializeFetchParameter(body, 'Payload')
    if (files.length) {
      // Automatically set by fetch when the body is a FormData instance.
      delete options.headers['content-type']

      // GraphQL multipart request spec:
      // https://github.com/jaydenseric/graphql-multipart-request-spec
      if (isBrowserOrNative) options.body = new FormData()
      else if (serverFormData)
        // on the server - expecting to receive a FormData object following the same
        // specs as browser's FormData - tested with 'form-data' npm package only
        options.body = new serverFormData()
      else
        throw new NoFormDataException(`FormData function doesn't exist on this server version. \
We suggest you installing 'form-data' via npm and pass it as \
as an argument in 'createUploadLink' function : '{ serverFormData: FormData }'`)
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
      files.forEach(({ file }, index) => {
        if (isStream(file))
          // stream from a 'fs.createReadStream' call
          options.body.append(index, file)
        else if (isStream(file.stream)) {
          //busboy FileStream type - supporting apollo-upload-server

          // Incoming stream, to avoid form-data from calling getLengthSync we've to
          // overwrite the function that evalutes if it should be called
          // a public method was added to the form-data API
          // https://github.com/form-data/form-data/issues/196
          options.body.hasKnownLength = () => false

          const { filename, mimetype: contentType } = file
          options.body.append(index, file.stream, {
            filename,
            contentType
          })
        } else options.body.append(index, file, file.name)
      })
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
