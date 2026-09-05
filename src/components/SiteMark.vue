<script setup>
// The site's mark, from the one file that draws it.
//
// Inlined rather than pointed at with an <img>, because an image cannot inherit
// a colour: the drawing is stroked in currentColor, so wherever it is put it is
// already the right colour in both themes. The raster it replaces had to be
// inverted by a filter to survive a pale ground, which also turned everything
// in it that was not white.
//
// v-html on a build-time constant: the file is read by the bundler, never
// fetched, so there is nothing here for a page to inject into.
import mark from "../mark.svg?raw";
</script>

<template>
  <span class="mark" aria-hidden="true" v-html="mark" />
</template>
