import { HTTPBatchedNetworkInterface, printAST } from 'apollo-client'
import { extractRequestFiles } from './helpers'

export class UploadHTTPBatchedNetworkInterface extends HTTPBatchedNetworkInterface {
  batchedFetchFromRemoteEndpoint({ requests, options }) {
    // Skip process if uploads are impossible
    if (typeof FormData !== 'undefined') {
      // Extract any files from the request
      const batchFiles = []
      const batchOperations = requests.map((request, operationIndex) => {
        const { operation, files } = extractRequestFiles(request)
        if (files.length) {
          batchFiles.push({
            operationIndex,
            files
          })
        }
        return operation
      })

      // Only initiate a multipart form request if there are uploads
      if (batchFiles.length) {
        // For each operation, convert query AST to string for transport
        batchOperations.forEach(operation => {
          operation.query = printAST(operation.query)
        })

        // Build the form
        const formData = new FormData()
        formData.append('operations', JSON.stringify(batchOperations))
        batchFiles.forEach(({ operationIndex, files }) => {
          files.forEach(({ variablesPath, file }) =>
            formData.append(`${operationIndex}.${variablesPath}`, file)
          )
        })

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
