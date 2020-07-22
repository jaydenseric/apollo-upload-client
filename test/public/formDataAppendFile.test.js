'use strict';

const { strictEqual } = require('assert');
const Blob = require('fetch-blob');
const FormData = require('formdata-node');
const formDataAppendFile = require('../../public/formDataAppendFile');

module.exports = (tests) => {
  tests.add('`formDataAppendFile`.', () => {
    const formData = new FormData();
    const fieldName = 'a';
    const filetype = 'text/plain';

    formDataAppendFile(
      formData,
      fieldName,
      new Blob(['a'], { type: filetype })
    );

    const formDataEntries = Array.from(formData.entries());

    strictEqual(formDataEntries.length, 1);
    strictEqual(formDataEntries[0][0], 'a');
    strictEqual(typeof formDataEntries[0][1], 'object');
    strictEqual(formDataEntries[0][1].name, 'blob');
    strictEqual(formDataEntries[0][1].type, filetype);
  });
};
