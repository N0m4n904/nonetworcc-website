// Stylesheets are in the bundle in the order they are imported here, and of
// two rules of the same specificity the later one applies. What every part
// shares comes first, so that a component can override it in its <style>
// block.
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/book.css";
import "./styles/type.css";
import "./styles/tape.css";
import "./styles/stamp.css";
import "./styles/edge.css";
import "./styles/drawing.css";
import "./styles/motion.css";

import { createApp } from "vue";

import App from "./App.vue";
import drawing from "./directives/drawing.js";
import edge from "./directives/edge.js";
import live from "./directives/live.js";

import { greet } from "./lib/greeting.js";
import { lang, t } from "./lib/language.js";

// After every component: what a phone and what paper get differently
// overrides the styles of all of them.
import "./styles/phone.css";
import "./print.css";

// A screen reader chooses its voice by the language of the document, and the
// browser its hyphenation and quotation marks. The title and the description
// are set for the tab and the bookmark. The tags in the head are in English
// for every visitor, since a crawler does not run this script.
document.documentElement.lang = lang;
document.title = t.documentTitle;
const description = document.querySelector('meta[name="description"]');
if (description) description.setAttribute("content", t.description);

// The three directives are registered for the whole page, since any component
// may show a drawing made by hand, hold it still while it is off screen, or
// end a leaf in a torn or a cut edge.
createApp(App)
  .directive("drawing", drawing)
  .directive("live", live)
  .directive("edge", edge)
  .mount("#app");

greet();
