// @ts-check

import { ok, strictEqual } from "node:assert";
import { suite, test } from "node:test";

import formDataAppendFile from "./formDataAppendFile.mjs";
import assertBundleSize from "./test-helpers/assertBundleSize.mjs";

suite("Function `formDataAppendFile`.", { concurrency: true }, () => {
  test("Bundle size.", async () => {
    await assertBundleSize(
      new URL("./formDataAppendFile.mjs", import.meta.url),
      100,
    );
  });

  test("`Blob` instance.", () => {
    const formData = new FormData();
    const fieldName = "a";
    const fileType = "text/plain";

    formDataAppendFile(
      formData,
      fieldName,
      new Blob(["a"], {
        type: fileType,
      }),
    );

    const formDataEntries = Array.from(formData.entries());

    strictEqual(formDataEntries.length, 1);
    strictEqual(formDataEntries[0][0], "a");
    ok(typeof formDataEntries[0][1] === "object");
    strictEqual(formDataEntries[0][1].name, "blob");
    strictEqual(formDataEntries[0][1].type, fileType);
  });

  test("`File` instance.", () => {
    const formData = new FormData();
    const fieldName = "a";
    const fileName = "a.txt";
    const fileType = "text/plain";

    formDataAppendFile(
      formData,
      fieldName,
      new File(["a"], fileName, {
        type: fileType,
      }),
    );

    const formDataEntries = Array.from(formData.entries());

    strictEqual(formDataEntries.length, 1);
    strictEqual(formDataEntries[0][0], "a");
    ok(typeof formDataEntries[0][1] === "object");
    strictEqual(formDataEntries[0][1].name, fileName);
    strictEqual(formDataEntries[0][1].type, fileType);
  });
});
