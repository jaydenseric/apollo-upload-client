// @ts-check

import { ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";

import formDataAppendFile from "./formDataAppendFile.mjs";
import assertBundleSize from "./test/assertBundleSize.mjs";

describe("Function `formDataAppendFile`.", { concurrency: true }, () => {
  it("Bundle size.", async () => {
    await assertBundleSize(
      new URL("./formDataAppendFile.mjs", import.meta.url),
      100,
    );
  });

  it("`Blob` instance.", () => {
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

  it("`File` instance.", () => {
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
