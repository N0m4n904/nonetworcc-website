<script setup>
import { t } from "../lib/language.js";

// The rings are three elements rather than three groups in one drawing: a
// transform animated on an SVG group runs on the main thread and lays the page
// out again every frame, where the same rotation on the box around it is handed
// to the compositor.
const RINGS = [
  {
    name: "outer",
    a: "M191.2 100.0C191.2 124.2 183.1 148.3 165.7 165.7C148.3 183.1 124.5 192.4 100.0 192.4C75.5 192.4 52.7 181.4 35.7 164.3C18.6 147.3 8.6 124.2 8.6 100.0C8.6 75.8 18.2 52.5 35.3 35.3C52.5 18.2 75.5 7.6 100.0 7.6C124.5 7.6 147.7 17.8 165.0 35.0C182.2 52.3 191.2 75.8 191.2 100.0",
    b: "M192.3 100.0C192.3 124.5 181.9 147.6 164.7 164.7C147.6 181.9 124.6 192.8 100.0 192.8C75.4 192.8 52.1 182.5 34.8 165.2C17.5 147.9 6.9 124.7 6.9 100.0C6.9 75.3 17.6 52.1 34.9 34.9C52.1 17.6 75.8 8.6 100.0 8.6C124.2 8.6 147.5 18.1 164.7 35.3C181.9 52.5 192.3 75.5 192.3 100.0",
  },
  {
    name: "middle",
    a: "M169.4 100.0C169.4 118.4 162.9 136.5 149.7 149.7C136.5 162.9 118.4 169.2 100.0 169.2C81.6 169.2 63.3 163.2 50.0 150.0C36.8 136.7 30.0 118.6 30.0 100.0C30.0 81.4 38.2 64.1 51.2 51.2C64.1 38.2 81.5 30.4 100.0 30.4C118.5 30.4 136.2 37.7 149.2 50.8C162.3 63.8 169.4 81.6 169.4 100.0",
    b: "M169.1 100.0C169.1 118.3 162.9 136.6 149.8 149.8C136.6 162.9 118.8 170.7 100.0 170.7C81.2 170.7 63.3 163.2 50.0 150.0C36.8 136.7 30.8 118.4 30.8 100.0C30.8 81.6 38.0 64.0 51.0 51.0C64.0 38.0 81.7 30.9 100.0 30.9C118.3 30.9 136.2 37.7 149.3 50.7C162.3 63.8 169.1 81.7 169.1 100.0",
  },
  {
    name: "inner",
    a: "M148.2 100.0C148.2 112.8 143.7 125.4 134.5 134.5C125.4 143.7 112.5 147.1 100.0 147.1C87.5 147.1 75.0 143.1 65.9 134.1C56.9 125.0 52.7 112.5 52.7 100.0C52.7 87.5 57.0 75.1 66.0 66.0C75.1 57.0 87.2 51.6 100.0 51.6C112.8 51.6 125.4 56.3 134.5 65.5C143.7 74.6 148.2 87.2 148.2 100.0",
    b: "M148.7 100.0C148.7 112.9 142.4 124.6 133.5 133.5C124.6 142.4 112.6 147.5 100.0 147.5C87.4 147.5 75.3 142.6 66.3 133.7C57.4 124.7 52.1 112.7 52.1 100.0C52.1 87.3 56.3 74.6 65.5 65.5C74.6 56.3 87.1 51.3 100.0 51.3C112.9 51.3 124.7 57.5 133.6 66.4C142.5 75.3 148.7 87.1 148.7 100.0",
  },
];
</script>

<template>
  <section class="section" id="top">
    <div class="shell hero">
      <div>
        <h1 class="display hero__title" :style="{ '--i': 1 }" v-reveal>
          Noah
          <span class="accent">Anleitner</span>
        </h1>
        <p class="lede" :style="{ '--i': 2 }" v-reveal>
          {{ t.hero.lede }}
        </p>
        <div class="hero__actions" :style="{ '--i': 3 }" v-reveal>
          <a class="button" href="#work">{{ t.hero.seeWork }}</a>
          <a class="button button--quiet" href="#projects">{{ t.hero.seeProjects }}</a>
        </div>
      </div>
      <figure class="hero__art" :style="{ '--i': 2 }" v-reveal>
        <div class="rings" aria-hidden="true" v-live>
          <div
            v-for="ring in RINGS"
            :key="ring.name"
            class="rings__ring"
            :class="`rings__ring--${ring.name}`"
          >
            <svg viewBox="0 0 200 200">
              <path class="a" :d="ring.a" />
              <path class="b" :d="ring.b" />
            </svg>
          </div>
        </div>
        <!-- Sized for the ~248px it is drawn at, not for the 610 it is stored
             at. Decoding is the expensive part on a phone, and it is paid in
             the pixels an image has rather than the ones it shows. -->
        <img class="hero__logo" src="/images/nonetworcc-logo.webp" alt="" width="610" height="610" />
      </figure>
    </div>
  </section>
</template>
