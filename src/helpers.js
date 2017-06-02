import RecursiveIterator from 'recursive-iterator'
import objectPath from 'object-path'

/**
 * Extracts files from an Apollo Client Request, remembering positions in variables.
 * @see {@link http://dev.apollodata.com/core/apollo-client-api.html#Request}
 * @param {Object} request - Apollo GraphQL request to be sent to the server.
 * @param {Object} request.variables - GraphQL variables map.
 * @param {string} request.operationName - Name of the GraphQL query or mutation.
 * @returns {Object} - Request with files extracted to a list with their original object paths.
 */
export function extractRequestFiles (request) {
  const files = []
  let variablesPath

  // Recursively search GraphQL input variables for FileList or File objects
  for (let {node, path} of new RecursiveIterator(request.variables)) {
    let isFileList, isFile
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      isFileList = false
      isFile = typeof node === 'object' && Boolean('name' in node && 'type' in node && 'size' in node && 'path' in node)
      if (isFile) {
        // React Native requires uri
        node.uri = node.path
      }
    } else {
      isFileList = node instanceof window.FileList
      isFile = node instanceof window.File
    }

    if (isFileList || isFile) {
      // Only populate when necessary
      if (!variablesPath) variablesPath = objectPath(request.variables)

      const pathString = path.join('.')

      if (isFileList) {
        // Convert to FileList to File array. This is
        // necessary so items can be manipulated correctly
        // by object-path. Either format may be used when
        // populating GraphQL variables on the client.
        variablesPath.set(pathString, Array.from(node))
      } else if (isFile) {
        // Move the File object to a multipart form field
        // with the field name holding the original path
        // to the file in the GraphQL input variables.
        files.push({
          variablesPath: `variables.${pathString}`,
          file: node
        })
        variablesPath.del(pathString)
      }
    }
  }

  return {
    operation: request,
    files
  }
}
