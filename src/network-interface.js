import { HTTPFetchNetworkInterface, printAST } from 'apollo-client'
import { extractRequestFiles } from './helpers'

export class UploadHTTPFetchNetworkInterface extends HTTPFetchNetworkInterface {
  fetchFromRemoteEndpoint({ request, options }) {
    // Skip process if uploads are impossible
    if (typeof FormData !== 'undefined') {
      // Extract any files from the request
      const { operation, files } = extractRequestFiles(request)

      // Only initiate a multipart form request if there are uploads
      if (files.length) {
        // Convert query AST to string for transport
        operation.query = printAST(operation.query)

        // Build the form
        const formData = new FormData()
        formData.append('operations', JSON.stringify(operation))
        files.forEach(({ variablesPath, file }) =>
          formData.append(variablesPath, file)
        )

        // Send request
        return fetch(this._uri, {
          method: 'POST',
          body: formData,
          ...options
        })
      }
    }

    // Standard fetch method fallback
    return super.fetchFromRemoteEndpoint({ request, options })
  }
}

export function createNetworkInterface({ uri, opts = {} }) {
  return new UploadHTTPFetchNetworkInterface(uri, opts)
}
