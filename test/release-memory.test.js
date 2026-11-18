// Answers about releases kept for an hour in local storage.
//
// Every test stands in for GitHub and for the local storage of a browser, and
// moves the clock itself. A request not answered by the test fails it.

import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";

import { ReleaseLookup } from "../src/lib/release.js";
import { lookUpRememberedRelease } from "../src/lib/release-memory.js";

const HOUR_MS = 60 * 60 * 1000;
const RELEASES = { host: "github.com", repository: "someone/tool" };
const ANSWER = {
  tag_name: "v2.0.0",
  html_url: "https://github.com/someone/tool/releases/tag/v2.0.0",
  published_at: "2026-03-04T05:06:07Z",
};

// The local storage of a browser: text under keys.
class FakeStorage {
  #items = new Map();
  getItem = (key) => this.#items.get(key) ?? null;
  setItem = (key, value) => void this.#items.set(key, String(value));
}

// Local storage of a browser that blocks it for this page.
const blockedStorage = {
  getItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
};

let requests;
const answerWith = (status, body) => async () => {
  requests += 1;
  return new Response(body, { status });
};

const realFetch = globalThis.fetch;
beforeEach(() => {
  requests = 0;
  globalThis.fetch = async (address) => {
    throw new Error(`a test sent a request it does not answer: ${address}`);
  };
  globalThis.localStorage = new FakeStorage();
  mock.timers.enable({ apis: ["Date"], now: Date.UTC(2026, 10, 20, 12) });
});
afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.localStorage;
  mock.timers.reset();
});

test("a release is shown from local storage within the hour, without a request", async () => {
  globalThis.fetch = answerWith(200, JSON.stringify(ANSWER));
  const first = await lookUpRememberedRelease(RELEASES);
  mock.timers.tick(HOUR_MS - 1);
  const second = await lookUpRememberedRelease(RELEASES);
  assert.equal(requests, 1);
  assert.deepEqual(second, first);
});

test("after an hour the source is asked again", async () => {
  globalThis.fetch = answerWith(200, JSON.stringify(ANSWER));
  await lookUpRememberedRelease(RELEASES);
  mock.timers.tick(HOUR_MS);
  await lookUpRememberedRelease(RELEASES);
  assert.equal(requests, 2);
});

test("that a project has no release is kept too", async () => {
  globalThis.fetch = answerWith(404, "{}");
  await lookUpRememberedRelease(RELEASES);
  const second = await lookUpRememberedRelease(RELEASES);
  assert.equal(requests, 1);
  assert.equal(second.outcome, ReleaseLookup.NonePublished);
});

test("a refusal is not kept, and the next page view asks again", async () => {
  globalThis.fetch = answerWith(403, "{}");
  await lookUpRememberedRelease(RELEASES);
  await lookUpRememberedRelease(RELEASES);
  assert.equal(requests, 2);
});

test("each repository is kept on its own", async () => {
  globalThis.fetch = answerWith(200, JSON.stringify(ANSWER));
  await lookUpRememberedRelease(RELEASES);
  await lookUpRememberedRelease({ host: "github.com", repository: "someone/other" });
  assert.equal(requests, 2);
});

test("storage holding something this page did not write is asked past", async () => {
  globalThis.localStorage.setItem("releasesV1", "[not json");
  globalThis.fetch = answerWith(200, JSON.stringify(ANSWER));
  const lookup = await lookUpRememberedRelease(RELEASES);
  assert.equal(lookup.outcome, ReleaseLookup.Found);
  assert.equal(requests, 1);
});

test("with local storage blocked, every page view asks and still gets the release", async () => {
  globalThis.localStorage = blockedStorage;
  globalThis.fetch = answerWith(200, JSON.stringify(ANSWER));
  const first = await lookUpRememberedRelease(RELEASES);
  await lookUpRememberedRelease(RELEASES);
  assert.equal(first.outcome, ReleaseLookup.Found);
  assert.equal(requests, 2);
});
