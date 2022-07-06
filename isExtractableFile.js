"use strict";

/**
 * The default implementation for [`createUploadLink`]{@link createUploadLink}
 * `options.isExtractableFile`.
 * @kind function
 * @name isExtractableFile
 * @type {ExtractableFileMatcher}
 * @param {*} value Value to check.
 * @returns {boolean} Is the value an extractable file.
 * @see [`extract-files` `isExtractableFile` docs](https://github.com/jaydenseric/extract-files#function-isextractablefile).
 * @example <caption>How to `import`.</caption>
 * ```js
 * import isExtractableFile from "apollo-upload-client/isExtractableFile.js";
 * ```
 * @example <caption>How to `require`.</caption>
 * ```js
 * const isExtractableFile = require("apollo-upload-client/isExtractableFile.js");
 * ```
 */
module.exports = require("extract-files/public/isExtractableFile.js");
