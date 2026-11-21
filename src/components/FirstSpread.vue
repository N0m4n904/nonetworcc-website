<script setup>
import { useTemplateRef } from "vue";

import SiteMark from "./SiteMark.vue";
import { useInWindow } from "../composables/useInWindow.js";
import car from "../drawings/car.js";
import flourish from "../drawings/flourish.js";
import keyboard from "../drawings/keyboard.js";
import phone from "../drawings/phone.js";
import { EdgeShape, EdgeSide } from "../lib/edge.js";
import { t } from "../lib/language.js";
import { SectionId } from "../lib/sections.js";

// The first spread of the book: the name, the things on the desk, the car, and
// the words with the two ways on.

// The label in the corner of the window shows the name while this one is out
// of the window, so the first spread reports whether it is in.
const emit = defineEmits(["nameInWindow"]);
useInWindow(useTemplateRef("name"), (inWindow) => emit("nameInWindow", inWindow));

// The two places by which the car is laid out (see src/drawings/car.js), each
// as the share of the width of the drawing that it lies from the left or from
// the top of it.
const [carLeft, carTop, carWidth] = car.viewBox;
const measureInCarWidths = (units) => (units / carWidth).toFixed(3);
const carAnchors = {
  "--car-to-wire": measureInCarWidths(car.anchors.wire[0] - carLeft),
  "--car-to-desk": measureInCarWidths(car.anchors.desk[1] - carTop),
};
</script>

<template>
  <section :id="SectionId.Top" class="sheet hero" :style="carAnchors">
    <h1 ref="name" class="hero__name">
      Noah Anleitner
      <svg v-drawing="{ drawing: flourish, seed: 3 }" v-live />
      <SiteMark class="hero__seal" />
    </h1>
    <div class="hero__studies">
      <div class="hero__keyboard"><svg v-drawing="{ drawing: keyboard, seed: 4 }" v-live /></div>
      <div class="hero__phone"><svg v-drawing="{ drawing: phone, seed: 5 }" v-live /></div>
    </div>
    <div class="hero__car"><svg v-drawing="{ drawing: car, seed: 6 }" v-live /></div>
    <div class="hero__words">
      <!-- hero.lede is the one sentence on who this is. hero.seeWork and
           hero.seeProjects are the words on the two ways on: to the work and
           to the projects. -->
      <p class="lede">{{ t.hero.lede }}</p>
      <p class="actions">
        <a class="tape" :href="`#${SectionId.Work}`">{{ t.hero.seeWork }}</a>
        <a class="tape tape--paper" :href="`#${SectionId.Projects}`">{{ t.hero.seeProjects }}</a>
      </p>
    </div>
    <svg v-edge="{ shape: EdgeShape.Torn, side: EdgeSide.Below, seed: 41 }" />
  </section>
</template>

<style>
.hero {
  /* The name is one line, so its size follows from the room that line has:
     the width of its leaf, less the wire and the margins. --name-ems is the
     width of "Noah Anleitner" with the seal beside it in ems of Shantell Sans
     at weight 800, the face in src/fonts. */
  --name-ems: 8.7;
  --name-most: 4rem;
  --name-room: calc(100vw - var(--binding) - var(--margin-inner) - var(--margin-outer));
  /* The column of the words beside the name, and the widest gap between the
     two. */
  --words: 20rem;
  --words-gap-most: 2.5rem;
  --step-name: min(var(--name-most), var(--name-room) / var(--name-ems));
  /* The tilt lifts the end of the name, and the seal stands above it there:
     two thirds of the size of the name above its head. The leaf is clear by
     that much beneath the row at the top of the window. */
  --head: calc(var(--strip) + 0.25rem + 0.67 * var(--step-name));
  display: flex;
  flex-direction: column;
  min-height: calc(100svh - 3.25rem);
  padding: var(--head) var(--margin-outer) clamp(2.5rem, 7vw, 4rem) calc(var(--binding) + var(--margin-inner));
  background-image:
    radial-gradient(70% 60% at 18% 0%, var(--glow-accent), transparent 70%),
    radial-gradient(60% 55% at 100% 100%, var(--glow-accent-alt), transparent 72%);
  overflow-x: clip;
}

