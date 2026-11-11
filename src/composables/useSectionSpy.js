// Which section is being read.
//
// This is no motion, so it runs whether or not the visitor asked for less of
// it. The answer is reactive because the markup of the thumb index follows
// from it, and it changes only when a reader moves on to another section.

import { ref, onMounted, onBeforeUnmount } from "vue";

export function useSectionSpy(ids) {
  const current = ref(null);
  let observer = null;

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) current.value = entry.target.id;
        }
      },
      // A band across the middle of the viewport: the section in it is the one
      // being read. A section that has just entered the window is not in it.
      { rootMargin: "-45% 0px -45% 0px" }
    );
    for (const id of ids) {
      const section = document.getElementById(id);
      if (!section) throw new Error(`The book has no part with the id "${id}" for the index to watch.`);
      observer.observe(section);
    }
  });

  onBeforeUnmount(() => observer && observer.disconnect());

  return { current };
}
