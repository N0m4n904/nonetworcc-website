// v-live — hold still when nobody can see it.
//
// Everything decorative on this page moves continuously, and a browser will
// keep painting all of it while it sits three screens away. This marks an
// element as carrying a running animation; the stylesheet pauses anything
// marked "false", descendants included.
//
// The attribute ships empty and only this writes "false", so a browser without
// IntersectionObserver leaves the page animating rather than frozen.

let observer = null;

function watcher() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.dataset.live = entry.isIntersecting ? "true" : "false";
      }
      // A little before the edge rather than at it. Resuming needs no run-up —
      // a paused animation carries on from the angle it stopped at — but the
      // callback is asynchronous, and this is the margin that keeps a ring from
      // being seen frozen for the frame it takes.
    },
    { rootMargin: "20% 0px" }
  );
  return observer;
}

export default {
  created(el) {
    el.setAttribute("data-live", "");
  },
  mounted(el) {
    if (!("IntersectionObserver" in window)) return;
    watcher().observe(el);
  },
  unmounted(el) {
    if (observer) observer.unobserve(el);
  },
};
