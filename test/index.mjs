import TestDirector from 'test-director';
import testCreateUploadLink from './public/createUploadLink.test.mjs';
import testFormDataAppendFile from './public/formDataAppendFile.test.mjs';

const tests = new TestDirector();

testCreateUploadLink(tests);
testFormDataAppendFile(tests);

tests.run();
