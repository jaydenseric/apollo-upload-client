import {HTTPFetchNetworkInterface, printAST} from 'apollo-client'
import RecursiveIterator from 'recursive-iterator'
import objectPath from 'object-path'

export default function createNetworkInterface (opts) {
  const {uri} = opts
  return new UploadHTTPFetchNetworkInterface(uri, opts)
}

class UploadHTTPFetchNetworkInterface extends HTTPFetchNetworkInterface {
  constructor (...args) {
    super(...args)

    // Store the normal fetch method so it can be used if there are no uploads
    const normalFetch = this.fetchFromRemoteEndpoint.bind(this)

    this.fetchFromRemoteEndpoint = ({request, options}) => {
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

      // If there are no uploads use the original fetch method
      return hasFile ? this.uploadFetch({request, options}, formData) : normalFetch({request, options})
    }
  }

  uploadFetch ({request, options}, formData) {
    // Add Apollo fields to the form
    formData.append('operationName', request.operationName)
    formData.append('query', printAST(request.query))
    formData.append('variables', JSON.stringify(request.variables))

    // Send the multipart form
    return window.fetch(this._opts.uri, {
      ...options,
      body: formData,
      method: 'POST',
      headers: {
        Accept: '*/*',
        ...options.headers
      }
    })
  }
}
