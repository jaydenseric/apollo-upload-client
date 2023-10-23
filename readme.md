![Apollo upload logo](https://cdn.jsdelivr.net/gh/jaydenseric/apollo-upload-client@1.0.0/apollo-upload-logo.svg)

# apollo-upload-client

A [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link) for [Apollo Client](https://www.apollographql.com/docs/react) that fetches a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec) if the GraphQL variables contain files (by default [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), or [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) instances), or else fetches a regular [GraphQL POST or GET request](https://www.apollographql.com/docs/apollo-server/workflow/requests) (depending on the config and GraphQL operation).

- [Installation](#installation)
- [Examples](#examples)
- [Requirements](#requirements)
- [Exports](#exports)

## Installation

To install with [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), run:

```sh
npm install apollo-upload-client
```

Polyfill any required globals (see [_**Requirements**_](#requirements)) that are missing in your server and client environments.

Remove any `uri`, `credentials`, or `headers` options from the [`ApolloClient` constructor](https://www.apollographql.com/docs/react/api/core/ApolloClient/#the-apolloclient-constructor).

[Apollo Client](https://www.apollographql.com/docs/react) can only have 1 [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link) that sends the GraphQL requests; if one such as [`HttpLink`](https://www.apollographql.com/docs/react/api/link/apollo-link-http) is already setup, remove it.

Initialize the client with a [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link) using the function [`createUploadLink`](./createUploadLink.mjs).

Also ensure the GraphQL server implements the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec) and that uploads are handled correctly in resolvers.

## Examples

Use [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), or [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) instances anywhere within query or mutation variables to send a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).

See also the [example API and client](https://github.com/jaydenseric/apollo-upload-examples).

### [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList)

```jsx
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ($files: [Upload!]!) {
    uploadFiles(files: $files) {
      success
    }
  }
`;

function UploadFiles() {
  const [mutate] = useMutation(MUTATION);

  return (
    <input
      type="file"
      multiple
      required
      onChange={({ target: { validity, files } }) => {
        if (validity.valid)
          mutate({
            variables: {
              files,
            },
          });
      }}
    />
  );
}
```

### [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)

```jsx
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ($file: Upload!) {
    uploadFile(file: $file) {
      success
    }
  }
`;

function UploadFile() {
  const [mutate] = useMutation(MUTATION);

  return (
    <input
      type="file"
      required
      onChange={({
        target: {
          validity,
          files: [file],
        },
      }) => {
        if (validity.valid)
          mutate({
            variables: {
              file,
            },
          });
      }}
    />
  );
}
```

### [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

```jsx
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ($file: Upload!) {
    uploadFile(file: $file) {
      success
    }
  }
`;

function UploadFile() {
  const [mutate] = useMutation(MUTATION);

  return (
    <input
      type="text"
      required
      onChange={({ target: { validity, value } }) => {
        if (validity.valid) {
          const file = new Blob([value], { type: "text/plain" });

          // Optional, defaults to `blob`.
          file.name = "text.txt";

          mutate({
            variables: {
              file,
            },
          });
        }
      }}
    />
  );
}
```

## Requirements

- [Node.js](https://nodejs.org) versions `^18.15.0 || >=20.4.0`.
- Browsers matching the [Browserslist](https://browsersl.ist) query [`> 0.5%, not OperaMini all, not dead`](https://browsersl.ist/?q=%3E+0.5%25%2C+not+OperaMini+all%2C+not+dead).

Consider polyfilling:

- [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

Projects must configure [TypeScript](https://www.typescriptlang.org) to use types from the ECMAScript modules that have a `// @ts-check` comment:

- [`compilerOptions.allowJs`](https://www.typescriptlang.org/tsconfig#allowJs) should be `true`.
- [`compilerOptions.maxNodeModuleJsDepth`](https://www.typescriptlang.org/tsconfig#maxNodeModuleJsDepth) should be reasonably large, e.g. `10`.
- [`compilerOptions.module`](https://www.typescriptlang.org/tsconfig#module) should be `"node16"` or `"nodenext"`.

## Exports

The [npm](https://npmjs.com) package [`apollo-upload-client`](https://npm.im/apollo-upload-client) features [optimal JavaScript module design](https://jaydenseric.com/blog/optimal-javascript-module-design). It doesn’t have a main index module, so use deep imports from the ECMAScript modules that are exported via the [`package.json`](./package.json) field [`exports`](https://nodejs.org/api/packages.html#exports):

- [`createUploadLink.mjs`](./createUploadLink.mjs)
- [`formDataAppendFile.mjs`](./formDataAppendFile.mjs)
- [`isExtractableFile.mjs`](./isExtractableFile.mjs)
