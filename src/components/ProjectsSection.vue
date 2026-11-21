<script setup>
import { computed } from "vue";

import BookEntry from "./BookEntry.vue";
import BookSpread from "./BookSpread.vue";
import TornPiece from "./TornPiece.vue";
import { t } from "../lib/language.js";
import { countOnLeft, layTornPieces } from "../lib/torn-pieces.js";

const props = defineProps({
  // The entries under `projects` in src/content.yaml, in the order they are
  // listed.
  entries: { type: Array, required: true },
});

// The list runs over both leaves, half of it on each and the odd one on the
// left. Every entry keeps the place it has in the whole list, and is written
// on the piece of paper torn for that place.
const leaves = computed(() => {
  const onLeft = countOnLeft(props.entries.length);
  const pieces = layTornPieces(props.entries.length);
  const placed = props.entries.map((entry, place) => ({ entry, place, piece: pieces[place] }));
  return { left: placed.slice(0, onLeft), right: placed.slice(onLeft) };
});
</script>

<template>
  <!-- projects.title is the title of the section on what Noah builds outside
       of work. -->
  <BookSpread class="projects sheet--under spread--under-title" :title="t.projects.title" :rule-seed="9">
    <TornPiece v-for="{ entry, place, piece } in leaves.left" :key="place" :piece="piece">
      <BookEntry :entry="entry" :place="place" />
    </TornPiece>
    <template #right>
      <TornPiece v-for="{ entry, place, piece } in leaves.right" :key="place" :piece="piece">
        <BookEntry :entry="entry" :place="place" />
      </TornPiece>
    </template>
  </BookSpread>
</template>

<style>
/* The tape on the pieces overflows the leaf, and on a phone it overflows the
   screen. */
.projects {
  overflow-x: clip;
}
</style>
