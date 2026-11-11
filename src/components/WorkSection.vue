<script setup>
import BookEntry from "./BookEntry.vue";
import BookSpread from "./BookSpread.vue";
import DogEar from "./DogEar.vue";
import kiosk from "../drawings/kiosk.js";
import { t } from "../lib/language.js";

defineProps({
  // The entries under `work` in src/content.yaml, in the order they are listed.
  entries: { type: Array, required: true },
});
</script>

<template>
  <!-- work.title is the title of the section on the employer and what is
       built there. -->
  <BookSpread class="sheet--raised" :title="t.work.title" :rule-seed="7">
    <BookEntry v-for="(entry, place) in entries" :key="place" :entry="entry" :place="place" lead />
    <template #right>
      <div class="scene"><svg v-drawing="{ drawing: kiosk, seed: 8 }" v-live /></div>
    </template>
    <template #corner><DogEar /></template>
  </BookSpread>
</template>

<style>
/* What is built at work, drawn on the other leaf. */
.scene {
  width: 100%;
  max-width: 30rem;
  margin-inline: auto;
}

@media (min-width: 78rem) {
  .leaf:has(> .scene) {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .scene {
    max-width: 36rem;
    margin-inline: clamp(0rem, 2vw, 2.5rem) 0;
    rotate: 2deg;
  }
}
</style>
