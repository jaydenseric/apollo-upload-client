/**
 * Used to mark
 * [React Native `File` substitutes]{@link ReactNativeFileSubstitute} as it’s
 * too risky to assume all objects with `uri`, `type` and `name` properties are
 * extractable files.
 * @kind class
 * @name ReactNativeFile
 * @param {ReactNativeFileSubstitute} file A [React Native](https://reactnative.dev) [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) substitute.
 * @see [`extract-files` `ReactNativeFile` docs](https://github.com/jaydenseric/extract-files#class-reactnativefile).
 * @example <caption>How to import.</caption>
 * ```js
 * import ReactNativeFile from "apollo-upload-client/ReactNativeFile.mjs";
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
export { default } from "extract-files/public/ReactNativeFile.js";

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
