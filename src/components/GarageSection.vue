<script setup>
import { computed, nextTick, ref, useTemplateRef } from "vue";

import InstagramPost from "./InstagramPost.vue";
import SectionTitle from "./SectionTitle.vue";
import wheel from "../drawings/wheel.js";
import { Icon } from "../lib/content.js";
import { EdgeShape, EdgeSide } from "../lib/edge.js";
import { POST_WIDEST, loadEmbedScript } from "../lib/instagram.js";
import { t } from "../lib/language.js";

const props = defineProps({
  // `garage` in src/content.yaml: the handle, the profile and the permalinks
  // of the posts.
  garage: { type: Object, required: true },
});

// The handle as it is written, which is also the name of the list of posts.
const handle = computed(() => `@${props.garage.handle}`);

// garage.lede is the sentence under the title. `{handle}` in it is the place
// of the link to the profile.
const [ledeBeforeHandle, ledeAfterHandle] = t.garage.lede.split("{handle}");

// Instagram is contacted once the visitor asks for the posts, and not before:
// opening the page sends nothing to Meta. Until then an empty frame is in the
// place of each post.
const PostsState = Object.freeze({ NotAsked: "not-asked", Asked: "asked", Failed: "failed" });

// What the garage shows in each state. After a failure the frames still link
// to their posts, and the consent is back with the button to try again.
const SHOWN = Object.freeze({
  [PostsState.NotAsked]: { consent: true, failure: false, posts: false },
  [PostsState.Asked]: { consent: false, failure: false, posts: true },
  [PostsState.Failed]: { consent: true, failure: true, posts: true },
});

const postsState = ref(PostsState.NotAsked);
const shown = computed(() => SHOWN[postsState.value]);
const list = useTemplateRef("list");

const frameWidest = `${POST_WIDEST}px`;

async function loadPosts() {
  postsState.value = PostsState.Asked;
  // Instagram's script finds the posts that are in the document when it runs.
  await nextTick();
  // The button that had the focus is gone, and the list of posts gets it.
  list.value.focus({ preventScroll: true });
  postsState.value = (await loadEmbedScript()) ? PostsState.Asked : PostsState.Failed;
}
</script>

<template>
  <section class="sheet garage">
    <div class="insert">
      <svg v-edge="{ shape: EdgeShape.Cut, side: EdgeSide.Above, seed: 138 }" />
      <span class="strip strip--tl"></span>
      <span class="strip strip--tr"></span>
      <div class="insert__scene"><svg v-drawing="{ drawing: wheel, seed: 10 }" v-live /></div>
      <div class="insert__words">
        <!-- garage.title is the title of the section on the car. -->
        <SectionTitle :title="t.garage.title" :rule-seed="11" />
        <p class="lede">
          {{ ledeBeforeHandle }}<a class="link" :href="garage.profile">{{ handle }}</a>{{ ledeAfterHandle }}
        </p>
        <!-- garage.consent is the note on what a press of the button,
             garage.load, sends to whom. garage.failed is the line shown
             when the posts did not arrive. -->
        <div v-if="shown.consent" class="consent">
          <p v-if="shown.failure" class="note consent__failure" role="alert">{{ t.garage.failed }}</p>
          <p class="note">{{ t.garage.consent }}</p>
          <button class="tape" type="button" @click="loadPosts">{{ t.garage.load }}</button>
        </div>
      </div>
      <!-- garage.post is the name of an empty frame for a screen reader, and
           the words of the link to a post that is not shown. -->
      <ul
        ref="list"
        class="posts"
        :class="{ 'posts--asked': shown.posts }"
        tabindex="-1"
        :aria-label="handle"
        :style="{ '--post-count': garage.posts.length }"
      >
        <li v-for="permalink in garage.posts" :key="permalink" class="frame">
          <InstagramPost v-if="shown.posts" :permalink="permalink" :link-text="t.garage.post" />
          <span v-else class="frame__empty" role="img" :aria-label="t.garage.post">
            <svg class="icon" aria-hidden="true"><use :href="`#icon-${Icon.Instagram}`" /></svg>
          </span>
        </li>
      </ul>
      <span class="strip strip--bl"></span>
      <span class="strip strip--br"></span>
      <svg v-edge="{ shape: EdgeShape.Cut, side: EdgeSide.Below, seed: 235 }" />
    </div>
  </section>
