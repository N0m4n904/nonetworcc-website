<script setup>
import BookSpread from "./BookSpread.vue";
import camera from "../drawings/camera.js";
import { MAIL_ADDRESS, MAIL_LINK } from "../lib/contact.js";
import { t } from "../lib/language.js";

defineProps({
  // `tools` in src/content.yaml, as readContent of src/lib/content.js returns
  // them: each a name, and the address it leads to where it has one.
  tools: { type: Array, required: true },
});
</script>

<template>
  <!-- about.title is the title of the section on who Noah is. -->
  <BookSpread class="spread--under-title" :title="t.about.title" :rule-seed="12">
    <!-- about.blocks are the facts about Noah, each a heading and a sentence. -->
    <div v-for="block in t.about.blocks" :key="block.heading" class="fact">
      <h3 class="subhead">{{ block.heading }}</h3>
      <p>{{ block.text }}</p>
    </div>
    <ul class="reach">
      <li><a class="link" :href="MAIL_LINK">{{ MAIL_ADDRESS }}</a></li>
      <!-- The card contains only what this page shows: a name, a title, an
           address and two profiles. It has neither a phone number nor a
           street. -->
      <li><a class="link" href="/contact.vcf" download="noah-anleitner.vcf">{{ t.about.card }}</a></li>
    </ul>
    <template #right>
      <!-- about.tools is the heading of the list of what Noah works with. -->
      <h3 class="subhead tools-head">{{ t.about.tools }}</h3>
      <ul class="tools">
        <li v-for="tool in tools" :key="tool.name">
          <!-- A tool without an address is a word that cannot be pressed. -->
          <component :is="tool.href ? 'a' : 'span'" class="tool" :href="tool.href">{{ tool.name }}</component>
        </li>
      </ul>
      <div class="about__camera"><svg v-drawing="{ drawing: camera, seed: 13 }" v-live /></div>
    </template>
  </BookSpread>
</template>

<style>
.fact + .fact {
  margin-block-start: 1.6rem;
}

.fact p {
  margin-block-start: 0.2rem;
  color: var(--ink-soft);
  font-size: var(--step-lead);
  line-height: 1.5;
}

.reach {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.6rem;
  margin-block-start: 2.25rem;
}

.tools-head {
  margin-block-end: 1rem;
}

.tools {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.1rem 1rem;
}

@media (min-width: 34rem) {
  .tools {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Bare words in a list. The ring of the pointer is their only outline. */
.tool {
  display: inline-flex;
  align-items: center;
  min-height: 2.5rem;
  padding: 0.15rem 0.7rem;
  margin-inline-start: -0.7rem;
  border-radius: 1.25rem;
  color: var(--ink-soft);
  text-decoration: underline;
  text-decoration-color: var(--pencil-faint);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.3em;
  transition: color 0.25s var(--ease), text-decoration-color 0.25s var(--ease);
}

a.tool:hover {
  color: var(--ink);
  text-decoration-color: var(--accent-ink);
}

.about__camera {
  width: min(15rem, 62%);
  margin-block-start: clamp(2.5rem, 6vw, 3.5rem);
  margin-inline-start: auto;
  rotate: -5deg;
}
</style>
