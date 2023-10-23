// @ts-check

import { AssertionError } from "node:assert";

/** Creates an assertion error that a function was unexpectedly called. */
export default function createUnexpectedCallError() {
  return new AssertionError({
    message: "Unexpected function call.",
    stackStartFn: createUnexpectedCallError,
  });
}
