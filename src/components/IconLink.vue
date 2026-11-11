<script setup>
defineProps({
  href: { type: String, required: true },
  // The name of a symbol of IconSprite.vue without its "icon-", or left out
  // for a link without an icon.
  icon: { type: String, default: undefined },
});
</script>

<template>
  <a class="link" :href="href">
    <svg v-if="icon" class="icon" aria-hidden="true"><use :href="`#icon-${icon}`" /></svg><slot />
  </a>
</template>
