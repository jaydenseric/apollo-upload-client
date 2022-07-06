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
 * @example <caption>How to `import`.</caption>
 * ```js
 * import formDataAppendFile from "apollo-upload-client/formDataAppendFile.js";
 * ```
 * @example <caption>How to `require`.</caption>
 * ```js
 * const formDataAppendFile = require("apollo-upload-client/formDataAppendFile.js");
 * ```
 */
module.exports = function formDataAppendFile(formData, fieldName, file) {
  formData.append(fieldName, file, file.name);
};
