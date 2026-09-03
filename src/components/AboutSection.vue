<script setup>
import SectionHead from "./SectionHead.vue";

const BLOCKS = [
  { heading: "Who I am", text: "Born 1999, living in Germany." },
  { heading: "What I do", text: "Software development, at work and after it." },
  { heading: "Away from the keyboard", text: "Tuning my car and photographing it." },
];

const TOOLS = [
  "Kotlin", "Java", "Android", "AOSP", "Jetpack Compose", "C#", "Visual Basic",
  "TypeScript", "Vue 3", "PHP", "Linux", "NixOS", "MySQL", "SQLite", "MSSQL",
  "Jira", "Confluence", "Scriptrunner", "JobRouter", "Nextcloud", "Tailscale",
  "Apache APISIX",
];
</script>

<template>
  <section class="section" id="about">
    <div class="shell">
      <SectionHead label="Who is typing" title="About" />

      <div class="about">
        <div>
          <div
            v-for="(block, i) in BLOCKS"
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
            <a href="/contact.vcf" download="noah-anleitner.vcf">Save my card</a>
          </div>
        </div>
        <div>
          <p class="label">Tools of the trade</p>
          <ul class="tags">
            <li v-for="tool in TOOLS" :key="tool">{{ tool }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
