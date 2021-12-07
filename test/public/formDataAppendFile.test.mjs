import { strictEqual } from "assert";
// `eslint-plugin-import` has a parse error if the imported module contains
// private instance fields, see:
// https://github.com/benmosher/eslint-plugin-import/issues/2124
// eslint-disable-next-line import/namespace, import/default, import/no-named-as-default, import/no-named-as-default-member
import Blob from "fetch-blob";
import { FormData } from "formdata-node";
import formDataAppendFile from "../../public/formDataAppendFile.js";

export default (tests) => {
  tests.add("`formDataAppendFile`.", () => {
    const formData = new FormData();
    const fieldName = "a";
    const filetype = "text/plain";

    formDataAppendFile(
      formData,
      fieldName,
      new Blob(["a"], { type: filetype })
    );

    const formDataEntries = Array.from(formData.entries());

    strictEqual(formDataEntries.length, 1);
    strictEqual(formDataEntries[0][0], "a");
    strictEqual(typeof formDataEntries[0][1], "object");
    strictEqual(formDataEntries[0][1].name, "blob");
    strictEqual(formDataEntries[0][1].type, filetype);
  });
};
