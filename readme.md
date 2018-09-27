![Apollo upload logo](https://cdn.rawgit.com/jaydenseric/apollo-upload-client/27b1f20/apollo-upload-logo.svg)

# apollo-upload-client

[![npm version](https://badgen.net/npm/v/apollo-upload-client)](https://npm.im/apollo-upload-client) [![Build status](https://travis-ci.org/jaydenseric/apollo-upload-client.svg?branch=master)](https://travis-ci.org/jaydenseric/apollo-upload-client)

An [Apollo Link](https://apollographql.com/docs/link) for [Apollo Client](https://apollographql.com/docs/link#apollo-client) that allows [`FileList`](https://developer.mozilla.org/docs/web/api/filelist), [`File`](https://developer.mozilla.org/docs/web/api/file), [`Blob`](https://developer.mozilla.org/docs/web/api/blob) or [`ReactNativeFile`](#class-reactnativefile) instances within query or mutation variables and sends [GraphQL multipart requests](https://github.com/jaydenseric/graphql-multipart-request-spec).

## Setup

Install with [npm](https://npmjs.com):

```shell
npm install apollo-upload-client
```

If you use [Apollo Boost](https://npm.im/apollo-boost), [migrate to a manual Apollo Client setup](https://apollographql.com/docs/react/advanced/boost-migration).

Initialize [Apollo Client](https://apollographql.com/docs/link#apollo-client) with a terminating [Apollo Link](https://apollographql.com/docs/link) using [`createUploadLink`](#function-createuploadlink).

Also ensure the GraphQL server implements the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec) and that uploads are handled correctly in resolvers.

## Usage

Use [`FileList`](https://developer.mozilla.org/docs/web/api/filelist), [`File`](https://developer.mozilla.org/docs/web/api/file), [`Blob`](https://developer.mozilla.org/docs/web/api/blob) or [`ReactNativeFile`](#class-reactnativefile) instances anywhere within query or mutation variables to send a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).

See also the [example API and client](https://github.com/jaydenseric/apollo-upload-examples).

### [`FileList`](https://developer.mozilla.org/docs/web/api/filelist)

```jsx
const gql = require('graphql-tag')
const { Mutation } = require('react-apollo')

const UploadFiles = () => (
  <Mutation
    mutation={gql`
      mutation($files: [Upload!]!) {
        uploadFiles(files: $files) {
          success
        }
      }
    `}
  >
    {mutate => (
      <input
        type="file"
        multiple
        required
        onChange={({ target: { validity, files } }) =>
          validity.valid && mutate({ variables: { files } })
        }
      />
    )}
  </Mutation>
)
```

### [`File`](https://developer.mozilla.org/docs/web/api/file)

```jsx
const gql = require('graphql-tag')
const { Mutation } = require('react-apollo')

const UploadFile = () => (
  <Mutation
    mutation={gql`
      mutation($file: Upload!) {
        uploadFile(file: $file) {
          success
        }
      }
    `}
  >
    {mutate => (
      <input
        type="file"
        required
        onChange={({
          target: {
            validity,
            files: [file]
          }
        }) => validity.valid && mutate({ variables: { file } })}
      />
    )}
  </Mutation>
)
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

- Node.js v6.10+
- Browsers [>1% usage](http://browserl.ist/?q=%3E1%25)
- React Native

## API

### Table of contents

- [class ReactNativeFile](#class-reactnativefile)
  - [Examples](#examples)
- [function createUploadLink](#function-createuploadlink)
  - [See](#see)
  - [Examples](#examples-1)
- [type FetchOptions](#type-fetchoptions)
  - [See](#see-1)
- [type ReactNativeFileSubstitute](#type-reactnativefilesubstitute)
  - [See](#see-2)
  - [Examples](#examples-2)

### class ReactNativeFile

Used to mark a [React Native `File` substitute](#type-reactnativefilesubstitute). It’s too risky to assume all objects with `uri`, `type` and `name` properties are files to extract. Re-exported from [`extract-files`](https://npm.im/extract-files) for convenience.

| Parameter | Type                                                         | Description                                                                          |
| :-------- | :----------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `file`    | [ReactNativeFileSubstitute](#type-reactnativefilesubstitute) | A React Native [`File`](https://developer.mozilla.org/docs/web/api/file) substitute. |

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

### function createUploadLink

Creates a terminating [Apollo Link](https://apollographql.com/docs/link) capable of file uploads. Options match [`createHttpLink`](https://apollographql.com/docs/link/links/http#options).

| Parameter                   | Type                                          | Description                                                                                       |
| :-------------------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `options`                   | [Object](https://mdn.io/object)               | Options.                                                                                          |
| `options.uri`               | [string](https://mdn.io/string)? = `/graphql` | GraphQL endpoint URI.                                                                             |
| `options.fetch`             | [function](https://mdn.io/function)?          | [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the `fetch` global. |
| `options.fetchOptions`      | [FetchOptions](#type-fetchoptions)?           | `fetch` options; overridden by upload requirements.                                               |
| `options.credentials`       | [string](https://mdn.io/string)?              | Overrides `options.fetchOptions.credentials`.                                                     |
| `options.headers`           | [Object](https://mdn.io/object)?              | Merges with and overrides `options.fetchOptions.headers`.                                         |
| `options.includeExtensions` | [boolean](https://mdn.io/boolean)? = `false`  | Toggles sending `extensions` fields to the GraphQL server.                                        |

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

### type FetchOptions

GraphQL request `fetch` options.

**Type:** [Object](https://mdn.io/object)

| Property      | Type                             | Description                      |
| :------------ | :------------------------------- | :------------------------------- |
| `headers`     | [Object](https://mdn.io/object)  | HTTP request headers.            |
| `credentials` | [string](https://mdn.io/string)? | Authentication credentials mode. |

#### See

- [Polyfillable fetch options](https://github.github.io/fetch#options).

### type ReactNativeFileSubstitute

A React Native [`File`](https://developer.mozilla.org/docs/web/api/file) substitute.

**Type:** [Object](https://mdn.io/object)

| Property | Type                             | Description        |
| :------- | :------------------------------- | :----------------- |
| `uri`    | [String](https://mdn.io/string)  | Filesystem path.   |
| `name`   | [String](https://mdn.io/string)? | File name.         |
| `type`   | [String](https://mdn.io/string)? | File content type. |

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
