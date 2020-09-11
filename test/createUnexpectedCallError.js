'use strict';

const { AssertionError } = require('assert');

/**
 * Creates an assertion error that a function was unexpectedly called.
 * @kind function
 * @name createUnexpectedCallError
 * @returns {AssertionError} Assertion error.
 * @ignore
 */
module.exports = function createUnexpectedCallError() {
  return new AssertionError({
    message: 'Unexpected function call.',
    stackStartFn: createUnexpectedCallError,
  });
};
