// Drawing on the page.
//
// The page looks drawn by hand, and a visitor can pick up the pencil as well.
// The strokes are stored in the browser that made them and are sent nowhere.
//
// While the pencil lies on the page the sheet is inert: a press goes through
// it to whatever is beneath.

import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

import { PENCIL_KEY } from "../lib/pencil-key.js";

// The strokes are stored under this name as a list of path data, in the
// coordinates of the page.
const STORE = "scribbleV1";
// Points closer together than this add nothing a reader could see.
const LEAST_MOVE = 2.4;

// Clearing the page is a step like a stroke, so that undo takes it back.
const CLEARED = Symbol("cleared");

// A browser that blocks its store throws a DOMException, and an entry that is
// no JSON a SyntaxError. The page then starts without strokes.
function readStoredStrokes() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE) ?? "[]");
    return Array.isArray(stored) ? stored.filter((d) => typeof d === "string") : [];
  } catch (error) {
    if (error instanceof DOMException || error instanceof SyntaxError) return [];
    throw error;
  }
}

// A store that is full or blocked throws a DOMException. The strokes are then
// on the page for this visit, and the store has what it had.
function storeStrokes(strokes) {
  try {
    localStorage.setItem(STORE, JSON.stringify(strokes));
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}

// A stroke as a smooth line through its points. Straight segments would meet
// at corners a reader can see.
function toPath(points) {
  // A tap is a dot: a line without a length is drawn as one by its round cap.
  if (points.length < 2) return `M${points[0][0]} ${points[0][1]}l0 0`;
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nextX, nextY] = points[i + 1];
    d += `Q${x} ${y} ${(x + nextX) / 2} ${(y + nextY) / 2}`;
  }
  const [lastX, lastY] = points.at(-1);
  return `${d}L${lastX} ${lastY}`;
}

// Where on the page a pointer is, to a tenth of a pixel. A stroke is stored
// in the coordinates of the page, so it scrolls with what it was drawn on.
const readPagePlace = (event) => [
  Math.round((event.pageX + Number.EPSILON) * 10) / 10,
  Math.round((event.pageY + Number.EPSILON) * 10) / 10,
];

export function useScribble() {
  const inHand = ref(false);
  // What was done to the page, oldest first: a stroke as path data, or
  // CLEARED. Undo takes the last step back.
  const steps = ref(readStoredStrokes());
  const strokes = computed(() => steps.value.slice(steps.value.lastIndexOf(CLEARED) + 1));
  const strokeInProgress = ref(null);

  let pointer = null;
  let points = [];

  const canUndo = computed(() => steps.value.length > 0);
  const canClear = computed(() => strokes.value.length > 0);

  watch(strokes, storeStrokes);

  function abandonStroke() {
    pointer = null;
    points = [];
    strokeInProgress.value = null;
  }

  function startStroke(event) {
    if (!event.isPrimary) return;
    pointer = event.pointerId;
    event.currentTarget.setPointerCapture(pointer);
    points = [readPagePlace(event)];
    strokeInProgress.value = toPath(points);
  }

  function extendStroke(event) {
    if (event.pointerId !== pointer) return;
    const place = readPagePlace(event);
    const [lastX, lastY] = points.at(-1);
    if (Math.abs(place[0] - lastX) + Math.abs(place[1] - lastY) < LEAST_MOVE) return;
    points.push(place);
    strokeInProgress.value = toPath(points);
  }

  function endStroke(event) {
    if (event.pointerId !== pointer) return;
    steps.value = [...steps.value, toPath(points)];
    abandonStroke();
  }

  function undo() {
    steps.value = steps.value.slice(0, -1);
  }

  function clear() {
    steps.value = [...steps.value, CLEARED];
  }

  function pickUpOrPutDown() {
    inHand.value = !inHand.value;
  }

  function putDown() {
    inHand.value = false;
  }

  // The key does what the tab of the pencil does. Escape puts the pencil
  // down as well, as it closes everything else.
  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    // A key typed into a field is text.
    const focused = document.activeElement;
    if (focused && (focused.isContentEditable || /^(input|textarea|select)$/i.test(focused.tagName))) return;

    if (event.key.toUpperCase() === PENCIL_KEY) {
      event.preventDefault();
      pickUpOrPutDown();
    } else if (event.key === "Escape" && inHand.value) {
      event.preventDefault();
      putDown();
    }
  }

  onMounted(() => window.addEventListener("keydown", onKey));
  onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

  // A stroke that is being drawn while the pencil is put down is dropped.
  watch(inHand, (held) => {
    if (!held) abandonStroke();
  });

  return {
    inHand,
    strokes,
    strokeInProgress,
    canUndo,
    canClear,
    pickUpOrPutDown,
    putDown,
    undo,
    clear,
    startStroke,
    extendStroke,
    endStroke,
  };
}
