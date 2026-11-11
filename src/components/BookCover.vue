<script setup>
import { computed } from "vue";

import IconLink from "./IconLink.vue";
import SiteMark from "./SiteMark.vue";
import { Icon } from "../lib/content.js";
import { t } from "../lib/language.js";
import { SectionId } from "../lib/sections.js";

// The inside of the cover, where the book ends. Its links are written here:
// they lead on from the book and are no entries of src/content.yaml. The
// Instagram profile is the profile of the garage and is handed in from the
// content. The two links of the work are also links of the first entry
// under `work` there, and are written in both places.
const props = defineProps({
  profile: { type: String, required: true },
});

// footer.me, footer.work and footer.legal head the three columns: the
// profiles of Noah, the profiles at work, and the legal texts.
// footer.organisation, footer.workAccount and footer.privacy are the words of
// three of the links.
const columns = computed(() => [
  {
    label: t.footer.me,
    links: [
      { text: "GitHub", href: "https://github.com/N0m4n904", icon: Icon.GitHub },
      { text: "GitLab", href: "https://gitlab.com/N0m4n904", icon: Icon.GitLab },
      { text: "Instagram", href: props.profile, icon: Icon.Instagram },
    ],
  },
  {
    label: t.footer.work,
    links: [
      { text: t.footer.organisation, href: "https://github.com/Dominikus-Ringeisen-Werk", icon: Icon.GitHub },
      { text: t.footer.workAccount, href: "https://github.com/DRW-NoahAnleitner", icon: Icon.GitHub },
    ],
  },
  {
    label: t.footer.legal,
    links: [{ text: t.footer.privacy, href: "/privacy-policy.txt" }],
  },
]);
</script>

<template>
  <footer :id="SectionId.End" class="cover">
    <div class="cover__inner">
      <SiteMark class="cover__mark" />
      <div v-for="column in columns" :key="column.label">
        <p class="cover__label">{{ column.label }}</p>
        <ul class="cover__links">
          <li v-for="link in column.links" :key="link.href">
            <IconLink :href="link.href" :icon="link.icon">{{ link.text }}</IconLink>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<style>
.cover {
  background-color: var(--cover);
  padding: clamp(2.5rem, 6vw, 4rem) var(--margin-outer) clamp(4.5rem, 9vw, 5.5rem) calc(var(--binding) + var(--margin-inner));
}

.cover__inner {
  display: grid;
  gap: 2rem clamp(1.5rem, 4vw, 4rem);
  max-width: 62rem;
  margin-inline: auto;
}

.cover__mark {
  width: 3.25rem;
  height: 3.25rem;
  color: var(--pencil-soft);
}

.cover__label {
  color: var(--ink-note);
  font-size: var(--step-small);
  font-weight: 700;
  line-height: 1.3;
}

.cover__links {
  display: grid;
  justify-items: start;
  margin-block-start: 0.5rem;
}

.cover__links .link {
  min-height: 2.5rem;
  color: var(--ink-soft);
  font-weight: 500;
}

@media (min-width: 40rem) {
  .cover__inner {
    grid-template-columns: auto repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 78rem) {
  .cover {
    padding-inline: var(--margin-outer);
  }
}
</style>
