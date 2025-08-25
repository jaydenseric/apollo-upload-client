// @ts-check

/** @import { Linter } from "eslint" */

import eslintJs from "@eslint/js";
import eslintPluginOptimalModules from "eslint-plugin-optimal-modules";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

/**
 * Globs for ESM files.
 * @satisfies {Array<string>}
 */
const globsEsm = ["**/**.mjs"];

/**
 * Globs for CJS files.
 * @satisfies {Array<string>}
 */
const globsCjs = ["**/**.cjs", "**/**.js"];

/**
 * Globs for all JavaScript files.
 * @satisfies {Array<string>}
 */
const globsJs = [...globsEsm, ...globsCjs];

/**
 * ESLint configuration.
 * @satisfies {Array<Linter.Config>}
 */
const eslintConfig = [
  {
    files: globsJs,
    ...eslintJs.configs.recommended,
  },
  {
    files: globsJs,
    rules: {
      "arrow-body-style": "error",
      "object-shorthand": "error",
      strict: "error",
    },
  },
  {
    files: globsEsm,
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
        ...globals.browser,
      },
    },
    plugins: {
      "simple-import-sort": eslintPluginSimpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: globsEsm,
    ...eslintPluginOptimalModules.configs.recommended,
  },
  {
    files: globsCjs,
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
];

export default eslintConfig;
