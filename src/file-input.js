/**
 * @flow
 */

export class FileInput {
  constructor({ name, type, uri } = {}) {
    this.name = name
    this.type = type
    this.uri = uri
  }

  static fromArray = (array, defaultType = 'image/png') =>
    Array.isArray(array)
      ? array.map(
          (node, index) =>
            node
              ? new FileInput({
                  name: node.name || 'file_' + index,
                  type: node.type || defaultType,
                  uri: node.uri
                })
              : null
        )
      : null
}

export const isFile = node =>
  typeof File !== 'undefined'
    ? node instanceof File // Web file
    : node instanceof FileInput // React Native file
