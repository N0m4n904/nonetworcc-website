// Everything the page does about a scroll, it does here, in one frame
// callback. Two listeners each scheduling their own frame is two style
// recalculations where one will do.
//
// Where the browser supports scroll-driven animations, most of this steps
// aside: the thread and the glows are declared against the scroll in CSS and
// run without the main thread at all. This file then has only the bar's edge
// left to do, which is not motion and has no timeline to hang from.
//
// The bar's edge is ordinary reactive state — it changes twice in a visit. The
// thread and the glows are not, and are written straight to their elements:
// they change sixty times a second, and a render between the scroll and the
// style would be the most expensive way to move a line.

import { ref, onMounted, onBeforeUnmount } from "vue";

// Chromium has this; Firefox has it behind
// layout.css.scroll-driven-animations.enabled. Everyone else takes the frame
// callback below, and sees exactly the same page.
export const hasScrollTimeline =
  typeof CSS !== "undefined" &&
  CSS.supports &&
  CSS.supports("animation-timeline", "scroll()");

export function useScrollFrame({ thread, aura }) {
  const scrolled = ref(false);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let queued = false;
  let path = null;

  // How far the glows travel over a whole page, handed to CSS as a length so
  // the keyframes can be written against the document's real height. Read at
  // mount and on resize, never per frame.
  function measureDrift() {
    if (!aura.value) return;
    const travel = document.documentElement.scrollHeight - window.innerHeight;
    aura.value.style.setProperty("--drift-span-a", `${travel * -0.05}px`);
    aura.value.style.setProperty("--drift-span-b", `${travel * 0.04}px`);
  }

  function paint() {
    queued = false;
    const y = window.scrollY;

    // Assigning the same value to a ref does not re-render, so this costs a
    // comparison on the frames it does not change — which is all of them but
    // two.
    scrolled.value = y > 8;

    // Where CSS is driving the thread and the glows, writing to them from here
    // would only be two hands on the same wheel.
    if (hasScrollTimeline) return;

    if (!path && !aura.value) return;

    const travel = document.documentElement.scrollHeight - window.innerHeight;
    const progress = travel > 0 ? Math.min(1, y / travel) : 0;
    // The path is one unit long by declaration, so this is simply how much of
    // it is left to draw.
    if (path) path.style.strokeDashoffset = 1 - progress;
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

  function onResize() {
    if (hasScrollTimeline) measureDrift();
    else schedule();
  }

  onMounted(() => {
    if (hasScrollTimeline) {
      // CSS drives the thread and the glows from the scroll itself. All this
      // has to do is tell it how far the glows should travel.
      measureDrift();
    } else if (!reduced && thread.value) {
      // The thread and the glows are motion, and are left alone when the
      // visitor asked for less of it; the bar's edge is not, and is painted
      // either way.
      path = thread.value.querySelector("path");
    }

    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", onResize);
  });

  return { scrolled };
}
