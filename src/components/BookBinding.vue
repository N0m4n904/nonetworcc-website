<!-- The wire. One drawing down the whole book, above the leaves it holds: a
     loop through one row of holes while the book is folded over, and through
     a hole in either leaf once both lie open. A pattern repeats the loop, so
     the wire is as long as the book whatever is bound into it. -->
<template>
  <svg class="binding" aria-hidden="true">
    <defs>
      <pattern id="wire-folded" width="28" height="32" patternUnits="userSpaceOnUse">
        <rect class="binding__gap" width="7" height="32" />
        <rect class="binding__hole" x="12" y="11" width="9" height="10" rx="3" />
        <path class="binding__wire binding__wire--far" d="M16 14C12 6 3 6 -3 12" />
        <path class="binding__wire" d="M17 17C12 6 2 5 -4 13" />
      </pattern>
      <pattern id="wire-spread" width="56" height="36" patternUnits="userSpaceOnUse">
        <rect class="binding__gap" x="23" width="10" height="36" />
        <rect class="binding__hole" x="7" y="13" width="10" height="10" rx="3" />
        <rect class="binding__hole" x="39" y="13" width="10" height="10" rx="3" />
        <path class="binding__wire binding__wire--far" d="M12 16C17 6 39 6 44 16" />
        <path class="binding__wire" d="M12 19C16 3 40 3 44 19" />
      </pattern>
    </defs>
    <rect class="binding__run binding__run--folded" width="28" height="100%" fill="url(#wire-folded)" />
    <rect class="binding__run binding__run--spread" width="56" height="100%" fill="url(#wire-spread)" />
  </svg>
</template>

<style>
.binding {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: var(--layer-binding);
  width: var(--binding);
  height: 100%;
  pointer-events: none;
}

.binding__gap,
.binding__hole {
  fill: var(--desk);
}

.binding__hole {
  stroke: var(--pencil-faint);
  stroke-width: 1;
}

.binding__wire {
  fill: none;
  stroke: var(--pencil-soft);
  stroke-width: 2.2;
  stroke-linecap: round;
}

.binding__wire--far {
  stroke: var(--pencil-faint);
  stroke-width: 1.4;
}

.binding__run--spread {
  display: none;
}

@media (min-width: 78rem) {
  .binding {
    inset-inline-start: calc(50% - var(--binding) / 2);
  }

  .binding__run--folded {
    display: none;
  }

  .binding__run--spread {
    display: inline;
  }
}
</style>
