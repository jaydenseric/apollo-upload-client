/**
 * Extracts files and their positions within variables from an Apollo Client
 * request.
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
      // Skip non-object
      if (typeof node[key] !== 'object' || node[key] === null) return

      // Check if the node is a file
      if (
        (typeof File !== 'undefined' && node[key] instanceof File) ||
        node[key] instanceof ReactNativeFile
      ) {
        // Extract the file and it's original path in the GraphQL input
        // variables for later transport as a multipart form field.
        files.push({
          variablesPath: `variables${path}.${key}`,
          file: node[key]
        })

        // Delete the file from the request variables. It gets repopulated on
        // the server by apollo-upload-server middleware. If an array item it
        // must be deleted without reindexing the array.
        delete node[key]

        // No deeper recursion
        return
      }

      // Convert file list to an array so recursion can reach the files
      if (typeof FileList !== 'undefined' && node[key] instanceof FileList)
        node[key] = Array.from(node[key])

      // Recurse into child node
      recurse(node[key], `${path}.${key}`)
    })
  }

  // Recurse request variables
  if (request.variables) recurse(request.variables)

  return { operation: request, files }
}

/**
 * A React Native file.
 */
export class ReactNativeFile {
  /**
   * A React Native FormData file object.
   * @see {@link https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js#L34}
   * @typedef {Object} ReactNativeFileObject
   * @property {String} uri - File system path.
   * @property {String} [type] - File content type.
   * @property {String} [name] - File name.
   */

  /**
   * Constructs a new file.
   * @param {ReactNativeFileObject} file
   * @example
   * const file = new ReactNativeFile({
   *  uri: uriFromCameraRoll,
   *  type: 'image/jpeg',
   *  name: 'photo.jpg'
   * })
   */
  constructor({ uri, type, name }) {
    this.uri = uri
    this.type = type
    this.name = name
  }

  /**
   * Creates an array of file instances.
   * @param {ReactNativeFileObject[]} files
   * @example
   * const files = ReactNativeFile.list({
   *   uri: uriFromCameraRoll1,
   *   type: 'image/jpeg',
   *   name: 'photo-1.jpg'
   * }, {
   *   uri: uriFromCameraRoll2,
   *   type: 'image/jpeg',
   *   name: 'photo-2.jpg'
   * })
   */
  static list = files => files.map(file => new ReactNativeFile(file))
}
