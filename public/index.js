"use strict";

exports.createUploadLink = require("./createUploadLink.js");
exports.formDataAppendFile = require("./formDataAppendFile.js");
exports.isExtractableFile = require("./isExtractableFile.js");
exports.ReactNativeFile = require("./ReactNativeFile.js");

/**
 * A React Native
 * [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) substitute.
 *
 * Be aware that inspecting network traffic with buggy versions of dev tools
 * such as [Flipper](https://fbflipper.com) can interfere with the React Native
 * `FormData` implementation, causing multipart requests to have network errors.
 * @kind typedef
 * @name ReactNativeFileSubstitute
 * @type {object}
 * @see [`extract-files` `ReactNativeFileSubstitute` docs](https://github.com/jaydenseric/extract-files#type-reactnativefilesubstitute).
 * @see [React Native `FormData` polyfill source](https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js#L34).
 * @prop {string} uri Filesystem path.
 * @prop {string} [name] File name.
 * @prop {string} [type] File content type. Some environments (particularly Android) require a valid MIME type; Expo `ImageResult.type` is unreliable as it can be just `image`.
 * @example <caption>A camera roll file.</caption>
 * ```js
 * const fileSubstitute = {
 *   uri: uriFromCameraRoll,
 *   name: "a.jpg",
 *   type: "image/jpeg",
 * };
 * ```
 */

/**
 * GraphQL request `fetch` options.
 * @kind typedef
 * @name FetchOptions
 * @type {object}
 * @see [Polyfillable fetch options](https://github.github.io/fetch#options).
 * @prop {object} headers HTTP request headers.
 * @prop {string} [credentials] Authentication credentials mode.
 */

/**
 * A function that checks if a value is an extractable file.
 * @kind typedef
 * @name ExtractableFileMatcher
 * @type {Function}
 * @param {*} value Value to check.
 * @returns {boolean} Is the value an extractable file.
 * @see [`isExtractableFile`]{@link isExtractableFile} has this type.
 * @example <caption>How to check for the default exactable files, as well as a custom type of file.</caption>
 * ```js
 * import isExtractableFile from "apollo-upload-client/public/isExtractableFile.js";
 *
 * const isExtractableFileEnhanced = (value) =>
 *   isExtractableFile(value) ||
 *   (typeof CustomFile !== "undefined" && value instanceof CustomFile);
 * ```
 */

/**
 * Appends a file extracted from the GraphQL operation to the
 * [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 * instance used as the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
 * `options.body` for the [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec).
 * @kind typedef
 * @name FormDataFileAppender
 * @param {FormData} formData [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance to append the specified file to.
 * @param {string} fieldName Field name for the file.
 * @param {*} file File to append. The file type depends on what the [`ExtractableFileMatcher`]{@link ExtractableFileMatcher} extracts.
 * @see [`formDataAppendFile`]{@link formDataAppendFile} has this type.
 * @see [`createUploadLink`]{@link createUploadLink} accepts this type in `options.formDataAppendFile`.
 */
