<!-- The corner of a lighter leaf, folded over, so that the paper beneath shows.
     It takes the lower outer corner of the sheet it is put in. -->
<template>
  <svg class="dogear" viewBox="0 0 64 64" aria-hidden="true">
    <path class="dogear__gone" d="M64 0L64 64L0 64Z" />
    <path class="dogear__flap" d="M64 0L0 64L10 13Z" />
  </svg>
</template>

<style>
.dogear {
  position: absolute;
  inset-inline-end: 0;
  inset-block-end: 0;
  z-index: var(--layer-edge);
  width: clamp(2.75rem, 5vw, 4.5rem);
  height: auto;
  pointer-events: none;
}

/* On the spread it is the outer corner of the left leaf that is folded. */
@media (min-width: 78rem) {
  .dogear {
    inset-inline: 0 auto;
    scale: -1 1;
  }
}

.dogear__gone {
  fill: var(--paper);
}

.dogear__flap {
  fill: var(--paper-fibre);
  stroke: var(--pencil-faint);
  stroke-width: 1.2;
  stroke-linejoin: round;
}
</style>
