import { createApp } from "vue";

import App from "./App.vue";
import reveal from "./directives/reveal.js";
import live from "./directives/live.js";
import outline from "./directives/outline.js";

import "./redesign.css";

// The three directives are the page's own machinery, registered globally
// because they belong to any element that wants them rather than to a
// component: arrive once on the way in, hold still when off screen, wear a
// drawn outline.
createApp(App)
  .directive("reveal", reveal)
  .directive("live", live)
  .directive("outline", outline)
  .mount("#app");
