<script setup>
import SectionTitle from "./SectionTitle.vue";

// A section that lies open over both leaves: its title and what stands under
// it on the left leaf, and the right leaf. On a folded book the right leaf
// follows the left one.

defineProps({
  title: { type: String, required: true },
  // The seed of the stroke under the title (see v-drawing).
  ruleSeed: { type: Number, required: true },
});
</script>

<template>
  <section class="sheet spread">
    <div class="leaf leaf--left">
      <SectionTitle :title="title" :rule-seed="ruleSeed" />
      <!-- One element under the title. With the class `spread--under-title`
           the title has a row of the spread to itself, and this element is
           in the row on which the right leaf begins. -->
      <div class="leaf__body"><slot /></div>
    </div>
    <div class="leaf"><slot name="right" /></div>
    <!-- What lies on the sheet outside its leaves, such as a folded corner. -->
    <slot name="corner" />
  </section>
</template>
