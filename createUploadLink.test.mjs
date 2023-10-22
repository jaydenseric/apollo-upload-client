import { ApolloLink } from "@apollo/client/link/core/ApolloLink.js";
import { concat } from "@apollo/client/link/core/concat.js";
import { execute } from "@apollo/client/link/core/execute.js";
import { AbortController, AbortSignal } from "abort-controller";
import { deepEqual, deepStrictEqual, strictEqual } from "assert";
import { File, FormData } from "formdata-node";
import gql from "graphql-tag";
import { AbortError, Response } from "node-fetch";
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

export default (tests) => {
  tests.add("`createUploadLink` bundle size.", async () => {
    await assertBundleSize(
      new URL("./createUploadLink.mjs", import.meta.url),
      1800,
    );
  });

  tests.add(
    "`createUploadLink` with default options, a query, no files.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = "{\n  a\n}";
      const payload = { data: { a: true } };
      const revertGlobals = revertableGlobals({
        async fetch(uri, options) {
          fetchUri = uri;
          fetchOptions = options;

          return new Response(JSON.stringify(payload), graphqlResponseOptions);
        },
      });

      try {
        await timeLimitPromise(
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
          }),
        );

        strictEqual(fetchUri, defaultUri);

        const { signal: fetchOptionsSignal, ...fetchOptionsRest } =
          fetchOptions;

        // Defined in Node.js v15+.
        if (global.AbortSignal)
          strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

        deepEqual(fetchOptionsRest, {
          method: "POST",
          headers: { accept: "*/*", "content-type": "application/json" },
          body: JSON.stringify({ variables: {}, query }),
        });
        deepStrictEqual(nextData, payload);
      } finally {
        revertGlobals();
      }
    },
  );

  tests.add(
    "`createUploadLink` with default options, a mutation, files.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = "mutation ($a: Upload!) {\n  a(a: $a)\n}";
      const payload = { data: { a: true } };
      const fileName = "a.txt";
      const fileType = "text/plain";
      const revertGlobals = revertableGlobals({
        File,
        FormData,
        async fetch(uri, options) {
          fetchUri = uri;
          fetchOptions = options;

          return new Response(JSON.stringify(payload), graphqlResponseOptions);
        },
      });

      try {
        await timeLimitPromise(
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
          }),
        );

        strictEqual(fetchUri, defaultUri);
        strictEqual(typeof fetchOptions, "object");

        const {
          signal: fetchOptionsSignal,
          body: fetchOptionsBody,
          ...fetchOptionsRest
        } = fetchOptions;

        // Defined in Node.js v15+.
        if (global.AbortSignal)
          strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

        strictEqual(fetchOptionsBody instanceof FormData, true);

        const formDataEntries = Array.from(fetchOptionsBody.entries());

        strictEqual(formDataEntries.length, 3);
        strictEqual(formDataEntries[0][0], "operations");
        deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
          query,
          variables: { a: null },
        });
        strictEqual(formDataEntries[1][0], "map");
        deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
          1: ["variables.a"],
        });
        strictEqual(formDataEntries[2][0], "1");
        strictEqual(formDataEntries[2][1] instanceof File, true);
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
    },
  );

  tests.add("`createUploadLink` with option `uri`.", async () => {
    let fetchUri;
    let fetchOptions;
    let nextData;

    const uri = "http://localhost:3000";
    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            uri,
            async fetch(uri, options) {
              fetchUri = uri;
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
      }),
    );

    strictEqual(fetchUri, uri);

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    // Defined in Node.js v15+.
    if (global.AbortSignal)
      strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

    deepEqual(fetchOptionsRest, {
      method: "POST",
      headers: { accept: "*/*", "content-type": "application/json" },
      body: JSON.stringify({ variables: {}, query }),
    });
    deepStrictEqual(nextData, payload);
  });

  tests.add("`createUploadLink` with option `includeExtensions`.", async () => {
    let fetchUri;
    let fetchOptions;
    let nextData;

    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          concat(
            new ApolloLink((operation, forward) => {
              operation.extensions.a = true;
              return forward(operation);
            }),
            createUploadLink({
              includeExtensions: true,
              async fetch(uri, options) {
                fetchUri = uri;
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
      }),
    );

    strictEqual(fetchUri, defaultUri);

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    // Defined in Node.js v15+.
    if (global.AbortSignal)
      strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

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

  tests.add(
    "`createUploadLink` with option `fetchOptions.method`.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = "{\n  a\n}";
      const payload = { data: { a: true } };

      await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              fetchOptions: { method: "GET" },
              async fetch(uri, options) {
                fetchUri = uri;
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
        }),
      );

      strictEqual(
        fetchUri,
        `${defaultUri}?query=%7B%0A%20%20a%0A%7D&variables=%7B%7D`,
      );

      const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

      // Defined in Node.js v15+.
      if (global.AbortSignal)
        strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

      deepEqual(fetchOptionsRest, {
        method: "GET",
        headers: { accept: "*/*", "content-type": "application/json" },
      });
      deepStrictEqual(nextData, payload);
    },
  );

  tests.add(
    "`createUploadLink` with option `useGETForQueries`, query, no files.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = "{\n  a\n}";
      const payload = { data: { a: true } };

      await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              useGETForQueries: true,
              async fetch(uri, options) {
                fetchUri = uri;
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
        }),
      );

      strictEqual(
        fetchUri,
        `${defaultUri}?query=%7B%0A%20%20a%0A%7D&variables=%7B%7D`,
      );

      const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

      // Defined in Node.js v15+.
      if (global.AbortSignal)
        strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

      deepEqual(fetchOptionsRest, {
        method: "GET",
        headers: { accept: "*/*", "content-type": "application/json" },
      });
      deepStrictEqual(nextData, payload);
    },
  );

  tests.add(
    "`createUploadLink` with option `useGETForQueries`, query, files.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = "query ($a: Upload!) {\n  a(a: $a)\n}";
      const payload = { data: { a: true } };
      const fileName = "a.txt";
      const fileType = "text/plain";
      const revertGlobals = revertableGlobals({ File });

      try {
        await timeLimitPromise(
          new Promise((resolve, reject) => {
            execute(
              createUploadLink({
                useGETForQueries: true,
                FormData,
                async fetch(uri, options) {
                  fetchUri = uri;
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
          }),
        );

        strictEqual(fetchUri, defaultUri);
        strictEqual(typeof fetchOptions, "object");

        const {
          signal: fetchOptionsSignal,
          body: fetchOptionsBody,
          ...fetchOptionsRest
        } = fetchOptions;

        // Defined in Node.js v15+.
        if (global.AbortSignal)
          strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

        strictEqual(fetchOptionsBody instanceof FormData, true);

        const formDataEntries = Array.from(fetchOptionsBody.entries());

        strictEqual(formDataEntries.length, 3);
        strictEqual(formDataEntries[0][0], "operations");
        deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
          query,
          variables: { a: null },
        });
        strictEqual(formDataEntries[1][0], "map");
        deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
          1: ["variables.a"],
        });
        strictEqual(formDataEntries[2][0], "1");
        strictEqual(formDataEntries[2][1] instanceof File, true);
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
    },
  );

  tests.add(
    "`createUploadLink` with option `useGETForQueries`, query, no files, unserializable variables.",
    async () => {
      let fetched = false;

      const query = "query($a: Boolean) {\n  a(a: $a)\n}";
      const payload = { data: { a: true } };
      const parseError = new Error("Unserializable.");
      const observerError = await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              useGETForQueries: true,
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
      strictEqual(typeof observerError, "object");
      strictEqual(observerError.name, "Invariant Violation");
      strictEqual(observerError.parseError, parseError);
    },
  );

  tests.add(
    "`createUploadLink` with option `useGETForQueries`, mutation, no files.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = "mutation {\n  a\n}";
      const payload = { data: { a: true } };

      await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              useGETForQueries: true,
              async fetch(uri, options) {
                fetchUri = uri;
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
        }),
      );

      strictEqual(fetchUri, defaultUri);

      const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

      // Defined in Node.js v15+.
      if (global.AbortSignal)
        strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

      deepEqual(fetchOptionsRest, {
        method: "POST",
        headers: { accept: "*/*", "content-type": "application/json" },
        body: JSON.stringify({ variables: {}, query }),
      });
      deepStrictEqual(nextData, payload);
    },
  );

  tests.add("`createUploadLink` with context `clientAwareness`.", async () => {
    let fetchUri;
    let fetchOptions;
    let nextData;

    const clientAwareness = { name: "a", version: "1.0.0" };
    const query = "{\n  a\n}";
    const payload = { data: { a: true } };

    await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          concat(
            new ApolloLink((operation, forward) => {
              operation.setContext({ clientAwareness });
              return forward(operation);
            }),
            createUploadLink({
              async fetch(uri, options) {
                fetchUri = uri;
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
      }),
    );

    strictEqual(fetchUri, defaultUri);

    const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

    // Defined in Node.js v15+.
    if (global.AbortSignal)
      strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

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

  tests.add(
    "`createUploadLink` with context `clientAwareness`, overridden by context `headers`.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const clientAwarenessOriginal = { name: "a", version: "1.0.0" };
      const clientAwarenessOverride = { name: "b", version: "2.0.0" };
      const query = "{\n  a\n}";
      const payload = { data: { a: true } };

      await timeLimitPromise(
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
                async fetch(uri, options) {
                  fetchUri = uri;
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
        }),
      );

      strictEqual(fetchUri, defaultUri);

      const { signal: fetchOptionsSignal, ...fetchOptionsRest } = fetchOptions;

      // Defined in Node.js v15+.
      if (global.AbortSignal)
        strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

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
    },
  );

  tests.add(
    "`createUploadLink` with options `isExtractableFile` and `formDataAppendFile`.",
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = "mutation ($a: Upload!) {\n  a(a: $a)\n}";
      const payload = { data: { a: true } };
      const fileName = "a.txt";
      const fileType = "text/plain";

      class TextFile {
        constructor(content, fileName) {
          this.file = new File([content], fileName, { type: fileType });
        }
      }

      await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
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
              async fetch(uri, options) {
                fetchUri = uri;
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
        }),
      );

      strictEqual(fetchUri, defaultUri);
      strictEqual(typeof fetchOptions, "object");

      const {
        signal: fetchOptionsSignal,
        body: fetchOptionsBody,
        ...fetchOptionsRest
      } = fetchOptions;

      // Defined in Node.js v15+.
      if (global.AbortSignal)
        strictEqual(fetchOptionsSignal instanceof global.AbortSignal, true);

      strictEqual(fetchOptionsBody instanceof FormData, true);

      const formDataEntries = Array.from(fetchOptionsBody.entries());

      strictEqual(formDataEntries.length, 3);
      strictEqual(formDataEntries[0][0], "operations");
      deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
        query,
        variables: { a: null },
      });
      strictEqual(formDataEntries[1][0], "map");
      deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
        1: ["variables.a"],
      });
      strictEqual(formDataEntries[2][0], "1");
      strictEqual(formDataEntries[2][1] instanceof File, true);
      strictEqual(formDataEntries[2][1].name, fileName);
      strictEqual(formDataEntries[2][1].type, fileType);
      deepEqual(fetchOptionsRest, {
        method: "POST",
        headers: { accept: "*/*" },
      });
      deepStrictEqual(nextData, payload);
    },
  );

  tests.add("`createUploadLink` with a HTTP error, data.", async () => {
    let fetchResponse;
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

  tests.add("`createUploadLink` with a HTTP error, no data.", async () => {
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

  tests.add("`createUploadLink` with a fetch error.", async () => {
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

  tests.add(
    "`createUploadLink` with option `fetchOptions.signal`, not yet aborted.",
    async () => {
      let fetchUri;
      let fetchOptions;

      const query = "{\n  a\n}";
      const payload = { data: { a: true } };
      const controller = new AbortController();
      const fetchError = new AbortError("The operation was aborted.");
      const revertGlobals = revertableGlobals({ AbortController, AbortSignal });

      try {
        const observerErrorPromise = timeLimitPromise(
          new Promise((resolve, reject) => {
            execute(
              createUploadLink({
                fetchOptions: { signal: controller.signal },
                fetch(uri, options) {
                  fetchUri = uri;
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

                    options.signal.addEventListener("abort", () => {
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

        strictEqual(fetchUri, defaultUri);
        deepEqual(fetchOptions, {
          method: "POST",
          headers: { accept: "*/*", "content-type": "application/json" },
          body: JSON.stringify({ variables: {}, query }),
          signal: controller.signal,
        });
        strictEqual(observerError, fetchError);
      } finally {
        revertGlobals();
      }
    },
  );

  tests.add(
    "`createUploadLink` with option `fetchOptions.signal`, already aborted.",
    async () => {
      let fetchUri;
      let fetchOptions;

      const query = "{\n  a\n}";
      const payload = { data: { a: true } };

      const controller = new AbortController();
      controller.abort();

      const fetchError = new AbortError("The operation was aborted.");
      const revertGlobals = revertableGlobals({ AbortController, AbortSignal });

      try {
        const observerErrorPromise = timeLimitPromise(
          new Promise((resolve, reject) => {
            execute(
              createUploadLink({
                fetchOptions: { signal: controller.signal },
                async fetch(uri, options) {
                  fetchUri = uri;
                  fetchOptions = options;

                  if (options.signal.aborted) throw fetchError;

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

        strictEqual(fetchUri, defaultUri);
        deepEqual(fetchOptions, {
          method: "POST",
          headers: { accept: "*/*", "content-type": "application/json" },
          body: JSON.stringify({ variables: {}, query }),
          signal: controller.signal,
        });
        strictEqual(observerError, fetchError);
      } finally {
        revertGlobals();
      }
    },
  );
};
