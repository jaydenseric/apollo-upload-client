import { strictEqual } from "assert";
import { File, FormData } from "formdata-node";
import formDataAppendFile from "../../public/formDataAppendFile.js";

export default (tests) => {
  tests.add("`formDataAppendFile`.", () => {
    const formData = new FormData();
    const fieldName = "a";
    const fileName = "a.txt";
    const fileType = "text/plain";

    formDataAppendFile(
      formData,
      fieldName,
      new File(["a"], fileName, { type: fileType })
    );

    const formDataEntries = Array.from(formData.entries());

    strictEqual(formDataEntries.length, 1);
    strictEqual(formDataEntries[0][0], "a");
    strictEqual(typeof formDataEntries[0][1], "object");
    strictEqual(formDataEntries[0][1].name, fileName);
    strictEqual(formDataEntries[0][1].type, fileType);
  });
};
