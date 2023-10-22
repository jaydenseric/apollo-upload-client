import { fail } from "node:assert";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";
import { gzipSize } from "gzip-size";

/**
 * Asserts the minified and gzipped bundle size of a module.
 * @kind function
 * @name assertBundleSize
 * @param {URL} moduleUrl Module URL.
 * @param {number} limit Minified and gzipped bundle size limit (bytes).
 * @returns {Promise<{ bundle: string, gzippedSize: number }>} Resolves the minified bundle and its gzipped size (bytes).
 * @ignore
 */
export default async function assertBundleSize(moduleUrl, limit) {
  if (!(moduleUrl instanceof URL))
    throw new TypeError("Argument 1 `moduleUrl` must be a `URL` instance.");

  if (typeof limit !== "number")
    throw new TypeError("Argument 2 `limit` must be a number.");

  const {
    outputFiles: [bundle],
  } = await esbuild.build({
    entryPoints: [fileURLToPath(moduleUrl)],
    external:
      // Package peer dependencies.
      ["@apollo/client", "graphql"],
    write: false,
    bundle: true,
    minify: true,
    legalComments: "none",
    format: "esm",
  });

  const gzippedSize = await gzipSize(bundle.contents);

  if (gzippedSize > limit)
    fail(
      `${gzippedSize} B minified and gzipped bundle exceeds the ${limit} B limit by ${
        gzippedSize - limit
      } B; increase the limit or reduce the bundle size.`,
    );

  const surplus = limit - gzippedSize;

  // Error if the surplus is greater than 25% of the limit.
  if (surplus > limit * 0.25)
    throw new Error(
      `${gzippedSize} B minified and gzipped bundle is under the ${limit} B limit by ${surplus} B; reduce the limit.`,
    );

  // For debugging in tests.
  return { bundle: bundle.text, gzippedSize };
}
