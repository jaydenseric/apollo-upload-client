import { isFileInput, isFileInputList } from './file-input'
/**
 * Extracts files from an Apollo Client Request, remembering positions in
 * variables.
 * @see {@link http://dev.apollodata.com/core/apollo-client-api.html#Request}
 * @param {Object} request - Apollo GraphQL request to be sent to the server.
 * @param {Object} request.variables - GraphQL variables map.
 * @param {String} request.operationName - Name of the GraphQL query or mutation.
 * @returns {Object} - Request with files extracted to a list with their original object paths.
 */
export function extractRequestFiles(request) {
  const files = []

  // Recursively extracts files from an object tree
  function recurse(node, path = '') {
    // Iterate enumerable properties
    Object.keys(node).forEach(key => {
      if (isFileInput(node[key])) {
        // Extract the file and it's original path in the GraphQL input
        // variables for later transport as a multipart form field.
        files.push({
          variablesPath: `variables${path}.${key}`,
          file: node[key]
        })
        // Delete the file from the request variables. It will be repopulated on
        // the server by apollo-upload-server middleware. If an array item it
        // must be deleted without reindexing the array.
        delete node[key]
      } else {
        if (isFileInputList(node[key])) {
          // Convert to an array so recursion can extract the files
          node[key] = Array.from(node[key])
        }
        if (typeof node[key] == 'object') {
          recurse(node[key], `${path}.${key}`)
        }
      }
    })
  }

  // Recurse the request variables
  if (request.variables) {
    recurse(request.variables)
  }

  return { operation: request, files }
}
