// The latest release of a project: which link leads to it, how an answer from
// GitHub is read, which outcome each kind of answer gives, and how the words
// of the stamp are filled in.
//
// Every test stands in for GitHub. A request not answered by the test fails
// it.

import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { readContent } from "../src/lib/content.js";
import { lookUpGithubRelease, readGithubRelease } from "../src/lib/github-release.js";
import { fillPlaces } from "../src/lib/text-places.js";
import { ReleaseLookup } from "../src/lib/release.js";
import { findReleases, lookUpLatestRelease } from "../src/lib/release-sources.js";

const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = async (address) => {
    throw new Error(`a test sent a request it does not answer: ${address}`);
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const link = (href) => ({ text: "Link", href });

const LINKS = {
  "a repository on GitHub": [[link("https://github.com/someone/tool")], { host: "github.com", repository: "someone/tool" }],
  "a repository with a slash at its end": [[link("https://github.com/someone/tool/")], { host: "github.com", repository: "someone/tool" }],
  "the first of two repositories, such as a fork before its upstream": [
    [link("https://example.org"), link("https://github.com/someone/fork"), link("https://github.com/others/tool")],
    { host: "github.com", repository: "someone/fork" },
  ],
  "an organisation on GitHub": [[link("https://github.com/someone")], undefined],
  "a page inside a repository": [[link("https://github.com/someone/tool/issues")], undefined],
  "a host that is not a source": [[link("https://git.example.org/someone/tool")], undefined],
  "an address that is not a URL": [[link("/images/tool.svg")], undefined],
};

for (const [name, [links, releases]] of Object.entries(LINKS)) {
  test(`a project linking to ${name} gets releases ${JSON.stringify(releases)}`, () => {
    assert.deepEqual(findReleases(links), releases);
  });
}

const entry = (links) => ({ title: "Tool", body: "A tool.", links });

test("a project gets the releases of its repository, and work never does", () => {
  const links = [link("https://github.com/someone/tool")];
  const content = readContent({ work: [entry(links)], projects: [entry(links), entry([])], tools: [] });
  assert.deepEqual(content.projects[0].releases, { host: "github.com", repository: "someone/tool" });
  assert.equal("releases" in content.projects[1], false);
  assert.equal("releases" in content.work[0], false);
});

const ANSWER = {
  tag_name: "v2.0.0",
  html_url: "https://github.com/someone/tool/releases/tag/v2.0.0",
  published_at: "2026-03-04T05:06:07Z",
  draft: false,
};

test("an answer from GitHub is read into its tag, its page and its day", () => {
  assert.deepEqual(readGithubRelease(ANSWER), {
    outcome: ReleaseLookup.Found,
    release: { tag: "v2.0.0", address: ANSWER.html_url, published: new Date(Date.UTC(2026, 2, 4, 5, 6, 7)) },
  });
});

const UNREADABLE = {
  "an answer without a tag": { ...ANSWER, tag_name: undefined },
  "an answer with a page outside github.com": { ...ANSWER, html_url: "https://example.org/release" },
  "an answer with a day that is not a date": { ...ANSWER, published_at: "soon" },
  "an answer that is not an object": null,
};

for (const [name, answer] of Object.entries(UNREADABLE)) {
  test(`${name} is unreadable`, () => assert.equal(readGithubRelease(answer).outcome, ReleaseLookup.Unreadable));
}

const answerWith = (status, body) => async () => new Response(body, { status });

// A body whose connection fails after the headers have arrived.
const brokenBody = async () =>
  new Response(new ReadableStream({ pull: (controller) => controller.error(new TypeError("network error")) }));

const LOOKUPS = {
  "a release": [answerWith(200, JSON.stringify(ANSWER)), { outcome: ReleaseLookup.Found }],
  "404, for a repository without a release": [answerWith(404, "{}"), { outcome: ReleaseLookup.NonePublished }],
  "403, once the requests of an hour are used up": [answerWith(403, "{}"), { outcome: ReleaseLookup.Refused, status: 403 }],
  "429, for too many requests": [answerWith(429, "{}"), { outcome: ReleaseLookup.Refused, status: 429 }],
  "a body that is not JSON": [answerWith(200, "<html>"), { outcome: ReleaseLookup.Unreadable }],
  "a body whose connection fails": [brokenBody, { outcome: ReleaseLookup.Unreachable }],
  "a connection that fails": [async () => Promise.reject(new TypeError("Failed to fetch")), { outcome: ReleaseLookup.Unreachable }],
};

for (const [name, [answer, expected]] of Object.entries(LOOKUPS)) {
  test(`GitHub returning ${name} gives ${expected.outcome}`, async () => {
    globalThis.fetch = answer;
    const { release, ...lookup } = await lookUpGithubRelease("someone/tool");
    assert.deepEqual(lookup, expected);
  });
}

test("the releases of a project are asked for at their host", async () => {
  const requests = [];
  globalThis.fetch = async (address, options) => {
    requests.push(new Request(address, options));
    return new Response(JSON.stringify(ANSWER));
  };
  const lookup = await lookUpLatestRelease({ host: "github.com", repository: "someone/tool" });
  assert.equal(lookup.outcome, ReleaseLookup.Found);
  assert.equal(requests.length, 1);
  assert.equal(new URL(requests[0].url).hostname, "api.github.com");
  assert.match(new URL(requests[0].url).pathname, /^\/repos\/someone\/tool\//);
});

test("the request carries neither cookies nor the address of the page", async () => {
  const requests = [];
  globalThis.fetch = async (address, options) => {
    requests.push(new Request(address, options));
    return new Response(JSON.stringify(ANSWER));
  };
  await lookUpGithubRelease("someone/tool");
  assert.equal(requests[0].credentials, "omit");
  assert.equal(requests[0].referrerPolicy, "no-referrer");
});

test("a place in a string is filled with its value as it is written, $ included", () => {
  assert.equal(fillPlaces("Release {tag}", { tag: "v1$&" }), "Release v1$&");
});

test("a place in a string without a value throws", () => {
  assert.throws(() => fillPlaces("Release {tag}", {}), /\{tag\}/);
});
