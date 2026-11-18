// The latest release of a project, as the browser of the visitor asks for it.
//
// A release is { tag, address, published }: the name of its version, the page
// that shows it, and the Date of its publication.

// The result of asking a source for the latest release, as { outcome, ... }.
export const ReleaseLookup = Object.freeze({
  // With `release`.
  Found: "found",
  // The project has not published a release.
  NonePublished: "none-published",
  // The source rejected the request, with the HTTP `status` it returned, such
  // as the one for too many requests.
  Refused: "refused",
  // The connection failed before or while the answer arrived.
  Unreachable: "unreachable",
  // The answer was not a release the page can read.
  Unreadable: "unreadable",
});
