'use strict';

const { deepStrictEqual, strictEqual } = require('assert');
const { ApolloLink, concat, execute, gql } = require('@apollo/client/core');
const { AbortController, AbortSignal } = require('abort-controller');
const Blob = require('fetch-blob');
const FormData = require('formdata-node');
const { AbortError, Response } = require('node-fetch');
const revertableGlobals = require('revertable-globals');
const createUploadLink = require('../../public/createUploadLink');
const createUnexpectedCallError = require('../createUnexpectedCallError');
const timeLimitPromise = require('../timeLimitPromise');

const defaultUri = '/graphql';
const graphqlResponseOptions = {
  status: 200,
  headers: {
    'Content-Type': 'application/graphql+json',
  },
};

module.exports = (tests) => {
  tests.add(
    '`createUploadLink` with default options, a query, no files.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = '{\n  a\n}\n';
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
          })
        );

        strictEqual(fetchUri, defaultUri);
        deepStrictEqual(fetchOptions, {
          method: 'POST',
          headers: { accept: '*/*', 'content-type': 'application/json' },
          credentials: undefined,
          body: JSON.stringify({ variables: {}, query }),
        });
        deepStrictEqual(nextData, payload);
      } finally {
        revertGlobals();
      }
    }
  );

  tests.add(
    '`createUploadLink` with default options, a mutation, files.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = 'mutation ($a: Upload!) {\n  a(a: $a)\n}\n';
      const payload = { data: { a: true } };
      const filetype = 'text/plain';
      const revertGlobals = revertableGlobals({
        Blob,
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
                a: new Blob(['a'], { type: filetype }),
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
        );

        strictEqual(fetchUri, defaultUri);
        strictEqual(typeof fetchOptions, 'object');

        const { body, ...fetchOptionsWithoutBody } = fetchOptions;

        deepStrictEqual(fetchOptionsWithoutBody, {
          method: 'POST',
          headers: { accept: '*/*' },
          credentials: undefined,
        });
        strictEqual(body instanceof FormData, true);

        const formDataEntries = Array.from(body.entries());

        strictEqual(formDataEntries.length, 3);
        strictEqual(formDataEntries[0][0], 'operations');
        deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
          query,
          variables: { a: null },
        });
        strictEqual(formDataEntries[1][0], 'map');
        deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
          1: ['variables.a'],
        });
        strictEqual(formDataEntries[2][0], '1');
        strictEqual(formDataEntries[2][1] instanceof Blob, true);
        strictEqual(formDataEntries[2][1].name, 'blob');
        strictEqual(formDataEntries[2][1].type, filetype);
        deepStrictEqual(nextData, payload);
      } finally {
        revertGlobals();
      }
    }
  );

  tests.add('`createUploadLink` with option `uri`.', async () => {
    let fetchUri;
    let fetchOptions;
    let nextData;

    const uri = 'http://localhost:3000';
    const query = '{\n  a\n}\n';
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
                graphqlResponseOptions
              );
            },
          }),
          {
            query: gql(query),
          }
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
    );

    strictEqual(fetchUri, uri);
    deepStrictEqual(fetchOptions, {
      method: 'POST',
      headers: { accept: '*/*', 'content-type': 'application/json' },
      credentials: undefined,
      body: JSON.stringify({ variables: {}, query }),
    });
    deepStrictEqual(nextData, payload);
  });

  tests.add('`createUploadLink` with option `includeExtensions`.', async () => {
    let fetchUri;
    let fetchOptions;
    let nextData;

    const query = '{\n  a\n}\n';
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
                  graphqlResponseOptions
                );
              },
            })
          ),
          {
            query: gql(query),
          }
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
    );

    strictEqual(fetchUri, defaultUri);
    deepStrictEqual(fetchOptions, {
      method: 'POST',
      headers: { accept: '*/*', 'content-type': 'application/json' },
      credentials: undefined,
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
    '`createUploadLink` with option `fetchOptions.method`.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = '{\n  a\n}\n';
      const payload = { data: { a: true } };

      await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              fetchOptions: { method: 'GET' },
              async fetch(uri, options) {
                fetchUri = uri;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions
                );
              },
            }),
            {
              query: gql(query),
            }
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
      );

      strictEqual(
        fetchUri,
        `${defaultUri}?query=%7B%0A%20%20a%0A%7D%0A&variables=%7B%7D`
      );
      deepStrictEqual(fetchOptions, {
        method: 'GET',
        headers: { accept: '*/*', 'content-type': 'application/json' },
        credentials: undefined,
      });
      deepStrictEqual(nextData, payload);
    }
  );

  tests.add(
    '`createUploadLink` with option `useGETForQueries`, query, no files.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = '{\n  a\n}\n';
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
                  graphqlResponseOptions
                );
              },
            }),
            {
              query: gql(query),
            }
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
      );

      strictEqual(
        fetchUri,
        `${defaultUri}?query=%7B%0A%20%20a%0A%7D%0A&variables=%7B%7D`
      );
      deepStrictEqual(fetchOptions, {
        method: 'GET',
        headers: { accept: '*/*', 'content-type': 'application/json' },
        credentials: undefined,
      });
      deepStrictEqual(nextData, payload);
    }
  );

  tests.add(
    '`createUploadLink` with option `useGETForQueries`, query, files.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = 'query ($a: Upload!) {\n  a(a: $a)\n}\n';
      const payload = { data: { a: true } };
      const filetype = 'text/plain';
      const revertGlobals = revertableGlobals({ Blob });

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
                    graphqlResponseOptions
                  );
                },
              }),
              {
                query: gql(query),
                variables: {
                  a: new Blob(['a'], { type: filetype }),
                },
              }
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
        );

        strictEqual(fetchUri, defaultUri);
        strictEqual(typeof fetchOptions, 'object');

        const { body, ...fetchOptionsWithoutBody } = fetchOptions;

        deepStrictEqual(fetchOptionsWithoutBody, {
          method: 'POST',
          headers: { accept: '*/*' },
          credentials: undefined,
        });
        strictEqual(body instanceof FormData, true);

        const formDataEntries = Array.from(body.entries());

        strictEqual(formDataEntries.length, 3);
        strictEqual(formDataEntries[0][0], 'operations');
        deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
          query,
          variables: { a: null },
        });
        strictEqual(formDataEntries[1][0], 'map');
        deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
          1: ['variables.a'],
        });
        strictEqual(formDataEntries[2][0], '1');
        strictEqual(formDataEntries[2][1] instanceof Blob, true);
        strictEqual(formDataEntries[2][1].name, 'blob');
        strictEqual(formDataEntries[2][1].type, filetype);
        deepStrictEqual(nextData, payload);
      } finally {
        revertGlobals();
      }
    }
  );

  tests.add(
    '`createUploadLink` with option `useGETForQueries`, query, no files, unserializable variables.',
    async () => {
      let fetched = false;

      const query = 'query($a: Boolean) {\n  a(a: $a)\n}\n';
      const payload = { data: { a: true } };
      const parseError = new Error('Unserializable.');
      const observerError = await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            createUploadLink({
              useGETForQueries: true,
              async fetch() {
                fetched = true;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions
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
            }
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
        })
      );

      strictEqual(fetched, false);
      strictEqual(typeof observerError, 'object');
      strictEqual(observerError.name, 'Invariant Violation');
      strictEqual(observerError.parseError, parseError);
    }
  );

  tests.add(
    '`createUploadLink` with option `useGETForQueries`, mutation, no files.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = 'mutation {\n  a\n}\n';
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
                  graphqlResponseOptions
                );
              },
            }),
            {
              query: gql(query),
            }
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
      );

      strictEqual(fetchUri, defaultUri);
      deepStrictEqual(fetchOptions, {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json' },
        credentials: undefined,
        body: JSON.stringify({ variables: {}, query }),
      });
      deepStrictEqual(nextData, payload);
    }
  );

  tests.add('`createUploadLink` with context `clientAwareness`.', async () => {
    let fetchUri;
    let fetchOptions;
    let nextData;

    const clientAwareness = { name: 'a', version: '1.0.0' };
    const query = '{\n  a\n}\n';
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
                  graphqlResponseOptions
                );
              },
            })
          ),
          {
            query: gql(query),
          }
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
    );

    strictEqual(fetchUri, defaultUri);
    deepStrictEqual(fetchOptions, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
        'apollographql-client-name': clientAwareness.name,
        'apollographql-client-version': clientAwareness.version,
      },
      credentials: undefined,
      body: JSON.stringify({ variables: {}, query }),
    });
    deepStrictEqual(nextData, payload);
  });

  tests.add(
    '`createUploadLink` with context `clientAwareness`, overridden by context `headers`.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const clientAwarenessOriginal = { name: 'a', version: '1.0.0' };
      const clientAwarenessOverride = { name: 'b', version: '2.0.0' };
      const query = '{\n  a\n}\n';
      const payload = { data: { a: true } };

      await timeLimitPromise(
        new Promise((resolve, reject) => {
          execute(
            concat(
              new ApolloLink((operation, forward) => {
                operation.setContext({
                  clientAwareness: clientAwarenessOriginal,
                  headers: {
                    'apollographql-client-name': clientAwarenessOverride.name,
                    'apollographql-client-version':
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
                    graphqlResponseOptions
                  );
                },
              })
            ),
            {
              query: gql(query),
            }
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
      );

      strictEqual(fetchUri, defaultUri);
      deepStrictEqual(fetchOptions, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'content-type': 'application/json',
          'apollographql-client-name': clientAwarenessOverride.name,
          'apollographql-client-version': clientAwarenessOverride.version,
        },
        credentials: undefined,
        body: JSON.stringify({ variables: {}, query }),
      });
      deepStrictEqual(nextData, payload);
    }
  );

  tests.add(
    '`createUploadLink` with options `isExtractableFile` and `formDataAppendFile`.',
    async () => {
      let fetchUri;
      let fetchOptions;
      let nextData;

      const query = 'mutation ($a: Upload!) {\n  a(a: $a)\n}\n';
      const payload = { data: { a: true } };
      const filetype = 'text/plain';

      class TextFile {
        constructor(content) {
          this.blob = new Blob([content], { type: filetype });
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
                  file instanceof TextFile ? file.blob : file
                );
              },
              FormData,
              async fetch(uri, options) {
                fetchUri = uri;
                fetchOptions = options;

                return new Response(
                  JSON.stringify(payload),
                  graphqlResponseOptions
                );
              },
            }),
            {
              query: gql(query),
              variables: {
                a: new TextFile('a'),
              },
            }
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
      );

      strictEqual(fetchUri, defaultUri);
      strictEqual(typeof fetchOptions, 'object');

      const { body, ...fetchOptionsWithoutBody } = fetchOptions;

      deepStrictEqual(fetchOptionsWithoutBody, {
        method: 'POST',
        headers: { accept: '*/*' },
        credentials: undefined,
      });
      strictEqual(body instanceof FormData, true);

      const formDataEntries = Array.from(body.entries());

      strictEqual(formDataEntries.length, 3);
      strictEqual(formDataEntries[0][0], 'operations');
      deepStrictEqual(JSON.parse(formDataEntries[0][1]), {
        query,
        variables: { a: null },
      });
      strictEqual(formDataEntries[1][0], 'map');
      deepStrictEqual(JSON.parse(formDataEntries[1][1]), {
        1: ['variables.a'],
      });
      strictEqual(formDataEntries[2][0], '1');
      strictEqual(formDataEntries[2][1] instanceof Blob, true);
      strictEqual(formDataEntries[2][1].name, 'blob');
      strictEqual(formDataEntries[2][1].type, filetype);
      deepStrictEqual(nextData, payload);
    }
  );

  tests.add('`createUploadLink` with a HTTP error, data.', async () => {
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
            query: gql('{ a b }'),
          }
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
      })
    );

    strictEqual(observerError.name, 'ServerError');
    strictEqual(observerError.statusCode, 400);
    strictEqual(observerError.response, fetchResponse);
    deepStrictEqual(observerError.result, payload);
    deepStrictEqual(nextData, payload);
  });

  tests.add('`createUploadLink` with a HTTP error, no data.', async () => {
    let fetchResponse;

    const payload = { errors: [{ message: 'Unauthorized.' }] };
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
            query: gql('{ a }'),
          }
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
      })
    );

    strictEqual(observerError.name, 'ServerError');
    strictEqual(observerError.statusCode, 401);
    strictEqual(observerError.response, fetchResponse);
    deepStrictEqual(observerError.result, payload);
  });

  tests.add('`createUploadLink` with a fetch error.', async () => {
    const fetchError = new Error('Expected.');
    const observerError = await timeLimitPromise(
      new Promise((resolve, reject) => {
        execute(
          createUploadLink({
            async fetch() {
              throw fetchError;
            },
          }),
          {
            query: gql('{ a }'),
          }
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
      })
    );

    strictEqual(observerError, fetchError);
  });

  tests.add(
    '`createUploadLink` with option `fetchOptions.signal`.',
    async () => {
      let fetchUri;
      let fetchOptions;

      const query = '{\n  a\n}\n';
      const payload = { data: { a: true } };
      const controller = new AbortController();
      const fetchError = new AbortError('The operation was aborted.');
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
                          graphqlResponseOptions
                        )
                      );
                    }, 4000);

                    options.signal.addEventListener('abort', () => {
                      clearTimeout(timeout);
                      reject(fetchError);
                    });
                  });
                },
              }),
              {
                query: gql(query),
              }
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
          })
        );

        controller.abort();

        const observerError = await observerErrorPromise;

        strictEqual(fetchUri, defaultUri);
        deepStrictEqual(fetchOptions, {
          method: 'POST',
          headers: { accept: '*/*', 'content-type': 'application/json' },
          credentials: undefined,
          body: JSON.stringify({ variables: {}, query }),
          signal: controller.signal,
        });
        strictEqual(observerError, fetchError);
      } finally {
        revertGlobals();
      }
    }
  );
};
