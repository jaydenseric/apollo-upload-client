# ![Apollo upload client](https://cdn.rawgit.com/jaydenseric/apollo-upload-client/v5.0.0-alpha.1/apollo-upload-logo.svg)

![NPM version](https://img.shields.io/npm/v/apollo-upload-client.svg?style=flat-square) ![Github issues](https://img.shields.io/github/issues/jaydenseric/apollo-upload-client.svg?style=flat-square) ![Github stars](https://img.shields.io/github/stars/jaydenseric/apollo-upload-client.svg?style=flat-square)

Enhances [Apollo](http://apollodata.com) for intuitive file uploads via GraphQL mutations or queries. Use with [Apollo upload server](https://github.com/jaydenseric/apollo-upload-server).

- [> 2%](http://browserl.ist/?q=%3E+2%25) market share browsers and React Native supported.
- [MIT license](https://en.wikipedia.org/wiki/MIT_License).

## Setup

Install with [npm](https://npmjs.com):

```
npm install apollo-upload-client
```

Setup Apollo client with a special network interface:

```js
import ApolloClient from 'apollo-client'
import { createNetworkInterface } from 'apollo-upload-client'

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: '/graphql'
  })
})
```

Alternatively enable [query batching](http://dev.apollodata.com/core/network.html#query-batching):

```js
import ApolloClient from 'apollo-client'
import { createBatchingNetworkInterface } from 'apollo-upload-client'

const client = new ApolloClient({
  networkInterface: createBatchingNetworkInterface({
    uri: '/graphql',
    batchInterval: 10
  })
})
```

Also setup [Apollo upload server](https://github.com/jaydenseric/apollo-upload-server).

## Usage

Once setup, you will be able to use [`File`](https://developer.mozilla.org/en/docs/Web/API/File) and [`FileList`](https://developer.mozilla.org/en/docs/Web/API/FileList) objects, `File` arrays, and `ReactNativeFile` instances within query or mutation input variables.

With [`apollo-upload-server`](https://github.com/jaydenseric/apollo-upload-server) setup, the files upload to a temp directory. The paths and metadata will be available under the variable name in the resolver. See the [server usage](https://github.com/jaydenseric/apollo-upload-server#usage).

### Single file

See [server usage for this example](https://github.com/jaydenseric/apollo-upload-server#single-file).

```js
import React from 'react'
import { graphql, gql } from 'react-apollo'

export default graphql(gql`
  mutation updateUserAvatar($userId: String!, $avatar: File!) {
    updateUserAvatar(userId: $userId, avatar: $avatar) {
      id
    }
  }
`)(({ userId, mutate }) => {
  const handleChange = ({ target }) => {
    if (target.validity.valid) {
      mutate({
        variables: {
          userId,
          avatar: target.files[0]
        }
      }).then(({ data }) => console.log('Mutation response:', data))
    }
  }

  return (
    <input
      type="file"
      accept={'image/jpeg,image/png'}
      required
      onChange={handleChange}
    />
  )
})
```

### Multiple files

See [server usage for this example](https://github.com/jaydenseric/apollo-upload-server#multiple-files).

```js
import React from 'react'
import { graphql, gql } from 'react-apollo'

export default graphql(gql`
  mutation updateGallery($galleryId: String!, $images: [File!]!) {
    updateGallery(galleryId: $galleryId, images: $images) {
      id
    }
  }
`)(({ galleryId, mutate }) => {
  const handleChange = ({ target }) => {
    if (target.validity.valid) {
      mutate({
        variables: {
          galleryId,
          images: target.files
        }
      }).then(({ data }) => console.log('Mutation response:', data))
    }
  }

  return (
    <input
      type="file"
      accept={'image/jpeg,image/png'}
      multiple
      required
      onChange={handleChange}
    />
  )
})
```

### React Native

React Native [polyfills FormData](https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js) under the hood and objects with the properties `uri`, `type` and `name` substitute `window.File`. Assuming all objects with those properties in variables are files would be risky. Use `ReactNativeFile` instances in query or mutation variables to mark files for upload:

```js
import { ReactNativeFile } from 'apollo-upload-client'

// ✂

// Single file
const file = new ReactNativeFile({
  uri: uriFromCameraRoll,
  type: 'image/jpeg',
  name: 'photo.jpg'
})

// Multiple files
const files = ReactNativeFile.list({
  uri: uriFromCameraRoll1,
  type: 'image/jpeg',
  name: 'photo-1.jpg'
}, {
  uri: uriFromCameraRoll2,
  type: 'image/jpeg',
  name: 'photo-2.jpg'
})

// ✂
```

## Inspiration

- [@HriBB](https://github.com/HriBB)’s [graphql-server-express-upload](https://github.com/HriBB/graphql-server-express-upload) and [apollo-upload-network-interface](https://github.com/HriBB/apollo-upload-network-interface) projects.
- [@danielbuechele](https://github.com/danielbuechele)’s [Medium article](https://medium.com/@danielbuechele/file-uploads-with-graphql-and-apollo-5502bbf3941e).
- [@jessedvrs](https://github.com/jessedvrs)’s [example code](https://github.com/HriBB/apollo-upload-network-interface/issues/5#issuecomment-280018715).
