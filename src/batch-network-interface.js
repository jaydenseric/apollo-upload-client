import {HTTPBatchedNetworkInterface, printAST} from 'apollo-client';
import {extractRequestFiles} from './helpers';

export class HTTPUploadBatchNetworkInterface
  extends HTTPBatchedNetworkInterface {
  batchedFetchFromRemoteEndpoint({requests, options}) {
    // Skip upload proccess if SSR
    if (typeof window !== 'undefined') {
      // Extract any files from the request
      const batchFiles = [];
      const batchOperations = requests.map((request, operationIndex) => {
        const {operation, files} = extractRequestFiles(request);
        if (files.length) {
          batchFiles.push({
            operationIndex,
            files,
          });
        }
        return operation;
      });

      // Only initiate a multipart form request if there are uploads
      if (batchFiles.length) {
        // For each operation, convert query AST to string for transport
        batchOperations.forEach(operation => {
          operation.query = printAST(operation.query);
        });

        // Build the form
        const formData = new window.FormData();
        formData.append('operations', JSON.stringify(batchOperations));
        batchFiles.forEach(({operationIndex, files}) => {
          files.forEach(({variablesPath, file}) =>
            formData.append(`${operationIndex}.${variablesPath}`, file)
          );
        });

        // Send request
        return window.fetch(this._uri, {
          method: 'POST',
          body: formData,
          ...options.opts,
          ...options,
        });
      }
    }

    // Standard fetch method fallback
    return super.batchedFetchFromRemoteEndpoint({requests, options});
  }
}

export function createBatchNetworkInterface({uri, batchInterval, opts = {}}) {
  return new HTTPUploadBatchNetworkInterface(uri, batchInterval, opts);
}
