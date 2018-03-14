import extractFiles, { isObject } from 'extract-files'

export const isStream = obj => {
  return (
    obj &&
    typeof obj.pipe === 'function' &&
    typeof obj._read === 'function' &&
    typeof obj._readableState === 'object' &&
    obj.readable !== false
  )
}

export const extractFilesOrStreams = (tree, treePath) => {
  try {
    //if FormData exists we're in browser env
    if (FormData !== void 0) return extractFiles(tree)
  } catch (e) {
    if (treePath === void 0) treePath = ''
    var files = []
    var recurse = function recurse(node, nodePath) {
      Object.keys(node).forEach(function(key) {
        if (!isObject(node[key])) return
        var path = '' + nodePath + key
        // get streams and ajdust to busboy obj.stream format
        if (isStream(node[key]) || isStream(node[key].stream)) {
          files.push({
            path: path,
            file: node[key]
          })
          node[key] = null
          return
        } else if (node[key].length) node[key] = Array.prototype.slice.call(node[key])
        recurse(node[key], path + '.')
      })
    }

    if (isObject(tree))
      recurse(tree, treePath === '' ? treePath : treePath + '.')
    return files
  }
}
