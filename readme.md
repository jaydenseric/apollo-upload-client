![Apollo upload logo](https://cdn.jsdelivr.net/gh/jaydenseric/apollo-upload-client@1.0.0/apollo-upload-logo.svg)

# apollo-upload-client

[![npm version](https://badgen.net/npm/v/apollo-upload-client)](https://npm.im/apollo-upload-client) [![CI status](https://github.com/jaydenseric/apollo-upload-client/workflows/CI/badge.svg)](https://github.com/jaydenseric/apollo-upload-client/actions)

A terminating [Apollo Link](https://apollographql.com/docs/link) for [Apollo Client](https://apollographql.com/docs/link#apollo-client) that allows [`FileList`](https://developer.mozilla.org/docs/web/api/filelist), [`File`](https://developer.mozilla.org/docs/web/api/file), [`Blob`](https://developer.mozilla.org/docs/web/api/blob) or [`ReactNativeFile`](#class-reactnativefile) instances within query or mutation variables and sends [GraphQL multipart requests](https://github.com/jaydenseric/graphql-multipart-request-spec).

## Setup

Install with [npm](https://npmjs.com):

```shell
npm install apollo-upload-client
```

[Apollo Boost](https://npm.im/apollo-boost) doesn’t allow link customization; if you are using it [migrate to a manual Apollo Client setup](https://apollographql.com/docs/react/advanced/boost-migration).

[Apollo Client](https://apollographql.com/docs/link#apollo-client) can only have 1 “terminating” [Apollo Link](https://apollographql.com/docs/link) that sends the GraphQL requests; if one such as [`apollo-link-http`](https://apollographql.com/docs/link/links/http) is already setup, remove it.

Initialize the client with a terminating link using [`createUploadLink`](#function-createuploadlink).

Also ensure the GraphQL server implements the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec) and that uploads are handled correctly in resolvers.

## Usage

Use [`FileList`](https://developer.mozilla.org/docs/web/api/filelist), [`File`](https://developer.mozilla.org/docs/web/api/file), [`Blob`](https://developer.mozilla.org/docs/web/api/blob) or [`ReactNativeFile`](#class-reactnativefile) instances anywhere within query or mutation variables to send a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).

See also the [example API and client](https://github.com/jaydenseric/apollo-upload-examples).

### [`FileList`](https://developer.mozilla.org/docs/web/api/filelist)

```jsx
const { useMutation } = require('@apollo/react-hooks')
const gql = require('graphql-tag')

const MUTATION = gql`
  mutation($files: [Upload!]!) {
    uploadFiles(files: $files) {
      success
    }
  }
`

const UploadFile = () => {
  const [mutate] = useMutation(MUTATION)
  const onChange = ({ target: { validity, files } }) =>
    validity.valid && mutate({ variables: { files } })

  return <input type="file" multiple required onChange={onChange} />
}
```

### [`File`](https://developer.mozilla.org/docs/web/api/file)

```jsx
const { useMutation } = require('@apollo/react-hooks')
const gql = require('graphql-tag')

const MUTATION = gql`
  mutation($file: Upload!) {
    uploadFile(file: $file) {
      success
    }
  }
`

const UploadFile = () => {
  const [mutate] = useMutation(MUTATION)
  const onChange = ({
    target: {
      validity,
      files: [file]
    }
  }) => validity.valid && mutate({ variables: { file } })

  return <input type="file" required onChange={onChange} />
}
```

### [`Blob`](https://developer.mozilla.org/docs/web/api/blob)

```jsx
const gql = require('graphql-tag')

// Apollo Client instance.
const client = require('./client')

const file = new Blob(['Foo.'], { type: 'text/plain' })

// Optional, defaults to `blob`.
file.name = 'bar.txt'

client.mutate({
  mutation: gql`
    mutation($file: Upload!) {
      uploadFile(file: $file) {
        success
      }
    }
  `,
  variables: { file }
})
```

## Support

- Node.js v8.10+
- Browsers [`> 0.5%, not OperaMini all, not dead`](https://browserl.ist/?q=%3E+0.5%25%2C+not+OperaMini+all%2C+not+dead)
- React Native

Consider polyfilling:

- [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [`fetch`](https://developer.mozilla.org/docs/Web/API/Fetch_API)
- [`FormData`](https://developer.mozilla.org/docs/Web/API/FormData)

## API

### Table of contents

- [class ReactNativeFile](#class-reactnativefile)
- [function createUploadLink](#function-createuploadlink)
- [type FetchOptions](#type-fetchoptions)
- [type ReactNativeFileSubstitute](#type-reactnativefilesubstitute)

### class ReactNativeFile

Used to mark a [React Native `File` substitute](#type-reactnativefilesubstitute). It’s too risky to assume all objects with `uri`, `type` and `name` properties are files to extract. Re-exported from [`extract-files`](https://npm.im/extract-files) for convenience.

| Parameter | Type | Description |
| :-- | :-- | :-- |
| `file` | [ReactNativeFileSubstitute](#type-reactnativefilesubstitute) | A React Native [`File`](https://developer.mozilla.org/docs/web/api/file) substitute. |

#### Examples

_A React Native file that can be used in query or mutation variables._

> ```js
> const { ReactNativeFile } = require('apollo-upload-client')
>
> const file = new ReactNativeFile({
>   uri: uriFromCameraRoll,
>   name: 'a.jpg',
>   type: 'image/jpeg'
> })
> ```

---

### function createUploadLink

Creates a terminating [Apollo Link](https://apollographql.com/docs/link) capable of file uploads. Options match [`createHttpLink`](https://apollographql.com/docs/link/links/http#options).

| Parameter | Type | Description |
| :-- | :-- | :-- |
| `options` | object | Options. |
| `options.uri` | string? = /graphql | GraphQL endpoint URI. |
| `options.fetch` | Function? | [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the `fetch` global. |
| `options.fetchOptions` | [FetchOptions](#type-fetchoptions)? | `fetch` options; overridden by upload requirements. |
| `options.credentials` | string? | Overrides `options.fetchOptions.credentials`. |
| `options.headers` | object? | Merges with and overrides `options.fetchOptions.headers`. |
| `options.includeExtensions` | boolean? = `false` | Toggles sending `extensions` fields to the GraphQL server. |

**Returns:** ApolloLink — A terminating [Apollo Link](https://apollographql.com/docs/link) capable of file uploads.

#### See

- [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec).
- [apollo-link on GitHub](https://github.com/apollographql/apollo-link).

#### Examples

_A basic Apollo Client setup._

> ```js
> const { ApolloClient } = require('apollo-client')
> const { InMemoryCache } = require('apollo-cache-inmemory')
> const { createUploadLink } = require('apollo-upload-client')
>
> const client = new ApolloClient({
>   cache: new InMemoryCache(),
>   link: createUploadLink()
> })
> ```

---

### type FetchOptions

GraphQL request `fetch` options.

**Type:** object

| Property      | Type    | Description                      |
| :------------ | :------ | :------------------------------- |
| `headers`     | object  | HTTP request headers.            |
| `credentials` | string? | Authentication credentials mode. |

#### See

- [Polyfillable fetch options](https://github.github.io/fetch#options).

---

### type ReactNativeFileSubstitute

A React Native [`File`](https://developer.mozilla.org/docs/web/api/file) substitute.

Be aware that inspecting network requests with Chrome dev tools interferes with the React Native `FormData` implementation, causing network errors.

**Type:** object

| Property | Type | Description |
| :-- | :-- | :-- |
| `uri` | string | Filesystem path. |
| `name` | string? | File name. |
| `type` | string? | File content type. Some environments (particularly Android) require a valid MIME type; Expo `ImageResult.type` is unreliable as it can be just `image`. |

#### See

- [`extract-files` docs](https://github.com/jaydenseric/extract-files#type-reactnativefilesubstitute).
- [React Native `FormData` polyfill source](https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js#L34).

#### Examples

_A camera roll file._

> ```js
> {
>   uri: uriFromCameraRoll,
>   name: 'a.jpg',
>   type: 'image/jpeg'
> }
> ```
