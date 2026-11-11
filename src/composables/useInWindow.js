// Whether an element is in the window.
//
// `report` is called once the element is mounted and again whenever the
// answer changes.

import { onMounted, onBeforeUnmount } from "vue";

export function useInWindow(element, report) {
  // Several changes can arrive at once, oldest first. The latest is the answer.
  const observer = new IntersectionObserver((entries) => report(entries.at(-1).isIntersecting));

  onMounted(() => observer.observe(element.value));
  onBeforeUnmount(() => observer.disconnect());
}
