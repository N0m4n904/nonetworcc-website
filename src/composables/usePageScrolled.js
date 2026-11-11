// Whether the page has moved from its top.
//
// The answer changes twice in a visit and a scroll event arrives every frame.
// A ref that is assigned the value it has notifies nothing, so a frame on
// which nothing changed costs one comparison.

import { ref, onMounted, onBeforeUnmount } from "vue";

export function usePageScrolled() {
  const scrolled = ref(false);
  const read = () => (scrolled.value = window.scrollY > 0);

  onMounted(() => {
    read();
    window.addEventListener("scroll", read, { passive: true });
  });

  onBeforeUnmount(() => window.removeEventListener("scroll", read));

  return { scrolled };
}
