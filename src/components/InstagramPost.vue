<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";

import IconLink from "./IconLink.vue";
import { Icon } from "../lib/content.js";
import { EMBED_VERSION, POST_NARROWEST, POST_SHOWN_CLASS, POST_WIDEST } from "../lib/instagram.js";

// One post of Instagram, in the form Instagram's script looks for (see
// lib/instagram.js). Until that script has put the post there, and whenever
// it does not run, this is a link to the post, as in Instagram's own embed
// markup. The root has the class `post--shown` once the post is there.

defineProps({
  permalink: { type: String, required: true },
  // The words of the link to the post.
  linkText: { type: String, required: true },
});

const narrowest = `${POST_NARROWEST}px`;
const widest = `${POST_WIDEST}px`;

const post = useTemplateRef("post");
const shown = ref(false);

// The script changes the document without a word to the page, so the frame
// it makes is watched for the class it gets.
const observer = new MutationObserver(() => {
  shown.value = post.value.querySelector(`.${POST_SHOWN_CLASS}`) !== null;
});

onMounted(() => observer.observe(post.value, { subtree: true, childList: true, attributeFilter: ["class"] }));
onBeforeUnmount(() => observer.disconnect());
</script>

<template>
  <div ref="post" class="post" :class="{ 'post--shown': shown }">
    <blockquote class="instagram-media" :data-instgrm-permalink="permalink" :data-instgrm-version="EMBED_VERSION">
      <IconLink :href="permalink" :icon="Icon.Instagram">{{ linkText }}</IconLink>
    </blockquote>
  </div>
</template>

<style>
/* As wide as the place it is put in, up to the widest Instagram shows a
   post. The frame inside is measured against it. */
.post {
  container-type: inline-size;
  display: grid;
  place-items: center;
  width: 100%;
  max-width: v-bind(widest);
}

.post blockquote {
  margin: 0;
}

/* The frame Instagram's script makes belongs to the page, and the document in
   it to Instagram. The script writes its style on the element, which only
   !important overrules. */
.post iframe.instagram-media {
  /* As wide as the place of the post. The script gives the frame no width,
     which leaves it the 300 pixels of any iframe, and a least width that a
     narrow place does not have. */
  width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  box-shadow: var(--shadow-low) !important;
  /* In a place narrower than the narrowest Instagram lays a post out, the
     post is laid out at that width and shown smaller. tan(atan2(a, b)) is a
     divided by b: Firefox does not divide one length by another in calc(). */
  zoom: min(1, tan(atan2(100cqi, v-bind(narrowest))));
}
</style>
