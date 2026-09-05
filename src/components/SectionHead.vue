<script setup>
import { ref, onMounted } from "vue";

defineProps({
  title: { type: String, required: true },
});

const rule = ref(null);

onMounted(() => {
  // A drawn line needs its own length: a guessed dash either clips the stroke
  // or leaves a gap at the end. Left alone when the visitor asked for less
  // motion, so the rule is simply there rather than drawing itself.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const path = rule.value?.querySelector("path");
  if (!path) return;
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
});
</script>

<template>
  <div class="section__head" v-reveal>
    <h2 class="title">{{ title }}</h2>
    <svg ref="rule" class="section__rule" viewBox="0 0 200 14" aria-hidden="true">
      <path d="M2 9c28-6 52 2 78-1s52-7 118-2" />
    </svg>
  </div>
</template>
