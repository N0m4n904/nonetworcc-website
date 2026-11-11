<script setup>
import { computed } from "vue";

import BookEntry from "./BookEntry.vue";
import BookSpread from "./BookSpread.vue";
import { t } from "../lib/language.js";

const props = defineProps({
  // The entries under `projects` in src/content.yaml, in the order they are
  // listed.
  entries: { type: Array, required: true },
});

// The list runs over both leaves, half of it on each and the odd one on the
// left. Every entry keeps the place it has in the whole list.
const leaves = computed(() => {
  const placed = props.entries.map((entry, place) => ({ entry, place }));
  const onLeft = Math.ceil(placed.length / 2);
  return { left: placed.slice(0, onLeft), right: placed.slice(onLeft) };
});
</script>

<template>
  <!-- projects.title is the title of the section on what Noah builds outside
       of work. -->
  <BookSpread class="sheet--under spread--under-title" :title="t.projects.title" :rule-seed="9">
    <BookEntry v-for="{ entry, place } in leaves.left" :key="place" :entry="entry" :place="place" />
    <template #right>
      <BookEntry v-for="{ entry, place } in leaves.right" :key="place" :entry="entry" :place="place" />
    </template>
  </BookSpread>
</template>
