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

    // hold files promises (will only have items for server2server uploads)
    const promises = []
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
        else if (file instanceof Promise)
          // cover the apollo-upload-server files wrapped in Promises
          promises.push(
            new Promise((resolve, reject) => {
              file
                .then(file => {
                  const { filename, mimetype: contentType } = file
                  const bufs = []
                  file.stream.on('data', function(buf) {
                    bufs.push(buf)
                  })
                  file.stream.on('end', function() {
                    const buffer = Buffer.concat(bufs)
                    const knownLength = buffer.byteLength
                    options.body.append(index, buffer, {
                      filename: filename,
                      contentType,
                      knownLength
                    })
                    resolve()
                  })
                  file.stream.on('error', reject)
                })
                .catch(reject)
            })
          )
        else options.body.append(index, file, file.name)
      })
    } else options.body = payload
    return new Observable(observer => {
      // Allow aborting fetch, if supported.
      const { controller, signal } = createSignalIfSupported()
      if (controller) options.signal = signal

      // process all FileStream (if any) and submit request
      Promise.all(promises)
        .then(() => {
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
        })
        .catch(e => {
          throw { message: 'Error while draining stream.', error: e }
        })

      // Cleanup function.
      return () => {
        // Abort fetch.
        if (controller) controller.abort()
      }
    })
  })
}
