// The answers about releases, kept for an hour in the local storage of the
// browser, so that a page view within that hour sends no request for a project
// already asked about.
//
// Only an answer about the project is kept: its release, or that it has none.
// A refusal or a failed connection says nothing about the project, and the
// next page view asks again. Without local storage, every page view asks.

import { ReleaseLookup } from "./release.js";
import { lookUpLatestRelease } from "./release-sources.js";

const STORE = "releasesV1";

// How long an answer is kept, as Noah decided on 2026-11-20.
const KEPT_FOR_MS = 60 * 60 * 1000;

const keyOf = ({ host, repository }) => `${host}/${repository}`;

// The kept answers, by keyOf. Storage the browser blocks, or that holds
// something other than what this module wrote, reads as empty.
function readStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE) ?? "{}");
    return stored !== null && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch (error) {
    if (error instanceof DOMException || error instanceof SyntaxError) return {};
    throw error;
  }
}

// A kept answer that is younger than an hour, or undefined. An answer kept in
// another form than this module writes reads as undefined.
function recall(kept, now) {
  const age = now - kept?.at;
  if (!(age >= 0 && age < KEPT_FOR_MS)) return undefined;
  if (kept.outcome === ReleaseLookup.NonePublished) return { outcome: ReleaseLookup.NonePublished };
  if (kept.outcome !== ReleaseLookup.Found) return undefined;
  const { tag, address, published } = kept.release ?? {};
  const day = new Date(published);
  if (typeof tag !== "string" || typeof address !== "string" || Number.isNaN(day.getTime())) return undefined;
  return { outcome: ReleaseLookup.Found, release: { tag, address, published: day } };
}

// Keeps `lookup` under `key`, and drops every answer older than an hour.
function keep(key, lookup, now) {
  const fresh = Object.entries(readStore()).filter(([, kept]) => recall(kept, now));
  const release = lookup.release && { ...lookup.release, published: lookup.release.published.toISOString() };
  const store = Object.fromEntries([...fresh, [key, { at: now, outcome: lookup.outcome, release }]]);
  try {
    localStorage.setItem(STORE, JSON.stringify(store));
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}

const KEPT_OUTCOMES = new Set([ReleaseLookup.Found, ReleaseLookup.NonePublished]);

// lookUpLatestRelease, answered from local storage where it holds an answer
// younger than an hour.
export async function lookUpRememberedRelease(releases) {
  const key = keyOf(releases);
  const remembered = recall(readStore()[key], Date.now());
  if (remembered) return remembered;
  const lookup = await lookUpLatestRelease(releases);
  if (KEPT_OUTCOMES.has(lookup.outcome)) keep(key, lookup, Date.now());
  return lookup;
}
