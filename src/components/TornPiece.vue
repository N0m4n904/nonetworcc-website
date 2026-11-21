<script>
import { Corner } from "../lib/torn-pieces.js";

// The strip of tape at each corner, as src/styles/tape.css places it.
const STRIP_CLASSES = Object.freeze({
  [Corner.TopLeft]: "strip--tl",
  [Corner.TopRight]: "strip--tr",
  [Corner.BottomLeft]: "strip--bl",
  [Corner.BottomRight]: "strip--br",
});
</script>

<script setup>
import { EdgeShape } from "../lib/edge.js";

// A piece of paper torn off at the top and the bottom, taped down at two
// opposite corners, with what is in the slot written on it.

defineProps({
  // A piece as returned by `layTornPieces` in `src/lib/torn-pieces.js`.
  piece: { type: Object, required: true },
});
</script>

<template>
  <div class="piece" :style="{ '--piece-tilt': `${piece.tilt}deg` }">
    <svg v-edge="{ shape: EdgeShape.Torn, side: piece.top.side, seed: piece.top.seed }" />
    <slot />
    <svg v-edge="{ shape: EdgeShape.Torn, side: piece.bottom.side, seed: piece.bottom.seed }" />
    <span v-for="corner in piece.corners" :key="corner" class="strip" :class="STRIP_CLASSES[corner]" aria-hidden="true" />
  </div>
</template>

<style>
/* A little lighter than the leaf it lies on, and turned a little. Its shade
   follows its torn edges, and the edges have no shade here. The strips of
   tape are smaller than those of the garage. */
.piece {
  --paper-here: var(--paper-raised);
  --strip-width: 4.2rem;
  --strip-height: 1.35rem;
  --strip-reach-block: -1.15rem;
  --strip-reach-inline: -1.3rem;
  position: relative;
  padding: 1.4rem 1.4rem 1.3rem;
  background-color: var(--paper-here);
  rotate: var(--piece-tilt);
  filter: drop-shadow(var(--shadow-paper));
}

.piece + .piece {
  margin-block-start: clamp(2.6rem, 5vw, 3.4rem);
}

.piece .edge {
  z-index: 0;
  height: 1.6rem;
}

.piece .edge__shade {
  display: none;
}

.piece .strip {
  z-index: 2;
}
</style>
