<script setup>
import { useScribble } from "../composables/useScribble.js";

const {
  drawing, strokes, live, height, empty,
  put, undo, clear, down, move, up,
} = useScribble();
</script>

<template>
  <!-- The sheet. Spans the whole document rather than the viewport, so a
       drawing stays beside whatever it was drawn next to. Inert until the
       pencil is picked up. -->
  <svg
    class="scribble"
    :class="{ 'scribble--live': drawing }"
    :style="{ height: `${height}px` }"
    aria-hidden="true"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
  >
    <path v-for="(d, i) in strokes" :key="i" :d="d" />
    <path v-if="live" :d="live" />
  </svg>

  <!-- Nothing at all until the pencil is in hand: the way in is the P key,
       and the console says so. Once someone has found it they need a way to
       take a stroke back and a way out, and guessing at more keys is not it. -->
  <div v-if="drawing" class="scribble-controls" role="group" aria-label="Drawing">
    <span class="scribble-mode">Drawing</span>
    <button type="button" class="scribble-key" :disabled="empty" @click="undo">Undo</button>
    <button type="button" class="scribble-key" :disabled="empty" @click="clear">Clear</button>
    <button type="button" class="scribble-key" @click="put(false)">Done</button>
  </div>
</template>
