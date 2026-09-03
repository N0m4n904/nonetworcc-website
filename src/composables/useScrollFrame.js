// Everything the page does about a scroll, it does here, in one frame
// callback. Two listeners each scheduling their own frame is two style
// recalculations where one will do.
//
// The thread and the glows are written straight to their elements, on purpose
// and outside Vue's reactivity: they change sixty times a second, and putting
// a render between the scroll and the style would be the most expensive way to
// move a line. The bar's edge is different — it changes once, when the page
// first moves — so it is returned as ordinary state and bound in the template.

import { ref, onMounted, onBeforeUnmount } from "vue";

export function useScrollFrame({ thread, aura }) {
  const scrolled = ref(false);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let queued = false;
  let length = 0;
  let path = null;

  function paint() {
    queued = false;
    const y = window.scrollY;

    // Assigning the same value to a ref does not re-render, so this costs a
    // comparison on the frames it does not change — which is all of them but
    // two.
    scrolled.value = y > 8;

    if (!path && !aura.value) return;

    const travel = document.documentElement.scrollHeight - window.innerHeight;
    const progress = travel > 0 ? Math.min(1, y / travel) : 0;
    if (path) path.style.strokeDashoffset = length * (1 - progress);
    if (aura.value) {
      aura.value.style.setProperty("--drift-a", `${y * -0.05}px`);
      aura.value.style.setProperty("--drift-b", `${y * 0.04}px`);
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  }

  onMounted(() => {
    // The thread and the glows are motion, and are left alone when the visitor
    // asked for less of it; the bar's edge is not, and is painted either way.
    if (!reduced && thread.value) {
      path = thread.value.querySelector("path");
      if (path) {
        // A drawn line needs its own length: a guessed dash either clips the
        // stroke or leaves a gap at the end.
        length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
      }
    }
    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  });

  return { scrolled };
}
