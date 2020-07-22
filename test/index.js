'use strict';

const { TestDirector } = require('test-director');

const tests = new TestDirector();

require('./public/createUploadLink.test')(tests);
require('./public/formDataAppendFile.test')(tests);

tests.run();
