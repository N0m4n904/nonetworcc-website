<script setup>
import { ref } from "vue";
import SectionHead from "./SectionHead.vue";
import PostStub from "./PostStub.vue";
import { t } from "../lib/language.js";

defineProps({
  garage: { type: Object, required: true },
});

// Instagram is fetched only once the visitor asks for it, so that opening the
// page contacts Meta not at all.
//
// This is the one piece of real state on the page, and the one place Vue's
// model earns its keep: the stubs become the embeds because `asked` changed,
// rather than because a script found the elements and replaced them.
const asked = ref(false);

// Held back one frame so the browser has a starting state to animate away
// from; the frames then arrive one after another on the transition delay.
const arrived = ref(false);

function loadPosts() {
  asked.value = true;

  requestAnimationFrame(() => {
    arrived.value = true;

    // The blockquotes have to be in the document before embed.js is asked to
    // convert them, so this waits for Vue to have swapped them in.
    requestAnimationFrame(() => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
        return;
      }
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.instagram.com/embed.js";
      document.body.appendChild(script);
    });
  });
}
</script>

<template>
  <section class="section" id="garage">
    <div class="shell">
      <SectionHead :label="t.garage.label" :title="t.garage.title" />

      <p class="lede">
        {{ t.garage.ledeBefore }}
        <a class="accent" :href="garage.profile" v-live
          ><span class="accent__face">@{{ garage.handle }}</span
          ><span class="accent__face accent__face--alt" aria-hidden="true">@{{ garage.handle }}</span
        ></a>.
      </p>

      <template v-if="!asked">
        <p class="prose tile__note">
          {{ t.garage.consent }}
        </p>
        <div class="hero__actions">
          <button type="button" class="button" @click="loadPosts">
            {{ t.garage.load }}
          </button>
        </div>
      </template>

      <div class="posts">
        <PostStub
          v-for="(permalink, i) in asked ? [] : garage.posts"
          :key="permalink"
          :permalink="permalink"
          :index="i"
        />
        <div
          v-for="(permalink, i) in asked ? garage.posts : []"
          :key="permalink"
          class="post-frame"
          :class="{ 'is-in': arrived }"
          :style="{ '--i': i }"
        >
          <blockquote
            class="instagram-media"
            :data-instgrm-permalink="permalink"
            data-instgrm-version="14"
            style="max-width: 540px; min-width: 250px; width: 100%; margin: 0 auto"
          />
        </div>
      </div>
    </div>
  </section>
</template>
