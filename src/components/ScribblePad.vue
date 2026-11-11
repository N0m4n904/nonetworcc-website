<script setup>
import { useTemplateRef, watch } from "vue";

import pencil from "../drawings/pencil.js";
import { useScribble } from "../composables/useScribble.js";
import { t } from "../lib/language.js";
import { PENCIL_KEY } from "../lib/pencil-key.js";

// The pencil a visitor draws on the page with: the sheet the strokes are drawn
// on, the tab the pencil lies on, and its tools while it is in hand.

const {
  inHand,
  strokes,
  strokeInProgress,
  canUndo,
  canClear,
  pickUpOrPutDown,
  putDown,
  undo,
  clear,
  startStroke,
  extendStroke,
  endStroke,
} = useScribble();

const pick = useTemplateRef("pick");
const tools = useTemplateRef("tools");

// The tools go when the pencil is put down, whether with "done", the key or
// Escape. A focus that was on one of them moves to the tab.
watch(inHand, (held) => {
  if (!held && tools.value.contains(document.activeElement)) pick.value.focus();
});
</script>

<template>
  <!-- The sheet. It spans the whole document, so a drawing scrolls with what
       it was drawn next to. It is inert until the pencil is picked up. -->
  <svg
    class="scribble"
    :class="{ 'scribble--live': inHand }"
    aria-hidden="true"
    @pointerdown="startStroke"
    @pointermove="extendStroke"
    @pointerup="endStroke"
    @pointercancel="endStroke"
  >
    <path v-for="(d, i) in strokes" :key="i" :d="d" />
    <path v-if="strokeInProgress" :d="strokeInProgress" />
  </svg>

  <!-- pencil.pick is the name of the group and of the tab for a screen
       reader, and the tooltip of the tab with the key after it. -->
  <div class="pencil" role="group" :aria-label="t.pencil.pick">
    <button
      ref="pick"
      class="tab pencil__pick"
      type="button"
      :aria-pressed="inHand"
      :aria-label="t.pencil.pick"
      :aria-keyshortcuts="PENCIL_KEY"
      :title="`${t.pencil.pick} (${PENCIL_KEY})`"
      @click="pickUpOrPutDown"
    >
      <svg v-drawing="{ drawing: pencil, seed: 14 }" v-live />
      <kbd class="pencil__key" aria-hidden="true">{{ PENCIL_KEY }}</kbd>
    </button>
    <!-- pencil.undo takes the last step back, a stroke or a clearing of the
         page. pencil.clear takes every stroke off the page, and pencil.done
         puts the pencil down. -->
    <div v-if="inHand" ref="tools" class="pencil__tools">
      <button class="tape tape--paper" type="button" :disabled="!canUndo" @click="undo">{{ t.pencil.undo }}</button>
      <button class="tape tape--paper" type="button" :disabled="!canClear" @click="clear">{{ t.pencil.clear }}</button>
      <button class="tape" type="button" @click="putDown">{{ t.pencil.done }}</button>
    </div>
  </div>
</template>

<style>
/* ---------------------------------------------------------------------------
   The pencil

   The page is a sketchbook, and a visitor can draw in it. The sheet lies
   over the whole document and is inert until the pencil is picked up. Both are
   built only where there is a mouse or a stylus to draw with.
   --------------------------------------------------------------------------- */

/* The sheet spans the whole document, so a drawing scrolls with what it was
   drawn next to. Its size is that of the root element, which is as tall as
   the page. */
html {
  position: relative;
}

.scribble {
  position: absolute;
  inset: 0;
  z-index: var(--layer-pencil);
  width: 100%;
  height: 100%;
  max-width: none;
  overflow: visible;
  pointer-events: none;
}

.scribble--live {
  pointer-events: auto;
  touch-action: none;
  cursor: crosshair;
}

.scribble path {
  fill: none;
  stroke: var(--accent-ink);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pencil {
  position: fixed;
  inset-block-end: 1rem;
  inset-inline-start: 0;
  z-index: var(--layer-controls);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* On the folded book the pencil is pushed through the wire. On the open book
   it lies in the margin of the left leaf. */
.pencil__pick {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 3.75rem;
  padding: 0;
  border-radius: 0 20px 15px 0;
}

.pencil__pick .drawing {
  width: 3.5rem;
  rotate: -38deg;
  transition: rotate 0.35s var(--ease), translate 0.35s var(--ease);
}

/* It shifts in the hand that reaches for it. */
.pencil__pick:hover .drawing,
.pencil__pick:focus-visible .drawing {
  rotate: -50deg;
  translate: 0 -2px;
}

/* In hand, the pencil is drawn in the colour it draws in. */
.pencil__pick[aria-pressed='true'] .drawing {
  --pencil-plain: var(--accent-ink);
  rotate: -62deg;
  translate: 2px -3px;
}

.pencil__key {
  position: absolute;
  inset-block-end: -0.3rem;
  inset-inline-end: -0.45rem;
  display: grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border: 1.5px solid var(--pencil-soft);
  border-radius: 5px 6px 5px 7px;
  background-color: var(--paper);
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
}

.pencil__tools {
  display: flex;
  gap: 0.9rem;
}

.pencil__tools .tape {
  min-height: 2.5rem;
  padding-inline: 0.85rem;
  font-size: var(--step-small);
}

.pencil__tools .tape:nth-child(3) {
  --tape-tilt: -0.6deg;
}

.pencil__tools .tape[disabled] {
  color: var(--ink-note);
  box-shadow: none;
  cursor: default;
}

@media (min-width: 78rem) {
  .pencil {
    inset-inline-start: 1rem;
  }

  .pencil__pick {
    width: 3.75rem;
    border-radius: 16px 20px 15px 21px;
  }
}
</style>
