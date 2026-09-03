<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useSectionSpy } from "../composables/useSectionSpy.js";

defineProps({
  // True once the page has moved beneath the bar, which is when it earns its
  // edge. Set from the one scroll frame callback in App.vue.
  scrolled: { type: Boolean, default: false },
});

const links = [
  { id: "work", text: "Work" },
  { id: "projects", text: "Projects" },
  { id: "garage", text: "Garage" },
  { id: "about", text: "About" },
];

// Which section is being read: the one genuinely reactive thing on the page.
// It changes at reading speed rather than frame rate, so a render between the
// observer and the underline costs nothing worth measuring.
const { current } = useSectionSpy(links.map((link) => link.id));

const nav = ref(null);
// Where the line is and how wide, in pixels within the nav. One line that
// travels rather than four that fade in and out.
const line = ref({ x: 0, w: 0, shown: false });

function place() {
  const index = links.findIndex((link) => link.id === current.value);
  const el = index >= 0 && nav.value ? nav.value.querySelectorAll(".bar__link")[index] : null;
  // Above the first section there is nothing to underline, so the line waits
  // where it is and fades out rather than sliding to the corner.
  if (!el) {
    line.value = { ...line.value, shown: false };
    return;
  }
  line.value = { x: el.offsetLeft, w: el.offsetWidth, shown: true };
}

watch(current, place);

onMounted(() => {
  place();
  // The links are set in a handwriting that arrives after the first paint, and
  // they are not the same width in the fallback face.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  window.addEventListener("resize", place, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener("resize", place));
</script>

<template>
  <header class="bar" :data-scrolled="scrolled ? 'true' : 'false'">
    <div class="shell bar__inner">
      <a class="bar__mark" href="#top">Noah&nbsp;Anleitner</a>
      <nav class="bar__nav" ref="nav" aria-label="Sections">
        <a
          v-for="link in links"
          :key="link.id"
          class="bar__link"
          :href="`#${link.id}`"
          :aria-current="current === link.id ? 'true' : null"
        >{{ link.text }}</a>
        <span
          class="bar__line"
          aria-hidden="true"
          :style="{
            '--line-x': `${line.x}px`,
            '--line-w': `${line.w}px`,
            opacity: line.shown ? 1 : 0,
          }"
        ></span>
      </nav>
      <a class="button" href="mailto:contact@nonetwor.cc?subject=Contact">Get in touch</a>
    </div>
  </header>
</template>
