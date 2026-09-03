<script setup>
// The footer's links are its own: they are navigation, not entries in a list
// the page draws. The Instagram profile is the one value shared with the
// garage, so it comes from the same place rather than being written twice.
defineProps({
  profile: { type: String, required: true },
});

const COLUMNS = [
  {
    label: "Work",
    links: [
      { text: "Organisation", href: "https://github.com/Dominikus-Ringeisen-Werk", icon: "github" },
      { text: "Work account", href: "https://github.com/DRW-NoahAnleitner", icon: "github" },
    ],
  },
  {
    label: "Legal",
    links: [{ text: "Privacy", href: "/privacy-policy.txt" }],
  },
];
</script>

<template>
  <footer class="section footer">
    <div class="shell footer__grid">
      <div>
        <p class="label">Me</p>
        <ul>
          <li>
            <a href="https://github.com/N0m4n904">
              <svg class="icon" aria-hidden="true"><use href="#icon-github" /></svg>GitHub
            </a>
          </li>
          <li>
            <a href="https://gitlab.com/N0m4n904">
              <svg class="icon" aria-hidden="true"><use href="#icon-gitlab" /></svg>GitLab
            </a>
          </li>
          <li>
            <a :href="profile">
              <svg class="icon" aria-hidden="true"><use href="#icon-instagram" /></svg>Instagram
            </a>
          </li>
        </ul>
      </div>
      <div v-for="column in COLUMNS" :key="column.label">
        <p class="label">{{ column.label }}</p>
        <ul>
          <li v-for="link in column.links" :key="link.href">
            <a :href="link.href">
              <svg v-if="link.icon" class="icon" aria-hidden="true">
                <use :href="`#icon-${link.icon}`" />
              </svg>{{ link.text }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