.hero__name {
  position: relative;
  width: fit-content;
  font-size: var(--step-name);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.02em;
  white-space: nowrap;
  rotate: -3deg;
  transform-origin: 0 100%;
}

.hero__name .drawing--flourish {
  position: absolute;
  inset-inline: -2% -4%;
  inset-block-start: 96%;
  width: 106%;
}

/* The seal beside the signature. */
.hero__seal {
  position: absolute;
  inset-inline-start: calc(100% - 0.26em);
  inset-block-end: 70%;
  width: 0.52em;
  height: 0.52em;
  color: var(--accent-ink);
  rotate: 14deg;
}

.hero__studies {
  display: flex;
  align-items: center;
  gap: 8%;
  max-width: 38rem;
  margin-block-start: clamp(2.75rem, 8vw, 4rem);
}

.hero__keyboard {
  flex: 1 1 0;
  min-width: 0;
}

.hero__phone {
  flex: 0 0 19%;
  rotate: 9deg;
}

.hero__car {
  max-width: 60rem;
  margin-block: auto;
  padding-block: clamp(1.75rem, 6vw, 3.5rem) clamp(2rem, 6vw, 3rem);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem 1.25rem;
  margin-block-start: 1.75rem;
  padding-inline-start: 0.4rem;
}

/* Room for two columns on the one leaf: the words move up beside the name,
   so that the first screen says who this is before it has to be scrolled. */
@media (min-width: 64rem) {
  .hero {
    --name-room: calc(
      100vw - var(--binding) - var(--margin-inner) - var(--margin-outer) - var(--words) - var(--words-gap-most)
    );
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, var(--words));
    grid-template-rows: auto minmax(0, 1fr) auto;
    column-gap: clamp(1.5rem, 3vw, var(--words-gap-most));
  }

  .hero__name,
  .hero__studies {
    grid-column: 1;
  }

  .hero__words {
    grid-column: 2;
    grid-row: 1 / span 2;
    padding-block-start: 0.5rem;
  }

  /* Narrower than the leaf, so that the first screen shows it down to the road. */
  .hero__car {
    grid-column: 1 / -1;
    max-width: 52rem;
    margin-block: 0;
  }
}

/* Both leaves. The name and the things on the desk take the left one, the
   words the right, and the car lies across the wire on a row of its own, so
   that nothing above it can run into it however long the German is. */
@media (min-width: 78rem) {
  .hero {
    --name-most: 7rem;
    --name-room: calc(50vw - var(--binding) / 2 - var(--margin-outer) - 1.5rem);
    --car: min(58vw, 96rem);
    --phone: clamp(6rem, 7vw, 11rem);
    --phone-inset: calc(var(--margin-outer) + 1.5rem);
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: var(--binding);
    min-height: max(calc(100svh - 3.25rem), 43rem);
    padding: clamp(5.75rem, 11vh, 8rem) 0 clamp(2.25rem, 5vh, 3.5rem);
  }

  .hero__name,
  .hero__studies {
    margin-inline-start: var(--margin-outer);
  }

  /* The bonnet of the car is low: on its left the upper part of its drawing
     is empty, and the things on the desk reach down into that. */
  .hero__studies {
    display: block;
    max-width: none;
    margin-block: 0 calc(var(--car) * -1 * var(--car-to-desk));
    padding-block: clamp(1.75rem, 4.5vh, 4rem) 0.5rem;
  }

  .hero__keyboard {
    width: min(25vw, 42rem);
    margin-inline-start: -3vw;
  }

  /* The words take what the right leaf has left beside the phone. */
  .hero__words {
    width: min(27rem, 100% - var(--margin-inner) - var(--phone-inset) - var(--phone) - 2.5rem);
    margin-inline-start: var(--margin-inner);
    padding-block-start: 0.75rem;
  }

  .hero__phone {
    position: absolute;
    inset-block-start: clamp(5.5rem, 10vh, 7rem);
    inset-inline-end: var(--phone-inset);
    width: var(--phone);
  }

  /* The wire crosses it behind the front wheel, along the edge of the front
     door, where it hides neither a wheel nor the mirror. */
  .hero__car {
    width: var(--car);
    max-width: none;
    margin: 0.75rem 0 0 calc(50% - var(--car) * var(--car-to-wire));
    padding: 0;
  }
}
</style>
