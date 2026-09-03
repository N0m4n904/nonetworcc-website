// The pointer this page draws for itself.
//
// smartcursor.js is loaded from a CDN with `defer`, so window.smartCursor only
// exists once parsing has finished. A module script usually runs after the
// deferred one, but not reliably enough to assume — so if it is not there yet,
// wait for load rather than throwing.

import { onMounted } from "vue";

// The tags are list items, which nothing in the built-in list matches. Tiles
// are deliberately absent: they carry a drawn outline already.
const INTERACTIVE =
  'a, button, select, label, summary, [role="button"], .tile, .tags li, .post-stub';

function enable() {
  const cursor = window.smartCursor;
  if (!cursor) return false;
  cursor.setEnabled(true);
  cursor.setInteractive(INTERACTIVE);
  return true;
}

export function useSmartCursor() {
  onMounted(() => {
    if (enable()) return;
    window.addEventListener("load", enable, { once: true });
  });
}
