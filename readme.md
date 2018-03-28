![Apollo upload logo](https://cdn.rawgit.com/jaydenseric/apollo-upload-client/27b1f20/apollo-upload-logo.svg)

# apollo-upload-client

[![npm version](https://img.shields.io/npm/v/apollo-upload-client.svg)](https://npm.im/apollo-upload-client) ![Licence](https://img.shields.io/npm/l/apollo-upload-client.svg) [![Github issues](https://img.shields.io/github/issues/jaydenseric/apollo-upload-client.svg)](https://github.com/jaydenseric/apollo-upload-client/issues) [![Github stars](https://img.shields.io/github/stars/jaydenseric/apollo-upload-client.svg)](https://github.com/jaydenseric/apollo-upload-client/stargazers)

Enhances [Apollo](https://apollographql.com) for intuitive file uploads via GraphQL queries or mutations. Use with a [GraphQL multipart request spec server implementation](https://github.com/jaydenseric/graphql-multipart-request-spec#server) such as [apollo-upload-server](https://github.com/jaydenseric/apollo-upload-server).

## Setup

Install with peer dependencies using [npm](https://npmjs.com):

```shell
npm install apollo-upload-client apollo-link
```

Initialize Apollo Client with this terminating link:

```js
import { createUploadLink } from 'apollo-upload-client'

const link = createUploadLink(/* Options */)
```

### Options

`createUploadLink` options match [`createHttpLink` options](https://www.apollographql.com/docs/link/links/http.html#Options):

* `includeExtensions` (boolean): Toggles sending `extensions` fields to the GraphQL server. (default: `false`).
* `uri` (string): GraphQL endpoint URI (default: `/graphql`).
* `credentials` (string): Overrides `fetchOptions.credentials`.
* `headers` (object): Merges with and overrides `fetchOptions.headers`.
* `fetchOptions` (object): [`fetch` init](https://developer.mozilla.org/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters); overridden by upload requirements.
* `fetch` (function): [Fetch API](https://fetch.spec.whatwg.org) to use (default: Global `fetch`).

## Usage

Use [`FileList`](https://developer.mozilla.org/en/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en/docs/Web/API/File), [`Blob`](https://developer.mozilla.org/en/docs/Web/API/Blob) or [`ReactNativeFile`](#react-native) instances anywhere within query or mutation input variables to send a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec). See also [apollo-upload-server usage](https://github.com/jaydenseric/apollo-upload-server#usage) and the [example API and client](https://github.com/jaydenseric/apollo-upload-examples).

### [`FileList`](https://developer.mozilla.org/en/docs/Web/API/FileList)

```jsx
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

export default graphql(gql`
  mutation($files: [Upload!]!) {
    uploadFiles(files: $files) {
      id
    }
  }
`)(({ mutate }) => (
  <input
    type="file"
    multiple
    required
    onChange={({ target: { validity, files } }) =>
      validity.valid && mutate({ variables: { files } })
    }
  />
))
```

### [`File`](https://developer.mozilla.org/en/docs/Web/API/File)

```jsx
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

export default graphql(gql`
  mutation($file: Upload!) {
    uploadFile(file: $file) {
      id
    }
  }
`)(({ mutate }) => (
  <input
    type="file"
    required
    onChange={({ target: { validity, files: [file] } }) =>
      validity.valid && mutate({ variables: { file } })
    }
  />
))
```

### [`Blob`](https://developer.mozilla.org/en/docs/Web/API/Blob)

```jsx
import gql from 'graphql-tag'

// Apollo Client instance
import client from './apollo'

const file = new Blob(['Foo.'], { type: 'text/plain' })

// Optional, defaults to `blob`
file.name = 'bar.txt'

client.mutate({
  mutation: gql`
    mutation($file: Upload!) {
      uploadFile(file: $file) {
        id
      }
    }
  `,
  variables: { file }
})
```

### React Native

Substitute [`File`](https://developer.mozilla.org/en/docs/Web/API/File) with `ReactNativeFile` from [`extract-files`](https://github.com/jaydenseric/extract-files):

```js
import { ReactNativeFile } from 'apollo-upload-client'

const file = new ReactNativeFile({
  uri: '…',
  type: 'image/jpeg',
  name: 'photo.jpg'
})

const files = ReactNativeFile.list([
  {
    uri: '…',
    type: 'image/jpeg',
    name: 'photo-1.jpg'
  },
  {
    uri: '…',
    type: 'image/jpeg',
    name: 'photo-2.jpg'
  }
])
```

### Uploading from server-to-server

The main difference between using apollo-upload-client in a browser vs server environment is that in the server version you need to provide a function that replaces `FormData` which is native to any browser. The `createUploadLink` function receives the param `serverFormData` to that end. We suggest you use the npm package `forma-data` as you can see in the example bellow.

```js
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createUploadLink } from 'apollo-upload-client'
import gql from 'graphql-tag'
import fs from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'

const client = new ApolloClient({
  link: createUploadLink({
    uri: 'https://example.server.com/graphql',
    serverFormData: FormData,
    fetch
  }),
  cache: new InMemoryCache()
})

const variables = {
  file: fs.createReadStream('/path/to/file')
}

const mutation = gql`
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) {
      id
    }
  }
`
client.mutate({ mutation, variables })
```

### Redirecting uploads to remote merged schemas

This will eventually be supported by `mergeSchemas` function, but at this point this is a solution.

```js
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createUploadLink } from 'apollo-upload-client'
import { mergeSchemas } from 'graphql-tools'
import gql from 'graphql-tag'
import fetch from 'node-fetch'
import FormData from 'form-data'

mergeSchemas({
  schemas: [bookSchema, authorSchema],
  resolvers: mergeInfo => ({
    Mutation: {
      async uploadBook(parent, args, context, info){

        const client = new ApolloClient({
          link: createUploadLink({
            uri: 'https://book.microservice.com/graphql',
            serverFormData: FormData,
            fetch
          }),
          cache: new InMemoryCache()
        })

        return await client.mutate({
          // if you add 'request' in your context by default
          // you can:
          mutation: gql(context.request.body.query),
          variables: args
        })
      }
    }
  }
}
```

## Support

* Node.js v6.10+, see `package.json` `engines`.
* [Browsers >1% usage](http://browserl.ist/?q=%3E1%25), see `package.json` `browserslist`.
* React Native.
