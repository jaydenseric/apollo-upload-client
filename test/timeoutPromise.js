'use strict';

const { AssertionError } = require('assert');

/**
 * Constructs a promise that rejects with an assertion error if it doesn’t
 * resolve or reject within a given timeout delay. This is useful for promises
 * that are expected to either resolve or reject in tests, as the Node.js
 * default behavior when neither happens is to exit the process without an
 * error, potentially causing the illusion that tests passed.
 * @kind function
 * @name timeoutPromise
 * @param {Function} executor Promise executor.
 * @param {number} [delay=1000] Timeout delay in milliseconds.
 * @returns {Promise} The constructed promise.
 * @ignore
 */
module.exports = async function timeoutPromise(executor, delay = 1000) {
  if (typeof executor !== 'function')
    throw new TypeError('First argument `executor` must be a function.');

  if (typeof delay !== 'number' || delay < 0)
    throw new TypeError('Second argument `delay` must be a positive number.');

  // Ensure the error stack trace starts at the location where `timeoutPromise`
  // is called. Creating the error within the `setTimeout` function would result
  // in an unhelpful stack trace.
  const error = new AssertionError({
    message: 'Promise timed out.',
    stackStartFn: timeoutPromise,
  });

  return new Promise((resolve, reject) => {
    // The timeout needs to be cleared when the promise resolves or rejects,
    // otherwise the process will continue to run until the delay completes.
    const timeout = setTimeout(() => {
      reject(error);
    }, delay);

    executor(
      (...args) => {
        clearTimeout(timeout);
        resolve(...args);
      },
      (...args) => {
        clearTimeout(timeout);
        reject(...args);
      }
    );
  });
};
