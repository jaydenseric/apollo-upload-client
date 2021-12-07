"use strict";

/**
 * Used to mark
 * [React Native `File` substitutes]{@link ReactNativeFileSubstitute} as it’s
 * too risky to assume all objects with `uri`, `type` and `name` properties are
 * extractable files.
 * @kind class
 * @name ReactNativeFile
 * @param {ReactNativeFileSubstitute} file A [React Native](https://reactnative.dev) [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) substitute.
 * @see [`extract-files` `ReactNativeFile` docs](https://github.com/jaydenseric/extract-files#class-reactnativefile).
 * @example <caption>Ways to `import`.</caption>
 * ```js
 * import { ReactNativeFile } from "apollo-upload-client";
 * ```
 *
 * ```js
 * import ReactNativeFile from "apollo-upload-client/public/ReactNativeFile.js";
 * ```
 * @example <caption>Ways to `require`.</caption>
 * ```js
 * const { ReactNativeFile } = require("apollo-upload-client");
 * ```
 *
 * ```js
 * const ReactNativeFile = require("apollo-upload-client/public/ReactNativeFile.js");
 * ```
 * @example <caption>A file in [React Native](https://reactnative.dev) that can be used in query or mutation variables.</caption>
 * ```js
 * const file = new ReactNativeFile({
 *   uri: uriFromCameraRoll,
 *   name: "a.jpg",
 *   type: "image/jpeg",
 * });
 * ```
 */
module.exports = require("extract-files/public/ReactNativeFile.js");
