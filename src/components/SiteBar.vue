<script setup>
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
</script>

<template>
  <header class="bar" :data-scrolled="scrolled ? 'true' : 'false'">
    <div class="shell bar__inner">
      <a class="bar__mark" href="#top">Noah&nbsp;Anleitner</a>
      <nav class="bar__nav" aria-label="Sections">
        <a
          v-for="link in links"
          :key="link.id"
          class="bar__link"
          :href="`#${link.id}`"
          :aria-current="current === link.id ? 'true' : null"
        >{{ link.text }}</a>
      </nav>
      <a class="button" href="mailto:contact@nonetwor.cc?subject=Contact">Get in touch</a>
    </div>
  </header>
</template>
