import { AssertionError } from "assert";

/**
 * Time limits a promise. It will reject with an assertion error if it doesn’t
 * resolve or reject within a given time limit. Useful in tests for promises
 * that are expected to either resolve or reject, as the Node.js behavior when
 * neither happens is to exit the process without an error, potentially causing
 * the illusion that tests passed.
 * @kind function
 * @name timeLimitPromise
 * @param {Promise} promise Promise to time limit.
 * @param {number} [msTimeLimit=1000] Time limit in milliseconds.
 * @returns {Promise} Time limited promise.
 * @ignore
 */
export default async function timeLimitPromise(promise, msTimeLimit = 1000) {
  if (!(promise instanceof Promise))
    throw new TypeError(
      "First argument `promise` must be an instance of `Promise`."
    );

  if (typeof msTimeLimit !== "number" || msTimeLimit < 0)
    throw new TypeError(
      "Second argument `msTimeLimit` must be a positive number."
    );

  // Ensure the error stack trace starts at the location where
  // `timeLimitPromise` is called. Creating the error within the `setTimeout`
  // callback function would result in an unhelpful stack trace.
  const error = new AssertionError({
    message: `Promise failed to resolve within the ${msTimeLimit} millisecond time limit.`,
    stackStartFn: timeLimitPromise,
  });

  let timeout;

  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(error);
      }, msTimeLimit);
    }),
  ]).finally(() => {
    // The timeout needs to be cleared when the promise resolves or rejects,
    // otherwise the process will continue to run until it completes.
    clearTimeout(timeout);
  });
}
