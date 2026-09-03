<script setup>
import { ref } from "vue";
import content from "./content.yaml";

import IconSprite from "./components/IconSprite.vue";
import SiteBar from "./components/SiteBar.vue";
import HeroPanel from "./components/HeroPanel.vue";
import SectionHead from "./components/SectionHead.vue";
import ProjectTile from "./components/ProjectTile.vue";
import GarageSection from "./components/GarageSection.vue";
import AboutSection from "./components/AboutSection.vue";
import SiteFooter from "./components/SiteFooter.vue";
import ScribblePad from "./components/ScribblePad.vue";
import { hasFinePointer } from "./lib/pointer.js";
import { t, lang } from "./lib/language.js";

import { useScrollFrame } from "./composables/useScrollFrame.js";
import { useSmartCursor } from "./composables/useSmartCursor.js";

const aura = ref(null);
const thread = ref(null);

const { scrolled } = useScrollFrame({ thread, aura });
useSmartCursor();
</script>

<template>
  <!-- First in the document, so it is the first thing a Tab reaches. -->
  <a class="skip" href="#top">{{ t.skip }}</a>

  <!-- The ground's depth: two soft radial fields, larger than the viewport so
       their edges never show, drifting against the scroll. -->
  <div class="aura" ref="aura" aria-hidden="true" v-live></div>

  <IconSprite />

  <!-- Drawn in proportion to how much of the page has gone by.

       pathLength="1" declares the line to be one unit long whatever its real
       geometry, so the dash can be written as a fraction and nobody — neither
       the script nor the stylesheet — has to measure it first. -->
  <svg
    class="thread"
    ref="thread"
    viewBox="0 0 42 1000"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path pathLength="1" d="M21 0c-14 120 14 190 0 300s-16 190 0 300 12 220 0 400" />
  </svg>

  <SiteBar :scrolled="scrolled" />

  <main>
    <HeroPanel />

    <section class="section" id="work">
      <div class="shell">
        <SectionHead :label="t.work.label" :title="t.work.title" />
        <ProjectTile
          v-for="(entry, i) in content.work"
          :key="entry.title"
          :entry="entry"
          :index="i"
        />
      </div>
    </section>

    <section class="section" id="projects">
      <!-- A drawn field that drifts, far enough back to read as paper texture
           rather than as content. -->
      <div class="field" aria-hidden="true" v-live>
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <path d="M0 40c60-8 120 6 180-2s140-10 220 4" />
          <path d="M0 92c70 10 130-8 195 2s140 12 205-4" />
          <path d="M0 148c55-12 118 8 178 0s150-12 222 6" />
          <path d="M0 206c78 8 128-10 196 0s130 14 204-2" />
          <path d="M0 258c62-10 126 8 186 2s136-12 214 4" />
          <path d="M64 0c-8 70 8 130-2 190s6 80 2 110" />
          <path d="M198 0c10 66-8 128 2 188s-6 82-2 112" />
          <path d="M330 0c-6 74 10 126 0 186s8 84 2 114" />
        </svg>
      </div>
      <div class="shell">
        <SectionHead :label="t.projects.label" :title="t.projects.title" />
        <ProjectTile
          v-for="(entry, i) in content.projects"
          :key="entry.title"
          :entry="entry"
          :index="i"
        />
      </div>
    </section>

    <GarageSection :garage="content.garage" />
    <AboutSection />
  </main>

  <SiteFooter :profile="content.garage.profile" />

  <!-- Last, so it lies over everything it might be drawn on. Left out
       entirely without a pointer and a keyboard to reach it with, rather
       than built and hidden. -->
  <ScribblePad v-if="hasFinePointer" />
</template>
