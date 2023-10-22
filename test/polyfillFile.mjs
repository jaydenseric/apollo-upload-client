import { File as NodeFile } from "buffer";

// TODO: Delete this polyfill once all supported Node.js versions have the
// global `File`:
// https://nodejs.org/api/globals.html#class-file
globalThis.File ??= NodeFile;