</template>

<style>
/* ---------------------------------------------------------------------------
   Garage: a green sheet taped in across both leaves, over the wire.
   --------------------------------------------------------------------------- */

.garage {
  padding-block: clamp(2rem, 5vw, 4rem);
  /* The tape is wider than the sheet, and on a phone wider than the screen. */
  overflow-x: clip;
}

.insert {
  --paper-here: var(--sheet);
  --insert-margin: clamp(0.5rem, 2vw, 3rem);
  position: relative;
  z-index: var(--layer-insert);
  display: grid;
  gap: clamp(2rem, 5vw, 3.5rem) clamp(2rem, 4vw, 4.5rem);
  margin-inline: var(--insert-margin);
  padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.25rem, 5vw, 5rem);
  background-color: var(--paper-here);
  box-shadow: var(--shadow-low);
}

.insert__scene {
  max-width: 32rem;
  justify-self: center;
  width: 100%;
}

.insert__words .title {
  margin-block-end: clamp(1.5rem, 3vw, 2.25rem);
}

.consent {
  margin-block-start: 1.5rem;
}

.consent__failure {
  margin-block-end: 0.75rem;
  color: var(--ink);
  font-weight: 600;
}

.consent .tape {
  margin-block-start: 1.5rem;
  margin-inline-start: 0.4rem;
  max-width: 100%;
  white-space: normal;
  text-align: center;
}

/* A place for each photograph: an empty frame until its post is there. */
.posts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.9rem, 3vw, 1.75rem);
  justify-content: center;
}

.frame {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 540 / 690;
  border: 2px dashed var(--pencil-faint);
  border-radius: 9px 12px 8px 13px;
  color: var(--pencil-soft);
  rotate: var(--tilt, 0deg);
}

.frame:nth-child(3n + 1) { --tilt: -1.6deg; }
.frame:nth-child(3n + 2) { --tilt: 1.1deg; }
.frame:nth-child(3n) { --tilt: -0.7deg; }

.frame__empty .icon {
  width: clamp(1.4rem, 4vw, 2rem);
  height: clamp(1.4rem, 4vw, 2rem);
}

/* The tape a photograph hangs from. */
.frame::before {
  content: '';
  position: absolute;
  inset-block-start: -0.7rem;
  inset-inline-start: 50%;
  width: 38%;
  max-width: 5.5rem;
  height: 1.25rem;
  background-color: var(--tape-clear);
  translate: -50% 0;
  rotate: -3deg;
}

/* From here up the empty frames are in one row. */
@media (min-width: 46rem) {
  .posts {
    grid-template-columns: repeat(var(--post-count), minmax(0, 10.5rem));
  }
}

/* Asked for: the posts as Instagram shows them, one to a row, two from 44rem
   and three from 74rem. A post in a column narrower than Instagram lays one
   out is shown smaller (see InstagramPost.vue), so it is inside its frame at
   every width. */
.posts--asked {
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(1.75rem, 4vw, 3rem) clamp(1rem, 2.5vw, 2rem);
}

@media (min-width: 44rem) {
  .posts--asked {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 74rem) {
  .posts--asked {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* A frame is as wide as its column, up to the widest a post is shown. It has
   the look of an empty frame until its post is there. */
.posts--asked .frame {
  width: 100%;
  max-width: v-bind(frameWidest);
  place-self: start center;
}

/* Around a post the frame has no line of its own and is as tall as the
   post. */
.frame:has(.post--shown) {
  aspect-ratio: auto;
  border: 0;
  border-radius: 3px;
  rotate: none;
}

/* The sheet is wider than a leaf, and from here up the thumb index is over
   its outer edge. What is on the sheet is as far from the index as the words
   of a leaf are. */
@media (min-width: 56rem) {
  .insert {
    padding-inline-end: calc(var(--margin-outer) - var(--insert-margin));
  }
}

@media (min-width: 62rem) {
  .insert {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
    align-items: center;
  }

  .posts {
    grid-column: 1 / -1;
  }
}

/* With both leaves open the label is over the other edge of the sheet. */
@media (min-width: 78rem) {
  .insert {
    padding-inline-start: calc(var(--margin-outer) - var(--insert-margin));
  }
}
</style>
