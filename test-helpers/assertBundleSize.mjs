// @ts-check

import { fail } from "node:assert";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { gzipSize } from "gzip-size";

/**
 * Asserts the minified and gzipped bundle size of a module.
 * @param {URL} moduleUrl Module URL.
 * @param {number} limit Minified and gzipped bundle size limit (bytes).
 * @param {Array<string>} [external] External dependencies to exclude from the
 *   bundle.
 * @returns Resolves the minified bundle and its gzipped size (bytes).
 */
export default async function assertBundleSize(moduleUrl, limit, external) {
  if (!(moduleUrl instanceof URL))
    throw new TypeError("Argument 1 `moduleUrl` must be a `URL` instance.");

  if (typeof limit !== "number")
    throw new TypeError("Argument 2 `limit` must be a number.");

  if (external !== undefined) {
    if (!Array.isArray(external))
      throw new TypeError("Argument 3 `external` must be an array.");

    for (const [index, specifier] of external.entries())
      if (typeof specifier !== "string")
        throw new TypeError(
          `Argument 3 \`external\` entry ${index} must be a string.`,
        );
  }

  const {
    outputFiles: [bundle],
  } = await build({
    bundle: true,
    entryPoints: [fileURLToPath(moduleUrl)],
    external,
    format: "esm",
    legalComments: "none",
    minify: true,
    write: false,
  });

  const gzippedSize = await gzipSize(bundle.text);

  if (gzippedSize > limit)
    fail(
      `${gzippedSize} B minified and gzipped bundle exceeds the ${limit} B limit by ${gzippedSize - limit} B; increase the limit or reduce the bundle size.`,
    );

  const surplus = limit - gzippedSize;

  // Error if the surplus is greater than 25% of the limit.
  if (surplus > limit * 0.25)
    throw new RangeError(
      `${gzippedSize} B minified and gzipped bundle is under the ${limit} B limit by ${surplus} B; reduce the limit.`,
    );

  // For debugging in tests.
  return {
    /** The minified bundle. */
    bundle: bundle.text,

    /** The minified bundle’s gzipped size (bytes). */
    gzippedSize,
  };
}
