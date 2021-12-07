import { AssertionError } from "assert";

/**
 * Creates an assertion error that a function was unexpectedly called.
 * @kind function
 * @name createUnexpectedCallError
 * @returns {AssertionError} Assertion error.
 * @ignore
 */
export default function createUnexpectedCallError() {
  return new AssertionError({
    message: "Unexpected function call.",
    stackStartFn: createUnexpectedCallError,
  });
}
