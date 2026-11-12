// The mark of the site, recorded in test/mark.test.js.snapshot. After a change
// to the mark that is meant, this records it again, and `npm run mark` writes
// it into src/mark.svg:
//
//   node --test --test-update-snapshots "test/*.test.js"

import { test } from "node:test";

import { writeMark } from "../tools/mark.mjs";

test("the mark is drawn as recorded", async (t) => {
  t.assert.snapshot(await writeMark());
});
