// src/lib/extract/extractTextFromFile.js
// Public entry — re-exports the browser implementation.
//
// Runtime routing:
//   Browser / Vite app   → this file → extractTextFromFile.browser.js  (FileReader, pdfjs worker)
//   Node.js tests/scripts → import extractTextFromFile.node.js directly
//
// Why separate files instead of a single entry:
//   extractTextFromFile.browser.js contains a Vite-only ?url import:
//     import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
//   Node.js ESM cannot resolve ?url query strings, so the module fails to load entirely.
//   Splitting into .browser.js / .node.js keeps each runtime clean.

export { extractTextFromFile } from "./extractTextFromFile.browser.js";
