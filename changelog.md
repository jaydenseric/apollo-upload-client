# apollo-upload-client changelog

## 9.1.0

### Minor

- Support more browsers by changing the [Browserslist](https://github.com/browserslist/browserslist) query from [`> 1%`](https://browserl.ist/?q=%3E+1%25) to [`> 0.5%, not dead`](https://browserl.ist/?q=%3E+0.5%25%2C+not+dead).

### Patch

- Updated dev dependencies.
- Fix Babel not reading from the package `browserslist` field due to [a sneaky `@babel/preset-env` breaking change](https://github.com/babel/babel/pull/8509), fixing [#124](https://github.com/jaydenseric/apollo-upload-client/issues/124).

## 9.0.0

### Major

- Made [`apollo-link`](https://npm.im/apollo-link) a dependency, instead of a peer dependency.
- Removed the package `module` entry and the "ESM" build, which was `.js` and not proper native ESM for Node.js via `.mjs` as Apollo dependencies don’t support it.

### Minor

- Updated Babel, removing the [`@babel/runtime`](https://npm.im/@babel/runtime) dependency.
- Package [marked side-effect free](https://webpack.js.org/guides/tree-shaking#mark-the-file-as-side-effect-free) for bundlers and tree-shaking.

### Patch

- Updated dependencies.
- Use the new [`extract-files`](https://npm.im/extract-files) API.
- Use [`jsdoc-md`](https://npm.im/jsdoc-md) to generate readme API docs from source JSDoc, which has been improved.
- Readme examples updated to use the [`react-apollo`](https://npm.im/react-apollo) `Mutation` component instead of the `graphql` decorator.
- Readme examples use CJS instead of ESM as this project does not support native ESM (due to a lack of support in Apollo dependencies) and we shouldn’t assume everyone uses Babel.
- Updated package description.
- Added package tags.
- Added a package `test:size` script, using [`size-limit`](https://npm.im/size-limit) to guarantee < 1 KB CJS bundle sizes.
- Lint `.yml` files.
- Refactored package scripts and removed the [`npm-run-all`](https://npm.im/npm-run-all) dev dependency.
- Removed a temporary workaround for [a fixed Babel CLI bug](https://github.com/babel/babel/issues/8077).
- Ensure the readme Travis build status badge only tracks `master` branch.
- Use [Badgen](https://badgen.net) for the readme npm version badge.

## 8.1.0

- Updated dependencies.
- Use `.prettierignore` to defer `package.json` formatting to npm.
- Renamed `.babelrc.js` to `babel.config.js` and simplified ESLint ignore config.
- Improved linting with [`eslint-config-env`](https://npm.im/eslint-config-env).
- Use the `.mjs` extension for source.
- Added JSDoc comments to source.
- Refactored package scripts:
  - Use `prepare` to support installation via Git (e.g. `npm install jaydenseric/apollo-upload-client`).
  - Remove `rimraf` and `cross-env` dev dependencies. Only \*nix environments will be supported for contributing.
  - Removed `watch` and `fix` scripts.
- Compact package `repository` field.
- Setup Travis CI.
- Readme badge changes to deal with [shields.io](https://shields.io) unreliability:
  - Removed the licence badge. The licence can be found in `package.json` and rarely changes.
  - Removed the Github issues and stars badges. The readme is most viewed on Github anyway.
  - Added the more reliable build status badge provided by Travis and placed it first as it loads the quickest.

## 8.0.0

- Abandon `.mjs` [until Apollo provides native ESM](https://github.com/apollographql/apollo-link/issues/537), fixing [#72](https://github.com/jaydenseric/apollo-upload-client/issues/72).
- New readme logo URL that doesn’t need to be updated every version.

## 7.1.0

- Updated dependencies.
- Stop using named imports from CJS dependencies in ESM, fixing [#72](https://github.com/jaydenseric/apollo-upload-client/issues/72).
- Match an [error handling tweak](https://github.com/apollographql/apollo-link/pull/524/files#diff-f34b7d587510bfca51f1dd1dd03dfc98R130) in the official HTTP links.

## 7.1.0-alpha.2

- Updated dependencies.
- Using new `apollo-link-http-common` API.
- Corrected aborting fetch, fixing [#70](https://github.com/jaydenseric/apollo-upload-client/issues/70).

## 7.1.0-alpha.1

- Updated dependencies.
- Using [`apollo-link-http-common`](https://npm.im/apollo-link-http-common) for commonality with the official HTTP links:
  - Removed `graphql` peer dependency.
  - Aborting `fetch` supported.
  - Fixes [#47](https://github.com/jaydenseric/apollo-upload-client/issues/47) and [#61](https://github.com/jaydenseric/apollo-upload-client/issues/61).
- More robust npm scripts.
- HTTPS `package.json` author URL.

## 7.0.0-alpha.4

- Updated dependencies.
- Added support for [`Blob`](https://developer.mozilla.org/en/docs/Web/API/Blob) types, via [#58](https://github.com/jaydenseric/apollo-upload-client/pull/58).
- Readme updates:
  - Added a [GraphQL multipart request spec server implementation list](https://github.com/jaydenseric/graphql-multipart-request-spec#server) link to the intro.
  - Misc. tweaks.

## 7.0.0-alpha.3

- Updated dependencies.
  - [`extract-files` v3](https://github.com/jaydenseric/extract-files/releases/tag/v3.0.0) replaces files extracted from properties with `null` instead of deleting the property; see [jaydenseric/extract-files#4](https://github.com/jaydenseric/extract-files/issues/4). This improves compliance with the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec). It’s not a breaking change for `apollo-upload-server`, but it might be for other implementations.

## 7.0.0-alpha.2

- Updated dependencies.
- Updated peer dependencies to support `graphql@0.12`.
- Added a clean step to builds.
- Smarter Babel config with `.babelrc.js`.
- Modular project structure that works better for native ESM.
- Target Node.js v6.10+ for transpilation and polyfills via `package.json` `engines`, matching the version supported by [`apollo-upload-server`](https://github.com/jaydenseric/apollo-upload-server).
- Support [browsers with >1% global usage](http://browserl.ist/?q=%3E1%25) (was >2%).
- Updated the readme support section.

## 7.0.0-alpha.1

- Conform to the [GraphQL multipart request spec v2.0.0-alpha.2](https://github.com/jaydenseric/graphql-multipart-request-spec/releases/tag/v2.0.0-alpha.2).
- Don’t set empty request `operationName` or `variables`.

## 6.0.3

- Response is set on the context, via [#40](https://github.com/jaydenseric/apollo-upload-client/pull/40).
- Configured `lint-staged` for `.mjs`.

## 6.0.2

- Fix broken exports. See [babel/babel#6805](https://github.com/babel/babel/issues/6805).

## 6.0.1

- Updated dependencies. Fixes broken `core-js` imports due to `@babel/polyfill@7.0.0-beta.32`.
- Configured prettier to no longer hard wrap markdown prose.
- Fixed an Apollo link in the readme.
- Misc. readme and changelog typo fixes.
- Externally host the readme logo again to fix display in npm. See [npm/www#272](https://github.com/npm/www/issues/272).

## 6.0.0

- Updated `prettier`.
- No longer publish the `src` directory.
- Readme API documentation fixes:
  - Corrected React Native example code import, via [#39](https://github.com/jaydenseric/apollo-upload-client/pull/39).
  - Updated `createUploadLink` options.

## 6.0.0-beta.3

- Corrected network error handling, fixing [#38](https://github.com/jaydenseric/apollo-upload-client/issues/38).

## 6.0.0-beta.2

- Match the `apollo-link-http` API and support setting `credentials` and `headers` directly on the link and via context, fixing [#36](https://github.com/jaydenseric/apollo-upload-client/issues/36).
- Fixed [a bug](https://github.com/jaydenseric/apollo-upload-client/pull/37#issuecomment-343005839) that can cause the wrong `content-type: application/json` header to be used when uploading.
- Updated changelog Apollo documentation links.
- changelog is now prettier.

## 6.0.0-beta.1

- Updated dependencies.
- Apollo Client v2 compatibility:
  - Export a terminating Apollo Link instead of custom network interfaces.
  - New `apollo-link` and `graphql` peer dependencies.
- Rejigged package scripts.
- Updated Prettier and ESLint config.
- Lint errors when attempting to commit partially staged files no longer commits the whole file.
- Using Babel v7 directly instead of Rollup.
- Using `babel-preset-env` to handle polyfills so only required ones are included for our level of browser support.
- Using `prettier` to format distribution code as well as source code.
- No more source maps, as Prettier does not support them.
- Renamed `dist` directory to `lib`.
- Module files now have `.mjs` extension.
- Removed `babel-eslint` as the vanilla parser works fine.
- Readme improvements:
  - Relative logo path.
  - Added links to badges.
  - Simplified code examples.
  - Mark relevant example code blocks as JSX instead of JS.
  - Removed the inspiration links; they are less relevant to the evolved codebase.

## 5.1.1

- Updated dependencies.
- Readme fixes:
  - Fixed usage example code for `ReactNativeFile.list`.
  - Fixed capitalization of ‘npm’.

## 5.1.0

- Updated dependencies.
- Readme tweaks including a new licence badge.
- Fixed Rollup build warnings.
- Fixed an npm v5 warning by using `prepublishOnly` instead of `prepublish`.
- Refactored network interfaces; moved file extraction logic and `ReactNativeFile` to a separate [`extract-files`](https://npm.im/extract-files) package.

## 5.0.0

- Removed `package-lock.json`. Lockfiles are [not recommended](https://github.com/sindresorhus/ama/issues/479#issuecomment-310661514) for packages.
- Readme tweaks and fixes:
  - Renamed the `File` input type `Upload` for clarity.
  - Wording and formatting improvements.

## 5.0.0-alpha.1

- Updated dependencies.
- Simplified React Native setup by moving Babel config out of `package.json`, fixing [#19](https://github.com/jaydenseric/apollo-upload-client/issues/19) via [#23](https://github.com/jaydenseric/apollo-upload-client/pull/23).
- Export a new `ReactNativeFile` class to more reliably identify files for upload in React Native, via [#17](https://github.com/jaydenseric/apollo-upload-client/pull/17).
- Renamed several exports for consistency with `apollo-client`, via [#18](https://github.com/jaydenseric/apollo-upload-client/pull/18).
  - `HTTPUploadNetworkInterface` renamed `UploadHTTPFetchNetworkInterface`.
  - `HTTPUploadBatchNetworkInterface` renamed `UploadHTTPBatchedNetworkInterface`.
  - `createBatchNetworkInterface` renamed `createBatchingNetworkInterface`.

## 4.1.1

- Updated dependencies.
- Compatibility changes for `apollo-client@1.5.0`:
  - Prevent a query batching error caused by an API change, fixing [#20](https://github.com/jaydenseric/apollo-upload-client/issues/20).
  - Support the new [`batchMax`](https://github.com/apollographql/core-docs/pull/302/files) option in `createBatchNetworkInterface`.

## 4.1.0

- Documented React Native.

## 4.1.0-alpha.2

- Fixed error when `File` and `FileList` are undefined globals in React Native, see [comment](https://github.com/jaydenseric/apollo-upload-client/issues/10#issuecomment-310336487).

## 4.1.0-alpha.1

- Support React Native, fixing [#10](https://github.com/jaydenseric/apollo-upload-client/issues/10).

## 4.0.7

- Prevent error caused by `null` values in query/mutation variables, fixing [#15](https://github.com/jaydenseric/apollo-upload-client/issues/15).

## 4.0.6

- Corrected `package-lock.json`.
- Source comment typo fix.

## 4.0.5

- Removed 2 dependencies by refactoring `extractRequestFiles` with bespoke recursion logic, shaving several KB off the bundle size and fixing [#13](https://github.com/jaydenseric/apollo-upload-client/issues/13).

## 4.0.4

- Updated dependencies.
- Added a changelog.
- Dropped Yarn in favor of npm@5. Removed `yarn.lock` and updated install instructions.
- New ESLint config. Dropped [Standard Style](https://standardjs.com) and began using [Prettier](https://github.com/prettier/eslint-plugin-prettier).
- Using [lint-staged](https://github.com/okonet/lint-staged) to ensure contributors don't commit lint errors.
- Removed `build:watch` script. Use `npm run build -- --watch` directly.

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

- Support `apollo-upload-server` v2 and [query batching](https://apollographql.com/docs/apollo-server/requests#batching).
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

- Initial release.
