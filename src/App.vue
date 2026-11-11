<script setup>
import { ref } from "vue";
import content from "./content.yaml";

import IconSprite from "./components/IconSprite.vue";
import PageCorner from "./components/PageCorner.vue";
import BookBinding from "./components/BookBinding.vue";
import FirstSpread from "./components/FirstSpread.vue";
import WorkSection from "./components/WorkSection.vue";
import ProjectsSection from "./components/ProjectsSection.vue";
import GarageSection from "./components/GarageSection.vue";
import AboutSection from "./components/AboutSection.vue";
import BookCover from "./components/BookCover.vue";
import ScribblePad from "./components/ScribblePad.vue";
import { hasFinePointer } from "./lib/pointer.js";
import { SectionId } from "./lib/sections.js";

import { useSmartCursor } from "./composables/useSmartCursor.js";

// The name is written across the first spread, and a page opens on it. The
// first spread says when that changes, and the corner takes the name over.
const nameInWindow = ref(true);

// The sections of the book in the order they are bound into it and listed in
// the index, each with what it is given of src/content.yaml.
const sections = [
  { id: SectionId.Work, component: WorkSection, given: { entries: content.work } },
  { id: SectionId.Projects, component: ProjectsSection, given: { entries: content.projects } },
  { id: SectionId.Garage, component: GarageSection, given: { garage: content.garage } },
  { id: SectionId.About, component: AboutSection, given: { tools: content.tools } },
];

useSmartCursor();
</script>

<template>
  <IconSprite />

  <PageCorner :named="!nameInWindow" :sections="sections.map((section) => section.id)" />

  <!-- One book: the wire, and the parts bound into it in the order they are
       read. Each part is one component and brings its own sheet. -->
  <main class="book">
    <BookBinding />
    <FirstSpread @name-in-window="nameInWindow = $event" />
    <component
      :is="section.component"
      v-for="section in sections"
      :id="section.id"
      :key="section.id"
      v-bind="section.given"
    />
  </main>

  <BookCover :profile="content.garage.profile" />

  <!-- Last, so it lies over everything it might be drawn on. Without a mouse
       or a stylus to draw with, it is not built at all. -->
  <ScribblePad v-if="hasFinePointer" />
</template>
