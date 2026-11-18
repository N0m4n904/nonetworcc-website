// The places where a project publishes its releases, by the host of the link
// that leads there. Each reads the repository from the address of that link,
// and asks for its latest release.

import { lookUpGithubRelease, readGithubRepository } from "./github-release.js";

const SOURCES = new Map([["github.com", { readRepository: readGithubRepository, lookUp: lookUpGithubRelease }]]);

// Where the project with these links publishes its releases, as { host,
// repository }: the first link, in their order, that leads to a repository at a
// source. Undefined for a project without such a link.
export function findReleases(links) {
  for (const { href } of links) {
    const address = URL.parse(href);
    const repository = address && SOURCES.get(address.hostname)?.readRepository(address);
    if (repository) return { host: address.hostname, repository };
  }
  return undefined;
}

// Resolves to a ReleaseLookup for `releases` as findReleases returns them.
export const lookUpLatestRelease = ({ host, repository }) => SOURCES.get(host).lookUp(repository);
