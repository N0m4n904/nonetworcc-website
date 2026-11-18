// The latest release of a repository on GitHub.
//
// As https://docs.github.com/en/rest/releases/releases#get-the-latest-release
// describes it, checked on 2026-11-18: the latest release is the most recent
// one that is neither a draft nor a prerelease, and GitHub returns 404 for a
// repository without one. Without a token GitHub allows 60 requests an hour
// from one address and rejects more with 403 or 429, as
// https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
// describes on the same day.

import { ReleaseLookup } from "./release.js";

const API = "https://api.github.com";
const RELEASE_PAGE = "https://github.com/";
const NOT_FOUND = 404;

// A part of the name of a repository: letters, digits, "-", "_" and ".".
const NAME_PART = /^[\w.-]+$/;

const UNREACHABLE = Object.freeze({ outcome: ReleaseLookup.Unreachable });
const UNREADABLE = Object.freeze({ outcome: ReleaseLookup.Unreadable });

// "owner/name" of the repository that `address`, a page on github.com, shows,
// or undefined for a page that is not a repository, such as an organisation.
export function readGithubRepository(address) {
  const parts = address.pathname.split("/").filter(Boolean);
  return parts.length === 2 && parts.every((part) => NAME_PART.test(part)) ? parts.join("/") : undefined;
}

// The release in an answer from GitHub, or Unreadable where a field it needs is
// missing or not what GitHub writes there.
export function readGithubRelease(answer) {
  const { tag_name: tag, html_url: address, published_at: published } = answer ?? {};
  if (typeof tag !== "string" || typeof address !== "string" || typeof published !== "string") return UNREADABLE;
  const day = new Date(published);
  if (!address.startsWith(RELEASE_PAGE) || Number.isNaN(day.getTime())) return UNREADABLE;
  return { outcome: ReleaseLookup.Found, release: { tag, address, published: day } };
}

// `repository` is "owner/name", as readGithubRepository returns it.
export async function lookUpGithubRelease(repository) {
  const address = new URL(`/repos/${repository}/releases/latest`, API);
  try {
    // A header that sets the version of the API would make the browser send a
    // second request ahead of this one. The version used without it has every
    // field read here.
    const response = await fetch(address, {
      headers: { Accept: "application/vnd.github+json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (response.status === NOT_FOUND) return { outcome: ReleaseLookup.NonePublished };
    if (!response.ok) return { outcome: ReleaseLookup.Refused, status: response.status };
    return readGithubRelease(await response.json());
  } catch (error) {
    // fetch and the reading of the body reject with a TypeError when the
    // connection fails, and json() with a SyntaxError for a body that is not
    // JSON.
    if (error instanceof TypeError) return UNREACHABLE;
    if (error instanceof SyntaxError) return UNREADABLE;
    throw error;
  }
}
