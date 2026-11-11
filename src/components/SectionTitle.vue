<script setup>
import rule from "../drawings/rule.js";

defineProps({
  title: { type: String, required: true },
  // The seed of the stroke under the title (see v-drawing).
  ruleSeed: { type: Number, required: true },
});
</script>

<template>
  <h2 class="title">{{ title }}<svg v-drawing="{ drawing: rule, seed: ruleSeed }" v-live /></h2>
</template>

<style>
.title {
  position: relative;
  width: fit-content;
  max-width: 100%;
  margin-block-end: clamp(2.25rem, 4.5vw, 3.25rem);
  font-size: var(--step-title);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.01em;
  rotate: -1.5deg;
}

.title .drawing--rule {
  width: max(70%, 6.5rem);
  margin-block-start: 0.3rem;
}
</style>
