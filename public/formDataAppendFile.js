"use strict";

/**
 * The default implementation for [`createUploadLink`]{@link createUploadLink}
 * `options.formDataAppendFile` that uses the standard
 * [`FormData.append`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/append)
 * method.
 * @kind function
 * @name formDataAppendFile
 * @type {FormDataFileAppender}
 * @param {FormData} formData [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instance to append the specified file to.
 * @param {string} fieldName Field name for the file.
 * @param {*} file File to append.
 * @example <caption>Ways to `import`.</caption>
 * ```js
 * import { formDataAppendFile } from "apollo-upload-client";
 * ```
 *
 * ```js
 * import formDataAppendFile from "apollo-upload-client/public/formDataAppendFile.js";
 * ```
 * @example <caption>Ways to `require`.</caption>
 * ```js
 * const { formDataAppendFile } = require("apollo-upload-client");
 * ```
 *
 * ```js
 * const formDataAppendFile = require("apollo-upload-client/public/formDataAppendFile.js");
 * ```
 */
module.exports = function formDataAppendFile(formData, fieldName, file) {
  formData.append(fieldName, file, file.name);
};
