# ![Apollo upload client](https://cdn.rawgit.com/jaydenseric/apollo-upload-client/v4.0.1/apollo-upload-logo.svg)

![NPM version](https://img.shields.io/npm/v/apollo-upload-client.svg?style=flat-square) ![Github issues](https://img.shields.io/github/issues/jaydenseric/apollo-upload-client.svg?style=flat-square) ![Github stars](https://img.shields.io/github/stars/jaydenseric/apollo-upload-client.svg?style=flat-square)

Enhances [Apollo](http://apollodata.com) for intuitive file uploads via GraphQL mutations or queries. Use with [Apollo upload server](https://github.com/jaydenseric/apollo-upload-server).

- [> 2%](http://browserl.ist/?q=%3E+2%25) market share browsers supported.
- [MIT license](https://en.wikipedia.org/wiki/MIT_License).

## Setup

Install with [Yarn](https://yarnpkg.com):

```
yarn add apollo-upload-client
```

Setup Apollo client with a special network interface:

```js
import ApolloClient from 'apollo-client'
import {createNetworkInterface} from 'apollo-upload-client'

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: '/graphql'
  })
})
```

Alternatively enable [query batching](http://dev.apollodata.com/core/network.html#query-batching):

```js
import ApolloClient from 'apollo-client'
import {createBatchNetworkInterface} from 'apollo-upload-client'

const client = new ApolloClient({
  networkInterface: createBatchNetworkInterface({
    uri: '/graphql',
    batchInterval: 10
  })
})
```

Also setup [Apollo upload server](https://github.com/jaydenseric/apollo-upload-server).

## Usage

Once setup, you will be able to use [`File`](https://developer.mozilla.org/en/docs/Web/API/File) objects, [`FileList`](https://developer.mozilla.org/en/docs/Web/API/FileList) objects, or `File` arrays within query or mutation input variables.

The files upload to a temp directory; the paths and metadata will be available under the variable name in the resolver. See the [server usage](https://github.com/jaydenseric/apollo-upload-server#usage).

### Single file

See [server usage for this example](https://github.com/jaydenseric/apollo-upload-server#single-file).

```js
import React, {Component, PropTypes} from 'react'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'

@graphql(gql`
  mutation updateUserAvatar ($userId: String!, $avatar: File!) {
    updateUserAvatar (userId: $userId, avatar: $avatar) {
      id
    }
  }
`)
export default class extends Component {
  static propTypes = {
    userId: PropTypes.string.isRequired,
    mutate: PropTypes.func.isRequired
  }

  onChange = ({target}) => {
    if (target.validity.valid) {
      this.props
        .mutate({
          variables: {
            userId: this.props.userId,
            avatar: target.files[0]
          }
        })
        .then(({data}) => console.log('Mutation response:', data))
    }
  }

  render () {
    return <input type='file' accept={'image/jpeg,image/png'} required onChange={this.onChange} />
  }
}
```

### Multiple files

See [server usage for this example](https://github.com/jaydenseric/apollo-upload-server#multiple-files).

```js
import React, {Component, PropTypes} from 'react'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'

@graphql(gql`
  mutation updateGallery ($galleryId: String!, $images: [File!]!) {
    updateGallery (galleryId: $galleryId, images: $images) {
      id
    }
  }
`)
export default class extends Component {
  static propTypes = {
    galleryId: PropTypes.string.isRequired,
    mutate: PropTypes.func.isRequired
  }

  onChange = ({target}) => {
    if (target.validity.valid) {
      this.props
        .mutate({
          variables: {
            galleryId: this.props.galleryId,
            images: target.files
          }
        })
        .then(({data}) => console.log('Mutation response:', data))
    }
  }

  render () {
    return <input type='file' accept={'image/jpeg,image/png'} multiple required onChange={this.onChange} />
  }
}
```

## Inspiration

- [@HriBB](https://github.com/HriBB)’s [graphql-server-express-upload](https://github.com/HriBB/graphql-server-express-upload) and [apollo-upload-network-interface](https://github.com/HriBB/apollo-upload-network-interface) projects.
- [@danielbuechele](https://github.com/danielbuechele)’s [Medium article](https://medium.com/@danielbuechele/file-uploads-with-graphql-and-apollo-5502bbf3941e).
- [@jessedvrs](https://github.com/jessedvrs)’s [example code](https://github.com/HriBB/apollo-upload-network-interface/issues/5#issuecomment-280018715).
