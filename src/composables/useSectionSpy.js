// Which section is being read.
//
// Not motion, so it runs whether or not the visitor asked for less of it. The
// answer is reactive because one small string drives the bar's markup — this is
// the one thing on the page that is genuinely state, and it changes at reading
// speed rather than at frame rate.

import { ref, onMounted, onBeforeUnmount } from "vue";

export function useSectionSpy(ids) {
  const current = ref(null);
  let observer = null;

  onMounted(() => {
    if (!("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) current.value = entry.target.id;
        }
      },
      // A band across the middle of the viewport: whatever is being looked at,
      // rather than whatever has just entered it.
      { rootMargin: "-45% 0px -45% 0px" }
    );
    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
  });

  onBeforeUnmount(() => observer && observer.disconnect());

  return { current };
}
