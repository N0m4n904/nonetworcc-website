// v-reveal — arrive once, on the way in.
//
// One observer for the whole page rather than one per element: elements come
// and go with their components, the observer does not.
//
// The attribute is set in `created`, which runs before the element is inserted,
// so the opacity:0 rule it selects is in force from the first paint. Setting it
// on mount would show the element for a frame before hiding it.

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let observer = null;

function watcher() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target); // it only has to arrive once
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  return observer;
}

export default {
  created(el) {
    el.setAttribute("data-reveal", "");
  },
  mounted(el) {
    // Asked for less motion, or a browser that cannot tell: hand it the
    // finished state rather than leaving it at opacity zero forever.
    if (reduced || !("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }
    watcher().observe(el);
  },
  unmounted(el) {
    if (observer) observer.unobserve(el);
  },
};
