// @ts-check

import { deepEqual, deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";

import { ApolloLink } from "@apollo/client/link/core/ApolloLink.js";
import { concat } from "@apollo/client/link/core/concat.js";
import { execute } from "@apollo/client/link/core/execute.js";
import { stripIgnoredCharacters } from "graphql";
import { gql } from "graphql-tag";
import revertableGlobals from "revertable-globals";

import createUploadLink from "./createUploadLink.mjs";
import assertBundleSize from "./test/assertBundleSize.mjs";
import createUnexpectedCallError from "./test/createUnexpectedCallError.mjs";
import timeLimitPromise from "./test/timeLimitPromise.mjs";

const defaultUri = "/graphql";
const graphqlResponseOptions = {
  status: 200,
  headers: {
    "Content-Type": "application/graphql+json",
  },
};

describe("Function `createUploadLink`.", { concurrency: true }, () => {
  it("Bundle size.", async () => {
    await assertBundleSize(
      new URL("./createUploadLink.mjs", import.meta.url),
      1800,
    );
  });

  it("Default options, a query, no files.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };
    const revertGlobals = revertableGlobals({
      /** @satisfies {typeof fetch} */
      fetch: async function fetch(input, options) {
        fetchInput = input;
        fetchOptions = options;

        return new Response(JSON.stringify(payload), graphqlResponseOptions);
      },
    });

    try {
      await timeLimitPromise(
        /** @type {Promise<void>} */ (
          new Promise((resolve, reject) => {
            execute(createUploadLink(), {
              query: gql(query),
            }).subscribe({
              next(data) {
                nextData = data;
              },
              error() {
                reject(createUnexpectedCallError());
              },
              complete() {
                resolve();
              },
            });
          })
        ),
      );

      strictEqual(fetchInput, defaultUri);
      ok(typeof fetchOptions === "object");

      const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

      ok(fetchOptionsSignal instanceof AbortSignal);
      deepEqual(fetchOptionsRest, {
        method: "POST",
        headers: { accept: "*/*", "content-type": "application/json" },
        body: JSON.stringify({ variables: {}, query }),
      });
      deepStrictEqual(nextData, payload);
    } finally {
      revertGlobals();
    }
  });

  it("Default options, a mutation, files.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "mutation ($a: Upload!) {\n  a(a: $a)\n}";
    const payload = { data: { a: true } };
    const fileName = "a.txt";
    const fileType = "text/plain";
    const revertGlobals = revertableGlobals({
      /** @satisfies {typeof fetch} */
      fetch: async function fetch(input, options) {
        fetchInput = input;
        fetchOptions = options;

        return new Response(JSON.stringify(payload), graphqlResponseOptions);
      },
    });

    try {
      await timeLimitPromise(
        /** @type {Promise<void>} */ (
          new Promise((resolve, reject) => {
            execute(createUploadLink(), {
              query: gql(query),
              variables: {
                a: new File(["a"], fileName, { type: fileType }),
              },
            }).subscribe({
              next(data) {
                nextData = data;
              },
              error() {
                reject(createUnexpectedCallError());
              },
              complete() {
                resolve();
              },
            });
          })
        ),
      );

      strictEqual(fetchInput, defaultUri);
      ok(typeof fetchOptions === "object");

      const {
        signal: fetchOptionsSignal,
        body: fetchOptionsBody,
        ...fetchOptionsRest
      } = fetchOptions;

      ok(fetchOptionsSignal instanceof AbortSignal);
      ok(fetchOptionsBody instanceof FormData);

      const formDataEntries = Array.from(fetchOptionsBody.entries());

      strictEqual(formDataEntries.length, 3);
      strictEqual(formDataEntries[0][0], "operations");
      ok(typeof formDataEntries[0][1] === "string");
      deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
        query,
        variables: { a: null },
      });
      strictEqual(formDataEntries[1][0], "map");
      ok(typeof formDataEntries[1][1] === "string");
      deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
        1: ["variables.a"],
      });
      strictEqual(formDataEntries[2][0], "1");
      ok(formDataEntries[2][1] instanceof File);
      strictEqual(formDataEntries[2][1].name, fileName);
      strictEqual(formDataEntries[2][1].type, fileType);
      deepEqual(fetchOptionsRest, {
        method: "POST",
        headers: { accept: "*/*" },
      });
      deepStrictEqual(nextData, payload);
    } finally {
      revertGlobals();
    }
  });

  it("Option `uri`.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const uri = "http://localhost:3000";
    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              uri,
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, uri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({ variables: {}, query }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `includeExtensions`.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            concat(
              new ApolloLink((operation, forward) => {
                operation.extensions.a = true;
                return forward(operation);
              }),
              createUploadLink({
                includeExtensions: true,
                async fetch(input, options) {
                  fetchInput = input;
                  fetchOptions = options;

                  return new Response(
                    JSON.stringify(payload),
                    graphqlResponseOptions,
                  );
                },
              }),
            ),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({
        variables: {},
        extensions: {
          a: true,
        },
        query,
      }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `includeUnusedVariables`, set to false.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "query ($a: Boolean) {\n  a(a: $a)\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              includeUnusedVariables: false,
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
              variables: {
                a: true,
                b: true,
              },
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({
        variables: {
          a: true,
        },
        query,
      }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `includeUnusedVariables`, set to true.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "query ($a: Boolean) {\n  a(a: $a)\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              includeUnusedVariables: true,
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
              variables: {
                a: true,
                b: true,
              },
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({
        variables: {
          a: true,
          b: true,
        },
        query,
      }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `print`.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              print: (ast, originalPrint) =>
                stripIgnoredCharacters(originalPrint(ast)),
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({
        variables: {},
        query: stripIgnoredCharacters(query),
      }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `fetchOptions.method`.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              fetchOptions: { method: "GET" },
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(
      fetchInput,
      `${defaultUri}?query=%7B%0A%20%20a%0A%7D&variables=%7B%7D`,
    );
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "GET",
      headers: { accept: "*/*", "content-type": "application/json" },
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `useGETForQueries`, query, no files.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              useGETForQueries: true,
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(
      fetchInput,
      `${defaultUri}?query=%7B%0A%20%20a%0A%7D&variables=%7B%7D`,
    );
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "GET",
      headers: { accept: "*/*", "content-type": "application/json" },
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `useGETForQueries`, query, files.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "query ($a: Upload!) {\n  a(a: $a)\n}";
    const payload = { data: { a: true } };
    const fileName = "a.txt";
    const fileType = "text/plain";

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              useGETForQueries: true,
              FormData,
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
              variables: {
                a: new File(["a"], fileName, { type: fileType }),
              },
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const {
      signal: fetchOptionsSignal,
      body: fetchOptionsBody,
      ...fetchOptionsRest
    } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    ok(fetchOptionsBody instanceof FormData);

    const formDataEntries = Array.from(fetchOptionsBody.entries());

    strictEqual(formDataEntries.length, 3);
    strictEqual(formDataEntries[0][0], "operations");
    ok(typeof formDataEntries[0][1] === "string");
    deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
      query,
      variables: { a: null },
    });
    strictEqual(formDataEntries[1][0], "map");
    ok(typeof formDataEntries[1][1] === "string");
    deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
      1: ["variables.a"],
    });
    strictEqual(formDataEntries[2][0], "1");
    ok(formDataEntries[2][1] instanceof File);
    strictEqual(formDataEntries[2][1].name, fileName);
    strictEqual(formDataEntries[2][1].type, fileType);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*" },
    });
    deepStrictEqual(nextData, payload);
  });

  it("Option `useGETForQueries`, query, no files, unserializable variables.", async () => {
    let fetched = false;

    const query = "query ($a: Boolean) {\n  a(a: $a)\n}";
    const payload = { data: { a: true } };
    const parseError = new Error("Unserializable.");
    const observerError = await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            useGETForQueries: true,
            includeUnusedVariables: true,
            async fetch() {
              fetched = true;

              return new Response(
                JSON.stringify(payload),
                graphqlResponseOptions,
              );
            },
          }),
          {
            query: gql(query),
            variables: {
              // A circular reference would be a more realistic way to cause a
              // `JSON.stringify` error, but unfortunately that triggers an
              // `extractFiles` bug:
              // https://github.com/jaydenseric/extract-files/issues/14
              toJSON() {
                throw parseError;
              },
            },
          },
        ).subscribe({
          next() {
            reject(createUnexpectedCallError());
          },
          error(error) {
            resolve(error);
          },
          complete() {
            reject(createUnexpectedCallError());
          },
        });
      }),
    );

    strictEqual(fetched, false);
    ok(typeof observerError === "object");
    strictEqual(observerError.name, "Invariant Violation");
    strictEqual(observerError.parseError, parseError);
  });

  it("Option `useGETForQueries`, mutation, no files.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "mutation {\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              useGETForQueries: true,
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({ variables: {}, query }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Context `clientAwareness`.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const clientAwareness = { name: "a", version: "1.0.0" };
    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            concat(
              new ApolloLink((operation, forward) => {
                operation.setContext({ clientAwareness });
                return forward(operation);
              }),
              createUploadLink({
                async fetch(input, options) {
                  fetchInput = input;
                  fetchOptions = options;

                  return new Response(
                    JSON.stringify(payload),
                    graphqlResponseOptions,
                  );
                },
              }),
            ),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        "apollographql-client-name": clientAwareness.name,
        "apollographql-client-version": clientAwareness.version,
      },
      body: JSON.stringify({ variables: {}, query }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Context `clientAwareness`, overridden by context `headers`.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const clientAwarenessOriginal = { name: "a", version: "1.0.0" };
    const clientAwarenessOverride = { name: "b", version: "2.0.0" };
    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            concat(
              new ApolloLink((operation, forward) => {
                operation.setContext({
                  clientAwareness: clientAwarenessOriginal,
                  headers: {
                    "apollographql-client-name": clientAwarenessOverride.name,
                    "apollographql-client-version":
                      clientAwarenessOverride.version,
                  },
                });
                return forward(operation);
              }),
              createUploadLink({
                async fetch(input, options) {
                  fetchInput = input;
                  fetchOptions = options;

                  return new Response(
                    JSON.stringify(payload),
                    graphqlResponseOptions,
                  );
                },
              }),
            ),
            {
              query: gql(query),
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        "apollographql-client-name": clientAwarenessOverride.name,
        "apollographql-client-version": clientAwarenessOverride.version,
      },
      body: JSON.stringify({ variables: {}, query }),
    });
    deepStrictEqual(nextData, payload);
  });

  it("Options `isExtractableFile` and `formDataAppendFile`.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    /** @type {unknown} */
    let nextData;

    const query = "mutation ($a: Upload!) {\n  a(a: $a)\n}";
    const payload = { data: { a: true } };
    const fileName = "a.txt";
    const fileType = "text/plain";

    class TextFile {
      /**
       * @param {string} text Text.
       * @param {string} fileName File name.
       */
      constructor(text, fileName) {
        this.file = new File([text], fileName, { type: fileType });
      }
    }

    await timeLimitPromise(
      /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              /** @returns {value is TextFile} */
              isExtractableFile(value) {
                return value instanceof TextFile;
              },
              formDataAppendFile(formData, fieldName, file) {
                formData.append(
                  fieldName,
                  file instanceof TextFile ? file.file : file,
                );
              },
              FormData,
              async fetch(input, options) {
                fetchInput = input;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions,
                );
              },
            }),
            {
              query: gql(query),
              variables: {
                a: new TextFile("a", fileName),
              },
            },
          ).subscribe({
            next(data) {
              nextData = data;
            },
            error() {
              reject(createUnexpectedCallError());
            },
            complete() {
              resolve();
            },
          });
        })
      ),
    );

    strictEqual(fetchInput, defaultUri);
    ok(typeof fetchOptions === "object");

    const {
      signal: fetchOptionsSignal,
      body: fetchOptionsBody,
      ...fetchOptionsRest
    } = fetchOptions;

    ok(fetchOptionsSignal instanceof AbortSignal);
    ok(fetchOptionsBody instanceof FormData);

    const formDataEntries = Array.from(fetchOptionsBody.entries());

    strictEqual(formDataEntries.length, 3);
    strictEqual(formDataEntries[0][0], "operations");
    ok(typeof formDataEntries[0][1] === "string");
    deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
      query,
      variables: { a: null },
    });
    strictEqual(formDataEntries[1][0], "map");
    ok(typeof formDataEntries[1][1] === "string");
    deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
      1: ["variables.a"],
    });
    strictEqual(formDataEntries[2][0], "1");
    ok(formDataEntries[2][1] instanceof File);
    strictEqual(formDataEntries[2][1].name, fileName);
    strictEqual(formDataEntries[2][1].type, fileType);
    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*" },
    });
    deepStrictEqual(nextData, payload);
  });

  it("HTTP error, data.", async () => {
    /** @type {Response | undefined} */
    let fetchResponse;

    /** @type {unknown} */
    let nextData;

    const payload = {
      errors: [
        {
          message: 'Cannot query field "b" on type "Query".',
          locations: [{ line: 1, column: 5 }],
        },
      ],
      data: { a: true },
    };
    const observerError = await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            async fetch() {
              return (fetchResponse = new Response(JSON.stringify(payload), {
                ...graphqlResponseOptions,
                status: 400,
              }));
            },
          }),
          {
            query: gql("{ a b }"),
          },
        ).subscribe({
          next(data) {
            nextData = data;
          },
          error(error) {
            resolve(error);
          },
          complete() {
            reject(createUnexpectedCallError());
          },
        });
      }),
    );

    strictEqual(observerError.name, "ServerError");
    strictEqual(observerError.statusCode, 400);
    strictEqual(observerError.response, fetchResponse);
    deepStrictEqual(observerError.result, payload);
    deepStrictEqual(nextData, payload);
  });

  it("HTTP error, no data.", async () => {
    /** @type {Response | undefined} */
    let fetchResponse;

    const payload = { errors: [{ message: "Unauthorized." }] };
    const observerError = await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            async fetch() {
              return (fetchResponse = new Response(JSON.stringify(payload), {
                ...graphqlResponseOptions,
                status: 401,
              }));
            },
          }),
          {
            query: gql("{ a }"),
          },
        ).subscribe({
          next() {
            reject(createUnexpectedCallError());
          },
          error(error) {
            resolve(error);
          },
          complete() {
            reject(createUnexpectedCallError());
          },
        });
      }),
    );

    strictEqual(observerError.name, "ServerError");
    strictEqual(observerError.statusCode, 401);
    strictEqual(observerError.response, fetchResponse);
    deepStrictEqual(observerError.result, payload);
  });

  it("Fetch error.", async () => {
    const fetchError = new Error("Expected.");
    const observerError = await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            async fetch() {
              throw fetchError;
            },
          }),
          {
            query: gql("{ a }"),
          },
        ).subscribe({
          next() {
            reject(createUnexpectedCallError());
          },
          error(error) {
            resolve(error);
          },
          complete() {
            reject(createUnexpectedCallError());
          },
        });
      }),
    );

    strictEqual(observerError, fetchError);
  });

  it("Option `fetchOptions.signal`, not yet aborted.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };
    const controller = new AbortController();
    const fetchError = new Error("The operation was aborted.");

    const observerErrorPromise = timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            fetchOptions: { signal: controller.signal },
            fetch(input, options) {
              fetchInput = input;
              fetchOptions = options;

              return new Promise((resolve, reject) => {
                // Sleep a few seconds to simulate a slow request and
                // response. In this test the fetch should be aborted before
                // the timeout.
                const timeout = setTimeout(() => {
                  resolve(
                    new Response(
                      JSON.stringify(payload),
                      graphqlResponseOptions,
                    ),
                  );
                }, 4000);

                options?.signal?.addEventListener("abort", () => {
                  clearTimeout(timeout);
                  reject(fetchError);
                });
              });
            },
          }),
          {
            query: gql(query),
          },
        ).subscribe({
          next() {
            reject(createUnexpectedCallError());
          },
          error(error) {
            resolve(error);
          },
          complete() {
            reject(createUnexpectedCallError());
          },
        });
      }),
    );

    controller.abort();

    const observerError = await observerErrorPromise;

    strictEqual(fetchInput, defaultUri);
    deepEqual(fetchOptions, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({ variables: {}, query }),
      signal: controller.signal,
    });
    strictEqual(observerError, fetchError);
  });

  it("Option `fetchOptions.signal`, already aborted.", async () => {
    /** @type {unknown} */
    let fetchInput;

    /** @type {RequestInit | undefined} */
    let fetchOptions;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    const controller = new AbortController();
    controller.abort();

    const fetchError = new Error("The operation was aborted.");

    const observerErrorPromise = timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            fetchOptions: { signal: controller.signal },
            async fetch(input, options) {
              fetchInput = input;
              fetchOptions = options;

              if (options?.signal?.aborted) throw fetchError;

              return new Response(
                JSON.stringify(payload),
                graphqlResponseOptions,
              );
            },
          }),
          {
            query: gql(query),
          },
        ).subscribe({
          next() {
            reject(createUnexpectedCallError());
          },
          error(error) {
            resolve(error);
          },
          complete() {
            reject(createUnexpectedCallError());
          },
        });
      }),
    );

    const observerError = await observerErrorPromise;

    strictEqual(fetchInput, defaultUri);
    deepEqual(fetchOptions, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({ variables: {}, query }),
      signal: controller.signal,
    });
    strictEqual(observerError, fetchError);
  });
});
