<script setup>
import { useScribble } from "../composables/useScribble.js";

const {
  drawing, strokes, live, height, empty,
  toggle, undo, clear, down, move, up,
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

  <div class="scribble-controls">
    <button
      type="button"
      class="scribble-pencil"
      :aria-pressed="drawing"
      :title="drawing ? 'Put the pencil down (P)' : 'Draw on the page (P)'"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21l3.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L3 21z" />
        <path d="M14.5 5.5l4 4" />
      </svg>
      <span class="scribble-label">{{ drawing ? "Drawing" : "Draw" }}</span>
    </button>

    <template v-if="drawing">
      <button type="button" class="scribble-minor" :disabled="empty" @click="undo">
        Undo
      </button>
      <button type="button" class="scribble-minor" :disabled="empty" @click="clear">
        Clear
      </button>
    </template>
  </div>
</template>
