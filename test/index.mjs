import TestDirector from "test-director";

import test_createUploadLink from "./public/createUploadLink.test.mjs";
import test_formDataAppendFile from "./public/formDataAppendFile.test.mjs";

const tests = new TestDirector();

test_createUploadLink(tests);
test_formDataAppendFile(tests);

tests.run();
