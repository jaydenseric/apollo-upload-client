import TestDirector from 'test-director';
import testBundle from './bundle.test.mjs';
import testCreateUploadLink from './public/createUploadLink.test.mjs';
import testFormDataAppendFile from './public/formDataAppendFile.test.mjs';

const tests = new TestDirector();

testCreateUploadLink(tests);
testFormDataAppendFile(tests);
testBundle(tests);

tests.run();
