'use strict';

/**
 * Revertably polyfills the global environment.
 * @kind function
 * @name revertablePolyfills
 * @param {object} polyfills Polyfill map.
 * @returns {Function} Reverts the polyfills to restore the original global environment.
 * @ignore
 */
module.exports = function revertablePolyfills(polyfills) {
  const originalGlobals = {};

  for (const [key, value] of Object.entries(polyfills)) {
    originalGlobals[key] = global[key];
    global[key] = value;
  }

  return () => {
    for (const [key, value] of Object.entries(originalGlobals))
      global[key] = value;
  };
};
