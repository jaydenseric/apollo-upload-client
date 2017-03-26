import {HTTPFetchNetworkInterface, printAST} from 'apollo-client'
import RecursiveIterator from 'recursive-iterator'
import objectPath from 'object-path'

export class HTTPUploadNetworkInterface extends HTTPFetchNetworkInterface {
  fetchFromRemoteEndpoint ({request, options}) {
    let hasFile = false
    let variables
    let formData

    // Recursively search GraphQL input variables for FileList or File objects
    for (let {node, path} of new RecursiveIterator(request.variables)) {
      const isFileList = node instanceof window.FileList
      const isFile = node instanceof window.File

      // Only populate certain variables when nessesary
      if (isFileList || isFile) {
        if (!variables) variables = objectPath(request.variables)
        var pathString = path.join('.')
      }

      if (isFileList) {
        // Convert to FileList to File array. This is
        // nessesary so items can be manipulated correctly
        // by object-path. Either format may be used when
        // populating GraphQL variables on the client.
        variables.set(pathString, Array.from(node))
      } else if (isFile) {
        // Check if this is the first file found
        if (!hasFile) {
          hasFile = true
          formData = new window.FormData()
        }

        // Move the File object to a multipart form field
        // with the field name holding the original path
        // to the file in the GraphQL input variables.
        formData.append(pathString, node)
        variables.del(pathString)
      }
    }

    if (hasFile) {
      // Add Apollo fields to the form
      formData.append('operationName', request.operationName)
      formData.append('query', printAST(request.query))
      formData.append('variables', JSON.stringify(request.variables))

      // Send the multipart form
      return window.fetch(this._uri, {
        body: formData,
        method: 'POST',
        ...options,
        headers: {
          Accept: '*/*',
          ...options.headers
        }
      })
    } else {
      // No uploads, use the standard method
      return super.fetchFromRemoteEndpoint({request, options})
    }
  }
}

export function createNetworkInterface ({uri, ...options}) {
  return new HTTPUploadNetworkInterface(uri, options)
}
