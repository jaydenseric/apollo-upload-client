![Apollo upload logo](apollo-upload-logo.svg)

# apollo-upload-client

[![npm version](https://img.shields.io/npm/v/apollo-upload-client.svg)](https://npm.im/apollo-upload-client)
![Licence](https://img.shields.io/npm/l/apollo-upload-client.svg)
[![Github issues](https://img.shields.io/github/issues/jaydenseric/apollo-upload-client.svg)](https://github.com/jaydenseric/apollo-upload-client/issues)
[![Github stars](https://img.shields.io/github/stars/jaydenseric/apollo-upload-client.svg)](https://github.com/jaydenseric/apollo-upload-client/stargazers)

Enhances [Apollo](http://apollodata.com) for intuitive file uploads via GraphQL mutations or queries. Use with [apollo-upload-server](https://github.com/jaydenseric/apollo-upload-server).

## Setup

Install this package and peer dependencies with [npm](https://npmjs.com):

```
npm install apollo-upload-client apollo-link graphql
```

Initialize Apollo Client with this terminating link:

```js
import { createUploadLink } from 'apollo-upload-client'

const link = createUploadLink({
  // Options…
})
```

Also setup [apollo-upload-server](https://github.com/jaydenseric/apollo-upload-server).

## Usage

Once setup, you will be able to use [`FileList`](https://developer.mozilla.org/en/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en/docs/Web/API/File) and [`ReactNativeFile`](https://github.com/jaydenseric/apollo-upload-client#react-native) instances anywhere within mutation or query input variables.

With [`apollo-upload-server`](https://github.com/jaydenseric/apollo-upload-server) setup, the files upload to a temp directory. `Upload` input type metadata replaces file instances in the arguments received by the resolver. See the [server usage](https://github.com/jaydenseric/apollo-upload-server#usage).

### Single file

See [server usage for this example](https://github.com/jaydenseric/apollo-upload-server#single-file).

```jsx
import React from 'react'
import { graphql, gql } from 'react-apollo'

export default graphql(gql`
  mutation($userId: String!, $avatar: Upload!) {
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

```jsx
import React from 'react'
import { graphql, gql } from 'react-apollo'

export default graphql(gql`
  mutation($galleryId: String!, $images: [Upload!]!) {
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

React Native [polyfills FormData](https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js) under the hood and objects with the properties `uri`, `type` and `name` substitute `window.File`. It would be risky to assume all objects with those properties in variables are files. Use `ReactNativeFile` instances in query or mutation variables to explicitly mark files for upload:

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
const files = ReactNativeFile.list([{
  uri: uriFromCameraRoll1,
  type: 'image/jpeg',
  name: 'photo-1.jpg'
}, {
  uri: uriFromCameraRoll2,
  type: 'image/jpeg',
  name: 'photo-2.jpg'
}])

// ✂
```

## Support

- [> 2%](http://browserl.ist/?q=%3E+2%25) market share browsers.
- React Native.
