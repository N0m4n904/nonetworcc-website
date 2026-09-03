<script setup>
import { say } from "../lib/language.js";

// One card, from one entry in src/content.yaml.
//
// No media means no mark column and a tile that runs full width, which is what
// tile--plain says. The three directives are the page's own machinery: arrive
// once on the way in, hold still when off screen, wear a drawn outline.

defineProps({
  entry: { type: Object, required: true },
  index: { type: Number, default: 0 },
});
</script>

<template>
  <article
    class="tile"
    :class="{ 'tile--plain': !entry.media }"
    :style="{ '--i': index }"
    v-reveal
    v-live
    v-outline
  >
    <div
      v-if="entry.media"
      class="tile__media"
      :class="entry.media.treatment && `tile__media--${entry.media.treatment}`"
    >
      <img :src="entry.media.src" :alt="entry.media.alt || ''" />
    </div>
    <div>
      <!-- No space between the two: .tile__title is a flex row with a gap, so
           a literal one would be trimmed anyway and only muddies the markup. -->
      <h3 class="heading tile__title">{{ say(entry.title)
        }}<span v-if="entry.badge" class="badge">{{ say(entry.badge) }}</span></h3>
      <p class="tile__body">{{ say(entry.body) }}</p>
      <p v-if="entry.note" class="tile__note">{{ say(entry.note) }}</p>

      <!-- Perfekt eingereihtes Datum (oberhalb der Links) -->
      <div v-if="entry.date" class="tile__date-container">
        <span class="badge badge--date">{{ say(entry.date) }}</span>
      </div>

      <div v-if="entry.links?.length" class="meta">
        <a v-for="link in entry.links" :key="link.href" :href="link.href">
          <svg v-if="link.icon" class="icon" aria-hidden="true">
            <use :href="`#icon-${link.icon}`" />
          </svg>{{ say(link.text) }}
        </a>
      </div>
    </div>
  </article>
</template>
