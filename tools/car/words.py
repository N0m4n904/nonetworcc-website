"""What the generator hands the page.

The geometry of a drawing, written as calls of the words of the page.

The page defines its words in src/lib/drawing.js, and src/drawings/car.js
builds the car by calling them as this module writes them. A word the page
does not have, or an argument a word of the page does not take, fails the
build of the page.
"""

import json
from dataclasses import dataclass, fields
from typing import assert_never

from .marks import Pencil, Wash

type Place = tuple[float, float]
"""A place on the sheet, in pixels of the camera."""


@dataclass(frozen=True)
class StraightCall:
    """Straight on from the place reached to each place in turn."""

    places: tuple[Place, ...]


@dataclass(frozen=True)
class SmoothCall:
    """On from the place reached along the curve that bends through every place."""

    places: tuple[Place, ...]


@dataclass(frozen=True)
class CourseCall:
    """A line from `start` along its links, led back to `start` when it is closed."""

    start: Place
    links: tuple[StraightCall | SmoothCall, ...]
    closed: bool


@dataclass(frozen=True)
class LoopCall:
    """A closed curve that bends through every place, the first one included."""

    places: tuple[Place, ...]


type ShapeCall = CourseCall | LoopCall


@dataclass(frozen=True)
class PencilCall:
    """Each shape drawn along with a pencil."""

    pencil: Pencil
    shapes: tuple[ShapeCall, ...]


@dataclass(frozen=True)
class HatchingCall:
    """Parallel strokes over the area the outlines enclose."""

    pencil: Pencil
    angle: float
    gap: float
    outlines: tuple[ShapeCall, ...]


@dataclass(frozen=True)
class ToneCall:
    """A wash over the area the outlines enclose."""

    wash: Wash
    outlines: tuple[ShapeCall, ...]


type MarkCall = PencilCall | HatchingCall | ToneCall


@dataclass(frozen=True, kw_only=True)
class Anchors:
    """Places on the sheet by which the page lays the drawing out."""

    wire: Place
    """Where the wire of the open book crosses the car."""
    desk: Place
    """The lower right corner of the part of the sheet that is empty above the bonnet,
    into which the things on the desk reach.
    """


@dataclass(frozen=True, kw_only=True)
class Geometry:
    """A drawing as the generator computes it."""

    frame: tuple[int, int, int, int]
    """The box that shows every mark: left, top, width and height in pixels of the
    camera.
    """
    anchors: Anchors
    marks: tuple[MarkCall, ...]
    """From what is drawn first to what is drawn last."""


type Written = (
    Geometry
    | Anchors
    | MarkCall
    | ShapeCall
    | StraightCall
    | SmoothCall
    | Pencil
    | Wash
    | tuple[Written, ...]
    | float
)
type Json = dict[str, Json] | list[Json] | str | float


def _spell(name: Pencil | Wash) -> str:
    """A pencil or a wash as the page spells it."""
    return name.name.lower()


def _call(word: str, *arguments: Written) -> list[Json]:
    return [word, *(_to_json(argument) for argument in arguments)]


def _to_json(written: Written) -> Json:
    """A call is a list of its word and its arguments, in the order the word of the page
    takes them.
    """
    match written:
        case Geometry() | Anchors():
            return {
                field.name: _to_json(getattr(written, field.name))
                for field in fields(written)
            }
        case StraightCall(places):
            return _call("straight", *places)
        case SmoothCall(places):
            return _call("smooth", *places)
        case CourseCall(start, links, closed):
            course = _call("course", start, *links)
            return ["closed", course] if closed else course
        case LoopCall(places):
            return _call("loop", *places)
        case PencilCall(pencil, shapes):
            return _call(_spell(pencil), *shapes)
        case HatchingCall(pencil, angle, gap, outlines):
            return _call("hatching", pencil, angle, gap, *outlines)
        case ToneCall(wash, outlines):
            return _call("tone", wash, *outlines)
        case Pencil() | Wash():
            return _spell(written)
        case tuple():
            return [_to_json(item) for item in written]
        case float() | int():
            return written
        case _:
            assert_never(written)


def write(geometry: Geometry) -> str:
    """The geometry as the text of the file src/drawings/car.js reads."""
    return json.dumps(_to_json(geometry), separators=(",", ":")) + "\n"
