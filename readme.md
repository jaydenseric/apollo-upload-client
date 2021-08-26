![Apollo upload logo](https://cdn.jsdelivr.net/gh/jaydenseric/apollo-upload-client@1.0.0/apollo-upload-logo.svg)

# apollo-upload-client

[![npm version](https://badgen.net/npm/v/apollo-upload-client)](https://npm.im/apollo-upload-client) [![CI status](https://github.com/jaydenseric/apollo-upload-client/workflows/CI/badge.svg)](https://github.com/jaydenseric/apollo-upload-client/actions)

A [terminating Apollo Link](https://apollographql.com/docs/react/api/link/introduction/#the-terminating-link) for [Apollo Client](https://apollographql.com/docs/react) that fetches a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec) if the GraphQL variables contain files (by default [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob), or [`ReactNativeFile`](#class-reactnativefile) instances), or else fetches a regular [GraphQL POST or GET request](https://apollographql.com/docs/apollo-server/requests) (depending on the config and GraphQL operation).

## Setup

To install with [npm](https://npmjs.com/get-npm), run:

```sh
npm install apollo-upload-client
```

Remove any `uri`, `credentials`, or `headers` options from the [`ApolloClient` constructor](https://apollographql.com/docs/react/api/core/ApolloClient/#the-apolloclient-constructor).

[Apollo Client](https://apollographql.com/docs/react) can only have 1 [terminating Apollo Link](https://apollographql.com/docs/react/api/link/introduction/#the-terminating-link) that sends the GraphQL requests; if one such as [`HttpLink`](https://apollographql.com/docs/react/api/link/apollo-link-http) is already setup, remove it.

Initialize the client with a [terminating Apollo Link](https://apollographql.com/docs/react/api/link/introduction/#the-terminating-link) using [`createUploadLink`](#function-createuploadlink).

Also ensure the GraphQL server implements the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec) and that uploads are handled correctly in resolvers.

## Usage

Use [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or [`ReactNativeFile`](#class-reactnativefile) instances anywhere within query or mutation variables to send a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).

See also the [example API and client](https://github.com/jaydenseric/apollo-upload-examples).

### [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList)

```jsx
import { gql, useMutation } from '@apollo/client';

const MUTATION = gql`
  mutation ($files: [Upload!]!) {
    uploadFiles(files: $files) {
      success
    }
  }
`;

function UploadFiles() {
  const [mutate] = useMutation(MUTATION);

  function onChange({ target: { validity, files } }) {
    if (validity.valid) mutate({ variables: { files } });
  }

  return <input type="file" multiple required onChange={onChange} />;
}
```

### [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)

```jsx
import { gql, useMutation } from '@apollo/client';

const MUTATION = gql`
  mutation ($file: Upload!) {
    uploadFile(file: $file) {
      success
    }
  }
`;

function UploadFile() {
  const [mutate] = useMutation(MUTATION);

  function onChange({
    target: {
      validity,
      files: [file],
    },
  }) {
    if (validity.valid) mutate({ variables: { file } });
  }

  return <input type="file" required onChange={onChange} />;
}
```

### [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

```jsx
import { gql, useMutation } from '@apollo/client';

const MUTATION = gql`
  mutation ($file: Upload!) {
    uploadFile(file: $file) {
      success
    }
  }
`;

function UploadFile() {
  const [mutate] = useMutation(MUTATION);

  function onChange({ target: { validity, value } }) {
    if (validity.valid) {
      const file = new Blob([value], { type: 'text/plain' });

      // Optional, defaults to `blob`.
      file.name = 'text.txt';

      mutate({ variables: { file } });
    }
  }

  return <input type="text" required onChange={onChange} />;
}
```

## Support

- [Node.js](https://nodejs.org): `^12.20 || >= 14.13`
- [Browsers](https://npm.im/browserslist): `> 0.5%, not OperaMini all, not IE > 0, not dead`
- [React Native](https://reactnative.dev)

Consider polyfilling:

- [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

## API

- [class ReactNativeFile](#class-reactnativefile)
- [function createUploadLink](#function-createuploadlink)
- [function formDataAppendFile](#function-formdataappendfile)
- [function isExtractableFile](#function-isextractablefile)
- [type ExtractableFileMatcher](#type-extractablefilematcher)
- [type FetchOptions](#type-fetchoptions)
- [type FormDataFileAppender](#type-formdatafileappender)
- [type ReactNativeFileSubstitute](#type-reactnativefilesubstitute)

### class ReactNativeFile

Used to mark [React Native `File` substitutes](#type-reactnativefilesubstitute) as it’s too risky to assume all objects with `uri`, `type` and `name` properties are extractable files.

| Parameter | Type | Description |
| :-- | :-- | :-- |
| `file` | [ReactNativeFileSubstitute](#type-reactnativefilesubstitute) | A [React Native](https://reactnative.dev) [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) substitute. |

#### See

- [`extract-files` `ReactNativeFile` docs](https://github.com/jaydenseric/extract-files#class-reactnativefile).

#### Examples

_Ways to `import`._

> ```js
> import { ReactNativeFile } from 'apollo-upload-client';
> ```
>
> ```js
> import ReactNativeFile from 'apollo-upload-client/public/ReactNativeFile.js';
> ```

_Ways to `require`._

> ```js
> const { ReactNativeFile } = require('apollo-upload-client');
> ```
>
> ```js
> const ReactNativeFile = require('apollo-upload-client/public/ReactNativeFile.js');
> ```

_A file in [React Native](https://reactnative.dev) that can be used in query or mutation variables._

> ```js
> const file = new ReactNativeFile({
>   uri: uriFromCameraRoll,
>   name: 'a.jpg',
>   type: 'image/jpeg',
> });
> ```

#### Important debugging information

When using the react-native debugger, your uploads will not work as it replaces react-native's fetch with the one bundled inside electron. [See issue comment here](https://github.com/jaydenseric/apollo-upload-client/issues/96#issuecomment-406784588)


---

### function createUploadLink

Creates a [terminating Apollo Link](https://apollographql.com/docs/react/api/link/introduction/#the-terminating-link) for [Apollo Client](https://apollographql.com/docs/react) that fetches a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec) if the GraphQL variables contain files (by default [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob), or [`ReactNativeFile`](#class-reactnativefile) instances), or else fetches a regular [GraphQL POST or GET request](https://apollographql.com/docs/apollo-server/requests) (depending on the config and GraphQL operation).

Some of the options are similar to the [`createHttpLink` options](https://apollographql.com/docs/react/api/link/apollo-link-http/#httplink-constructor-options).

| Parameter | Type | Description |
| :-- | :-- | :-- |
| `options` | object | Options. |
| `options.uri` | string? = `/graphql` | GraphQL endpoint URI. |
| `options.useGETForQueries` | boolean? | Should GET be used to fetch queries, if there are no files to upload. |
| `options.isExtractableFile` | [ExtractableFileMatcher](#type-extractablefilematcher)? = [isExtractableFile](#function-isextractablefile) | Customizes how files are matched in the GraphQL operation for extraction. |
| `options.FormData` | class? | [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) implementation to use, defaulting to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) global. |
| `options.formDataAppendFile` | [FormDataFileAppender](#type-formdatafileappender)? = [formDataAppendFile](#function-formdataappendfile) | Customizes how extracted files are appended to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance. |
| `options.fetch` | Function? | [`fetch`](https://fetch.spec.whatwg.org) implementation to use, defaulting to the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) global. |
| `options.fetchOptions` | [FetchOptions](#type-fetchoptions)? | [`fetch` options](#type-fetchoptions); overridden by upload requirements. |
| `options.credentials` | string? | Overrides `options.fetchOptions.credentials`. |
| `options.headers` | object? | Merges with and overrides `options.fetchOptions.headers`. |
| `options.includeExtensions` | boolean? = `false` | Toggles sending `extensions` fields to the GraphQL server. |

**Returns:** ApolloLink — A [terminating Apollo Link](https://apollographql.com/docs/react/api/link/introduction/#the-terminating-link).

#### See

- [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec).

#### Examples

_Ways to `import`._

> ```js
> import { createUploadLink } from 'apollo-upload-client';
> ```
>
> ```js
> import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
> ```

_Ways to `require`._

> ```js
> const { createUploadLink } = require('apollo-upload-client');
> ```
>
> ```js
> const createUploadLink = require('apollo-upload-client/public/createUploadLink.js');
> ```

_A basic Apollo Client setup._

> ```js
> import { ApolloClient, InMemoryCache } from '@apollo/client';
> import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
>
> const client = new ApolloClient({
>   cache: new InMemoryCache(),
>   link: createUploadLink(),
> });
> ```

---

### function formDataAppendFile

The default implementation for [`createUploadLink`](#function-createuploadlink) `options.formDataAppendFile` that uses the standard [`FormData.append`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/append) method.

**Type:** [FormDataFileAppender](#type-formdatafileappender)

| Parameter | Type | Description |
| :-- | :-- | :-- |
| `formData` | FormData | [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance to append the specified file to. |
| `fieldName` | string | Field name for the file. |
| `file` | \* | File to append. |

#### Examples

_Ways to `import`._

> ```js
> import { formDataAppendFile } from 'apollo-upload-client';
> ```
>
> ```js
> import formDataAppendFile from 'apollo-upload-client/public/formDataAppendFile.js';
> ```

_Ways to `require`._

> ```js
> const { formDataAppendFile } = require('apollo-upload-client');
> ```
>
> ```js
> const formDataAppendFile = require('apollo-upload-client/public/formDataAppendFile.js');
> ```

---

### function isExtractableFile

The default implementation for [`createUploadLink`](#function-createuploadlink) `options.isExtractableFile`.

**Type:** [ExtractableFileMatcher](#type-extractablefilematcher)

| Parameter | Type | Description     |
| :-------- | :--- | :-------------- |
| `value`   | \*   | Value to check. |

**Returns:** boolean — Is the value an extractable file.

#### See

- [`extract-files` `isExtractableFile` docs](https://github.com/jaydenseric/extract-files#function-isextractablefile).

#### Examples

_Ways to `import`._

> ```js
> import { isExtractableFile } from 'apollo-upload-client';
> ```
>
> ```js
> import isExtractableFile from 'apollo-upload-client/public/isExtractableFile.js';
> ```

_Ways to `require`._

> ```js
> const { isExtractableFile } = require('apollo-upload-client');
> ```
>
> ```js
> const isExtractableFile = require('apollo-upload-client/public/isExtractableFile.js');
> ```

---

### type ExtractableFileMatcher

A function that checks if a value is an extractable file.

**Type:** Function

| Parameter | Type | Description     |
| :-------- | :--- | :-------------- |
| `value`   | \*   | Value to check. |

**Returns:** boolean — Is the value an extractable file.

#### See

- [`isExtractableFile`](#function-isextractablefile) has this type.

#### Examples

_How to check for the default exactable files, as well as a custom type of file._

> ```js
> import isExtractableFile from 'apollo-upload-client/public/isExtractableFile.js';
>
> const isExtractableFileEnhanced = (value) =>
>   isExtractableFile(value) ||
>   (typeof CustomFile !== 'undefined' && value instanceof CustomFile);
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

### type FormDataFileAppIf you use React Native Debugger, you have to know that it replaces RN's fetch with the one bundled inside Electron. The Electron's (Chrome's) fetch knows nothing about how to handle React Native's files. So, you should detach your app from the debugger to use RN's fetch. The only way to debug file submissions is to watch the requests at the server side.ender

Appends a file extracted from the GraphQL operation to the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance used as the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) `options.body` for the [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).

| Parameter | Type | Description |
| :-- | :-- | :-- |
| `formData` | FormData | [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance to append the specified file to. |
| `fieldName` | string | Field name for the file. |
| `file` | \* | File to append. The file type depends on what the [`ExtractableFileMatcher`](#type-extractablefilematcher) extracts. |

#### See

- [`formDataAppendFile`](#function-formdataappendfile) has this type.
- [`createUploadLink`](#function-createuploadlink) accepts this type in `options.formDataAppendFile`.

---

### type ReactNativeFileSubstitute

A React Native [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) substitute.

Be aware that inspecting network traffic with buggy versions of dev tools such as [Flipper](https://fbflipper.com) can interfere with the React Native `FormData` implementation, causing multipart requests to have network errors.

**Type:** object

| Property | Type | Description |
| :-- | :-- | :-- |
| `uri` | string | Filesystem path. |
| `name` | string? | File name. |
| `type` | string? | File content type. Some environments (particularly Android) require a valid MIME type; Expo `ImageResult.type` is unreliable as it can be just `image`. |

#### See

- [`extract-files` `ReactNativeFileSubstitute` docs](https://github.com/jaydenseric/extract-files#type-reactnativefilesubstitute).
- [React Native `FormData` polyfill source](https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js#L34).

#### Examples

_A camera roll file._

> ```js
> const fileSubstitute = {
>   uri: uriFromCameraRoll,
>   name: 'a.jpg',
>   type: 'image/jpeg',
> };
> ```
