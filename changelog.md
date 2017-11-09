# apollo-upload-client change log

## next

* Match the `apollo-link-http` API and support setting `credentials` and
  `headers` directly on the link and via context, fixing
  [#36](https://github.com/jaydenseric/apollo-upload-client/issues/36).
* Fixed [a
  bug](https://github.com/jaydenseric/apollo-upload-client/pull/37#issuecomment-343005839)
  that can cause the wrong `content-type: application/json` header to be used
  when uploading.
* Updated change log Apollo documentation links.
* Change log is now prettier.

## 6.0.0-beta.1

* Updated dependencies.
* Apollo Client v2 compatibility:
  * Export a terminating Apollo Link instead of custom network interfaces.
  * New `apollo-link` and `graphql` peer dependencies.
* Rejigged package scripts.
* Updated Prettier and ESLint config.
* Lint errors when attempting to commit partially staged files no longer commits
  the whole file.
* Using Babel v7 directly instead of Rollup.
* Using `babel-preset-env` to handle polyfills so only required ones are
  included for our level of browser support.
* Using `prettier` to format distribution code as well as source code.
* No more source maps, as Prettier does not support them.
* Renamed `dist` directory to `lib`.
* Module files now have `.mjs` extension.
* Removed `babel-eslint` as the vanilla parser works fine.
* Readme improvements:
  * Relative logo path.
  * Added links to badges.
  * Simplified code examples.
  * Mark relevant example code blocks as JSX instead of JS.
  * Removed the inspiration links; they are less relevant to the evolved
    codebase.

## 5.1.1

* Updated dependencies.
* Readme fixes:
  * Fixed usage example code for `ReactNativeFile.list`.
  * Fixed capitalization of ‘npm’.

## 5.1.0

* Updated dependencies.
* Readme tweaks including a new licence badge.
* Fixed Rollup build warnings.
* Fixed an npm v5 warning by using `prepublishOnly` instead of `prepublish`.
* Refactored network interfaces; moved file extraction logic and
  `ReactNativeFile` to a seperate
  [`extract-files`](https://npm.im/extract-files) package.

## 5.0.0

* Removed `package-lock.json`. Lockfiles are [not
  recommended](https://github.com/sindresorhus/ama/issues/479#issuecomment-310661514)
  for packages.
* Readme tweaks and fixes:
  * Renamed the `File` input type `Upload` for clarity.
  * Wording and formatting improvements.

## 5.0.0-alpha.1

* Updated dependencies.
* Simplified React Native setup by moving Babel config out of `package.json`,
  fixing [#19](https://github.com/jaydenseric/apollo-upload-client/issues/19)
  via [#23](https://github.com/jaydenseric/apollo-upload-client/pull/23).
* Export a new `ReactNativeFile` class to more reliably identify files for
  upload in React Native, via
  [#17](https://github.com/jaydenseric/apollo-upload-client/pull/17).
* Renamed several exports for consistency with `apollo-client`, via
  [#18](https://github.com/jaydenseric/apollo-upload-client/pull/18).
  * `HTTPUploadNetworkInterface` renamed `UploadHTTPFetchNetworkInterface`.
  * `HTTPUploadBatchNetworkInterface` renamed
    `UploadHTTPBatchedNetworkInterface`.
  * `createBatchNetworkInterface` renamed `createBatchingNetworkInterface`.

## 4.1.1

* Updated dependencies.
* Compatibility changes for `apollo-client@1.5.0`:
  * Prevent a query batching error caused by an API change, fixing
    [#20](https://github.com/jaydenseric/apollo-upload-client/issues/20).
  * Support the new
    [`batchMax`](https://github.com/apollographql/core-docs/pull/302/files)
    option in `createBatchNetworkInterface`.

## 4.1.0

* Documented React Native.

## 4.1.0-alpha.2

* Fixed error when `File` and `FileList` are undefined globals in React Native,
  see
  [comment](https://github.com/jaydenseric/apollo-upload-client/issues/10#issuecomment-310336487).

## 4.1.0-alpha.1

* Support React Native, fixing
  [#10](https://github.com/jaydenseric/apollo-upload-client/issues/10).

## 4.0.7

* Prevent error caused by `null` values in query/mutation variables, fixing
  [#15](https://github.com/jaydenseric/apollo-upload-client/issues/15).

## 4.0.6

* Corrected `package-lock.json`.
* Source comment typo fix.

## 4.0.5

* Removed 2 dependencies by refactoring `extractRequestFiles` with bespoke
  recursion logic, shaving several KB off the bundle size and fixing
  [#13](https://github.com/jaydenseric/apollo-upload-client/issues/13).

## 4.0.4

* Updated dependencies.
* Added a change log.
* Dropped Yarn in favor of npm@5. Removed `yarn.lock` and updated install
  instructions.
* New ESLint config. Dropped [Standard Style](https://standardjs.com) and began
  using [Prettier](https://github.com/prettier/eslint-plugin-prettier).
* Using [lint-staged](https://github.com/okonet/lint-staged) to ensure
  contributors don't commit lint errors.
* Removed `build:watch` script. Use `npm run build -- --watch` directly.

## 4.0.3

* Updated dependencies.
* Fixed fetch options not applying correctly, see
  [#9](https://github.com/jaydenseric/apollo-upload-client/pull/9).

## 4.0.2

* Updated readme examples:
  * Removed `PropTypes`. React no longer exports them and they are a distraction
    anyway.
  * Importing `gql` from `react-apollo`.
  * No longer using decorator syntax.
  * Using functional components in place of classes.

## 4.0.1

* Updated dependencies.
* No longer errors when network interface `opts` are not configured, fixing
  [#8](https://github.com/jaydenseric/apollo-upload-client/issues/8).
* Fixed the batch network interface always thinking there are files to upload,
  preventing the use of the fallback vanilla Apollo transport method when there
  are none.
* Simplified Babel config.

## 4.0.0

* Corrected the API for configuring fetch options, fixing
  [#6](https://github.com/jaydenseric/apollo-upload-client/issues/6)
  ([#7](https://github.com/jaydenseric/apollo-upload-client/pull/7)).

## 3.0.3

* The `extractRequestFiles` helper no longer converts the query AST to string as
  a side-effect, fixing
  [#5](https://github.com/jaydenseric/apollo-upload-client/issues/5).

## 3.0.2

* Updated dependencies.
* Fall back to regular network interface fetch methods if SSR or no files to
  upload, fixing
  [#3](https://github.com/jaydenseric/apollo-upload-client/issues/3).

## 3.0.1

* Better transpilation with `babel-runtime`. This should improve IE 11 support.

## 3.0.0

* Support `apollo-upload-server` v2 and [query
  batching](https://apollographql.com/docs/apollo-server/requests.html#batching).
* Removed the seemingly redundant `Accept` header from requests.
* Clearer package description.

## 2.0.2

* Updated dependencies.
* Internal refactor for a cleaner ES6 class extension and method override.

## 2.0.1

* Removed two unversioned files prematurely published to npm.

## 2.0.0

* Updated dependencies.
* New API:
  * Now exporting the custom network interface, which has been renamed
    `HTTPUploadNetworkInterface`. This enables it to be extended externally.
  * In preparation for adding another batched network interface,
    `createNetworkInterface` is now a named and not default export.
* Fixed the `uri` argument for `createNetworkInterface` ending up in the request
  options.
* Internally simplified `apollo-client` imports.
* Simpler linting setup.

## 1.0.2

* Fixed broken Github deep links in the readme.
* Readme rewording.
* Simplified package.json description.

## 1.0.1

* Added missing metadata to `package.json`.

## 1.0.0

* Initial release.
