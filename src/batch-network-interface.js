import {HTTPBatchedNetworkInterface} from 'apollo-client'
import {extractRequestFiles} from './helpers'

export class HTTPUploadBatchNetworkInterface extends HTTPBatchedNetworkInterface {
  batchedFetchFromRemoteEndpoint ({requests, options}) {
    const formData = new window.FormData()
    const operations = requests.map((request, index) => {
      const {operation, files} = extractRequestFiles(request)
      files.forEach(({variablesPath, file}) => formData.append(`${index}.${variablesPath}`, file))
      return operation
    })
    formData.append('operations', JSON.stringify(operations))
    return window.fetch(this._uri, {
      method: 'POST',
      body: formData,
      ...options
    })
  }
}

export function createBatchNetworkInterface ({uri, batchInterval, ...options}) {
  return new HTTPUploadBatchNetworkInterface(uri, batchInterval, options)
}
