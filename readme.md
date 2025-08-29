![Apollo upload logo](https://cdn.jsdelivr.net/gh/jaydenseric/apollo-upload-client@1.0.0/apollo-upload-logo.svg)

# apollo-upload-client

A [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction#the-terminating-link) for [Apollo Client](https://www.apollographql.com/docs/react) that fetches a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec) if the GraphQL variables contain files (by default [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), or [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) instances), or else fetches a regular [GraphQL POST or GET request](https://www.apollographql.com/docs/apollo-server/workflow/requests) (depending on the config and GraphQL operation).

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

[Apollo Client](https://www.apollographql.com/docs/react) can only have 1 [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction#the-terminating-link) that sends the GraphQL requests; if one such as [`HttpLink`](https://www.apollographql.com/docs/react/api/link/apollo-link-http) is already setup, remove it.

Construct [`ApolloClient`](https://www.apollographql.com/docs/react/api/core/ApolloClient) with a [terminating Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction#the-terminating-link) using the class [`UploadHttpLink`](./UploadHttpLink.mjs). For client awareness features, compose the Apollo Link [`ClientAwarenessLink`](https://www.apollographql.com/docs/react/api/link/apollo-link-client-awareness) before the terminating link.

Also ensure the GraphQL server implements the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec) and that uploads are handled correctly in resolvers.

## Examples

Use [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList), [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), or [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) instances anywhere within query or mutation variables to send a [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).

See also the [example API and client](https://github.com/jaydenseric/apollo-upload-examples).

### [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList)

```tsx
import { gql } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react";

/** React component for a uploading a file list. */
function UploadFileList() {
  const [mutate] = useMutation<
    {
      uploadFiles: {
        success: boolean;
      };
    },
    {
      files: FileList;
    }
  >(mutation);

  return (
    <input
      type="file"
      multiple
      required
      onChange={({ target: { validity, files } }) => {
        if (validity.valid && files?.[0])
          mutate({
            variables: {
              files,
            },
          });
      }}
    />
  );
}

const mutation = gql`
  mutation ($files: [Upload!]!) {
    uploadFiles(files: $files) {
      success
    }
  }
`;
```

### [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)

```tsx
import { gql } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react";

/** React component for a uploading a file. */
function UploadFile() {
  const [mutate] = useMutation<
    {
      uploadFile: {
        success: boolean;
      };
    },
    {
      file: File;
    }
  >(mutation);

  return (
    <input
      type="file"
      required
      onChange={({ target: { validity, files } }) => {
        if (validity.valid && files?.[0])
          mutate({
            variables: {
              file: files[0],
            },
          });
      }}
    />
  );
}

const mutation = gql`
  mutation ($file: Upload!) {
    uploadFile(file: $file) {
      success
    }
  }
`;
```

### [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

```tsx
import { gql } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react";

/** React component for a uploading a blob. */
function UploadBlob() {
  const [mutate] = useMutation<
    {
      uploadFile: {
        success: boolean;
      };
    },
    {
      file: Blob;
    }
  >(mutation);

  return (
    <button
      type="button"
      onClick={() => {
        mutate({
          variables: {
            file: new Blob(["Content here."], {
              type: "text/plain",
            }),
          },
        });
      }}
    >
      Upload
    </button>
  );
}

const mutation = gql`
  mutation ($file: Upload!) {
    uploadFile(file: $file) {
      success
    }
  }
`;
```

To avoid the upload default file name `blob`, replace the [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) approach with [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File):

```ts
new File(
  [value],
  // Custom file name.
  "text.txt",
  {
    type: "text/plain",
  },
);
```

## Requirements

- [Node.js](https://nodejs.org) versions `^20.9.0 || >=22.0.0`.
- Browsers matching the [Browserslist](https://browsersl.ist) query [`> 0.5%, not OperaMini all, not dead`](https://browsersl.ist/?q=%3E+0.5%25%2C+not+OperaMini+all%2C+not+dead).

Projects must configure [TypeScript](https://www.typescriptlang.org) to use types from the ECMAScript modules that have a `// @ts-check` comment:

- [`compilerOptions.allowJs`](https://www.typescriptlang.org/tsconfig#allowJs) should be `true`.
- [`compilerOptions.maxNodeModuleJsDepth`](https://www.typescriptlang.org/tsconfig#maxNodeModuleJsDepth) should be reasonably large, e.g. `10`.
- [`compilerOptions.module`](https://www.typescriptlang.org/tsconfig#module) should be `"node16"` or `"nodenext"`.

## Exports

The [npm](https://npmjs.com) package [`apollo-upload-client`](https://npm.im/apollo-upload-client) features [optimal JavaScript module design](https://jaydenseric.com/blog/optimal-javascript-module-design). It doesn’t have a main index module, so use deep imports from the ECMAScript modules that are exported via the [`package.json`](./package.json) field [`exports`](https://nodejs.org/api/packages.html#exports):

- [`formDataAppendFile.mjs`](./formDataAppendFile.mjs)
- [`isExtractableFile.mjs`](./isExtractableFile.mjs)
- [`UploadHttpLink.mjs`](./UploadHttpLink.mjs)
