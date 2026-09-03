<script setup>
// A stand-in until a visitor asks for the posts. It carries the permalink the
// embed needs and nothing that would contact Meta.

defineProps({
  permalink: { type: String, required: true },
  index: { type: Number, default: 0 },
});
</script>

<template>
  <div
    class="post-stub"
    :style="{ '--i': index }"
    :data-permalink="permalink"
    v-reveal
    v-live
    v-outline
  >
    <svg aria-hidden="true"><use href="#icon-instagram" /></svg>
    <strong>Instagram post</strong>
  </div>
</template>
