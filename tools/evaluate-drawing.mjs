// Evaluates one module of src/drawings and posts the drawing it exports.
//
// The `drawings` plugin of vite.config.js runs this as a worker and gives it
// the address of the module. A worker has a module graph of its own, so each
// evaluation reads the drawing and the words as they are on disk.

import { parentPort, workerData } from "node:worker_threads";

const { default: drawing } = await import(workerData);
parentPort.postMessage(drawing);
