import {HTTPFetchNetworkInterface} from 'apollo-client'
import {extractRequestFiles} from './helpers'

export class HTTPUploadNetworkInterface extends HTTPFetchNetworkInterface {
  fetchFromRemoteEndpoint ({request, options}) {
    const formData = new window.FormData()
    const {operation, files} = extractRequestFiles(request)
    formData.append('operations', JSON.stringify(operation))
    files.forEach(({variablesPath, file}) => formData.append(variablesPath, file))
    return window.fetch(this._uri, {
      method: 'POST',
      body: formData,
      ...options
    })
  }
}

export function createNetworkInterface ({uri, ...options}) {
  return new HTTPUploadNetworkInterface(uri, options)
}
