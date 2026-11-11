// The pointer this page draws for itself.
//
// smartcursor.js is loaded from a CDN with `defer`, so window.smartCursor only
// exists once parsing has finished. A module script usually runs after the
// deferred one, but not reliably enough to assume — so if it is not there yet,
// wait for load rather than throwing.

import { onMounted } from "vue";

// A control that cannot be pressed is not caught by the ring.
const INTERACTIVE = 'a, button:not(:disabled), select, label, summary, [role="button"]';

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
