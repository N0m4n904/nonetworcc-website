import { createApp } from "vue";

import App from "./App.vue";
import reveal from "./directives/reveal.js";
import live from "./directives/live.js";
import outline from "./directives/outline.js";
import field from "./directives/field.js";

import { greet } from "./lib/greeting.js";
import { lang, t } from "./lib/language.js";

import "./redesign.css";
import "./print.css";

// The four directives are the page's own machinery, registered globally
// because they belong to any element that wants them rather than to a
// component: arrive once on the way in, hold still when off screen, wear a
// drawn outline, carry a drawn field.
// The document has to say which language it is in — a screen reader chooses a
// voice by it, and the browser chooses hyphenation and quotation marks. The
// title and description follow for the tab and the bookmark; the tags in the
// head stay English, since crawlers do not run this.
document.documentElement.lang = lang;
document.title = t.documentTitle;
const description = document.querySelector('meta[name="description"]');
if (description) description.setAttribute("content", t.description);

createApp(App)
  .directive("reveal", reveal)
  .directive("live", live)
  .directive("outline", outline)
  .directive("field", field)
  .mount("#app");

greet();
