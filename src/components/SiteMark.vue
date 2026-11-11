<script setup>
// The site's mark, from the one file that draws it.
//
// Inlined, because an <img> cannot inherit a colour: the drawing is stroked in
// currentColor, so it has the colour of the text around it in both themes.
//
// v-html on a build-time constant: the file is read by the bundler and never
// fetched, so a page cannot inject anything here.
import mark from "../mark.svg?raw";
</script>

<template>
  <span class="mark" aria-hidden="true" v-html="mark" />
</template>

<style>
/* The mark fills the box it is put in. Whoever places it sets the size of
   the box. */
.mark {
  display: block;
}

.mark svg {
  width: 100%;
  height: 100%;
}
</style>
