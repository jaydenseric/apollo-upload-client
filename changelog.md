# apollo-upload-client change log

## next

- Updated dependencies.
- Added a change log.
- Dropped Yarn in favor of npm@5. Removed `yarn.lock` and updated install instructions.
- New ESLint config. Dropped [Standard Style](https://standardjs.com) and began using [Prettier](https://github.com/prettier/eslint-plugin-prettier).
- Using [lint-staged](https://github.com/okonet/lint-staged) to ensure contributors don't commit lint errors.

## 4.0.3

- Updated dependencies.
- Fixed fetch options not applying correctly, see [#9](https://github.com/jaydenseric/apollo-upload-client/pull/9).

## 4.0.2

- Updated readme examples:
  - Removed `PropTypes`. React no longer exports them and they are a distraction anyway.
  - Importing `gql` from `react-apollo`.
  - No longer using decorator syntax.
  - Using functional components in place of classes.

## 4.0.1

- Updated dependencies.
- No longer errors when network interface `opts` are not configured, fixing [#8](https://github.com/jaydenseric/apollo-upload-client/issues/8).
- Fixed the batch network interface always thinking there are files to upload, preventing the use of the fallback vanilla Apollo transport method when there are none.
- Simplified Babel config.

## 4.0.0

- Corrected the API for configuring fetch options, fixing [#6](https://github.com/jaydenseric/apollo-upload-client/issues/6) ([#7](https://github.com/jaydenseric/apollo-upload-client/pull/7)).

## 3.0.3

- The `extractRequestFiles` helper no longer converts the query AST to string as a side-effect, fixing [#5](https://github.com/jaydenseric/apollo-upload-client/issues/5).

## 3.0.2

- Updated dependencies.
- Fall back to regular network interface fetch methods if SSR or no files to upload, fixing [#3](https://github.com/jaydenseric/apollo-upload-client/issues/3).

## 3.0.1

- Better transpilation with `babel-runtime`. This should improve IE 11 support.

## 3.0.0

- Support `apollo-upload-server` v2 and [query batching](http://dev.apollodata.com/core/network.html#query-batching).
- Removed the seemingly redundant `Accept` header from requests.
- Clearer package description.

## 2.0.2

- Updated dependencies.
- Internal refactor for a cleaner ES6 class extension and method override.

## 2.0.1

- Removed two unversioned files prematurely published to npm.

## 2.0.0

- Updated dependencies.
- New API:
  - Now exporting the custom network interface, which has been renamed `HTTPUploadNetworkInterface`. This enables it to be extended externally.
  - In preparation for adding another batched network interface, `createNetworkInterface` is now a named and not default export.
- Fixed the `uri` argument for `createNetworkInterface` ending up in the request options.
- Internally simplified `apollo-client` imports.
- Simpler linting setup.

## 1.0.2

- Fixed broken Github deep links in the readme.
- Readme rewording.
- Simplified package.json description.

## 1.0.1

- Added missing metadata to `package.json`.

## 1.0.0

Initial release.
