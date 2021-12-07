import TestDirector from "test-director";
import test_bundle from "./bundle.test.mjs";
import test_createUploadLink from "./public/createUploadLink.test.mjs";
import test_formDataAppendFile from "./public/formDataAppendFile.test.mjs";

const tests = new TestDirector();

test_createUploadLink(tests);
test_formDataAppendFile(tests);
test_bundle(tests);

tests.run();
