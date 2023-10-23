// @ts-check

/**
 * The default implementation for the function `createUploadLink` option
 * `formDataAppendFile` that uses the standard {@linkcode FormData.append}
 * method.
 * @param {FormData} formData Form data to append the specified file to.
 * @param {string} fieldName Field name for the file.
 * @param {import("./isExtractableFile.mjs").ExtractableFile} file File to
 *   append.
 */
export default function formDataAppendFile(formData, fieldName, file) {
  "name" in file
    ? formData.append(fieldName, file, file.name)
    : formData.append(fieldName, file);
}
