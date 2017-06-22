/**
 * @flow
 */
// On Android we need a polyfill for Symbol
import Symbol from 'es6-symbol/polyfill'

const IsFile = Symbol('is file')
const IsFileList = Symbol('is file list')

export default class FileInput {
  constructor({ name, type, uri } = {}) {
    this[IsFile] = true
    this.name = name
    this.type = type
    this.uri = uri
  }

  static fromArray = (array, defaultType = 'image/png') =>
    Array.isArray(array)
      ? array.map(
          ({ name, type, uri }, index) =>
            new FileInput({
              name: name || `file_${index}`,
              type: type || defaultType,
              uri
            })
        )
      : null
}

if (typeof window !== 'undefined') {
  if (typeof window.File !== 'undefined') {
    window.File[IsFile] = true
  }
  if (typeof window.FileList !== 'undefined') {
    window.FileList[IsFileList] = true
  }
}

export const isFileInput = node => node && node[IsFile]
export const isFileInputList = node =>
  node && ((Array.isArray(node) && node.every(isFileInput)) || node[IsFileList])
