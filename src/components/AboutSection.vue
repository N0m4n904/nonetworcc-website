<script setup>
import { computed } from "vue";

import SectionHead from "./SectionHead.vue";
import { t } from "../lib/language.js";

const props = defineProps({
  tools: { type: Array, required: true },
});

// A tool is a name, or a name with somewhere to go. Both shapes arrive here as
// the same one, so the template asks about the link and nothing else.
const entries = computed(() =>
  props.tools.map((tool) => (typeof tool === "string" ? { name: tool } : tool))
);
</script>

<template>
  <section class="section" id="about">
    <div class="shell">
      <SectionHead :title="t.about.title" />

      <div class="about">
        <div>
          <div
            v-for="(block, i) in t.about.blocks"
            :key="block.heading"
            class="about__block"
            :style="{ '--i': i }"
            v-reveal
          >
            <h3>{{ block.heading }}</h3>
            <p>{{ block.text }}</p>
          </div>
          <div class="meta">
            <a href="mailto:contact@nonetwor.cc?subject=Contact">contact@nonetwor.cc</a>
            <!-- Carries only what this page already says out loud: a name, a
                 title, an address and two profiles. No number, no street. -->
            <a href="/contact.vcf" download="noah-anleitner.vcf">{{ t.about.card }}</a>
            <!-- The same page, printed. Whichever language is being read. -->
            <a :href="t.about.pdfFile" download>{{ t.about.pdf }}</a>
          </div>
        </div>
        <div>
          <p class="label">{{ t.about.tools }}</p>
          <ul class="tags">
            <!-- The pill is the padding, so whatever is inside it fills it:
                 a linked tool is clickable across the whole shape rather than
                 only on its letters. -->
            <li v-for="tool in entries" :key="tool.name">
              <a v-if="tool.href" :href="tool.href">{{ tool.name }}</a>
              <span v-else>{{ tool.name }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
