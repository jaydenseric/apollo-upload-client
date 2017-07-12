import { HTTPBatchedNetworkInterface, printAST } from 'apollo-client'
import { extractFiles } from 'extract-files'

export class UploadHTTPBatchedNetworkInterface extends HTTPBatchedNetworkInterface {
  batchedFetchFromRemoteEndpoint({ requests, options }) {
    // Continue if uploads are possible
    if (typeof FormData !== 'undefined') {
      // Extract any files from the each request variables
      const files = requests.reduce(
        (files, request, index) =>
          files.concat(extractFiles(request.variables, `${index}.variables`)),
        []
      )

      // Continue if there are files to upload
      if (files.length) {
        // For each request convert query AST to string for transport
        requests.forEach(request => {
          request.query = printAST(request.query)
        })

        // Construct a multipart form
        const formData = new FormData()
        formData.append('operations', JSON.stringify(requests))
        files.forEach(({ path, file }) => formData.append(path, file))

        // Send request
        return fetch(this._uri, {
          method: 'POST',
          body: formData,
          ...options
        })
      }
    }

    // Standard fetch method fallback
    return super.batchedFetchFromRemoteEndpoint({ requests, options })
  }
}

export const createBatchingNetworkInterface = ({
  opts: fetchOpts = {},
  ...options
}) => new UploadHTTPBatchedNetworkInterface({ fetchOpts, ...options })
