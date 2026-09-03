<script setup>
import SectionHead from "./SectionHead.vue";
import { t } from "../lib/language.js";

const TOOLS = [
  "Kotlin", "Java", "Android", "AOSP", "Jetpack Compose", "C#", "Visual Basic",
  "TypeScript", "Vue 3", "PHP", "Linux", "NixOS", "MySQL", "SQLite", "MSSQL",
  "Jira", "Confluence", "Scriptrunner", "JobRouter", "Nextcloud", "Tailscale",
  "Apache APISIX", "Claude Code", "Kord"
];
</script>

<template>
  <section class="section" id="about">
    <div class="shell">
      <SectionHead :label="t.about.label" :title="t.about.title" />

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
            <li v-for="tool in TOOLS" :key="tool">{{ tool }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
