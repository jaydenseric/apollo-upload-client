import { ApolloLink, Observable } from 'apollo-link'
import { print } from 'graphql/language/printer'
import { extractFiles } from 'extract-files'

export { ReactNativeFile } from 'extract-files'

export const createUploadLink = (
  {
    includeExtensions,
    uri = '/graphql',
    fetchOptions: linkFetchOptions = {},
    fetch: fetcher = fetch
  } = {}
) =>
  new ApolloLink(
    ({ operationName, variables, query, extensions, getContext }) =>
      new Observable(observer => {
        const {
          uri: fetchUri = uri,
          fetchOptions: contextFetchOptions = {}
        } = getContext()

        const fetchOptions = {
          headers: {},
          ...linkFetchOptions,
          ...contextFetchOptions,
          method: 'POST'
        }

        const requestOperation = {
          operationName,
          variables,
          query: print(query)
        }

        if (includeExtensions) requestOperation.extensions = extensions

        const files = extractFiles(requestOperation)

        if (files.length) {
          fetchOptions.body = new FormData()
          fetchOptions.body.append(
            'operations',
            JSON.stringify(requestOperation)
          )
          files.forEach(({ path, file }) =>
            fetchOptions.body.append(path, file)
          )
        } else {
          fetchOptions.headers['content-type'] = 'application/json'
          fetchOptions.body = JSON.stringify(requestOperation)
        }

        fetcher(fetchUri, fetchOptions)
          .then(response =>
            response.json().then(result => {
              if (!response.ok)
                throw new Error(
                  `Error ${response.status}: ${response.statusText}.`
                )

              return result
            })
          )
          .then(result => {
            observer.next(result)
            observer.complete()
          })
          .catch(observer.error)
      })
  )
