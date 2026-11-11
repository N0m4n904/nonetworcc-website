"""What a drawing of a thing in space is made of."""

from collections.abc import Callable
from dataclasses import dataclass, replace
from enum import Enum, auto

import numpy as np


class Pencil(Enum):
    """A pencil of the page. A member has the name the page has for it, in capitals."""

    FAINT = auto()
    LIGHT = auto()
    PLAIN = auto()
    HEAVY = auto()
    LIT = auto()


class Wash(Enum):
    """What the page fills an area in as.

    A member has the name the page has for it, in capitals.
    """

    PAINT = auto()
    GLASS = auto()
    SHADE = auto()
    METAL = auto()


@dataclass(frozen=True, eq=False)
class Angular:
    """A course that runs straight from place to place, as round the corners of a number
    plate.
    """

    places: np.ndarray


@dataclass(frozen=True, eq=False)
class Brink:
    """Where a rounded surface turns out of sight.

    Where that is depends on where the surface is seen from.

    Each rib is a course across the surface. The brink passes each rib at the
    place the camera sees farthest to the left of the sheet.
    """

    ribs: tuple[np.ndarray, ...]


@dataclass(frozen=True, eq=False)
class Chain:
    """Courses that follow each other as one."""

    links: tuple["Course", ...]


type Course = np.ndarray | Angular | Brink | Chain
"""Where a line runs.

Places in space, in millimetres, stand for the curve through them.
"""


@dataclass(frozen=True, eq=False)
class Line:
    """A line along each course."""

    courses: tuple[Course, ...]
    pencil: Pencil = Pencil.PLAIN
    closed: bool = False


@dataclass(frozen=True, eq=False)
class Hatching:
    """Parallel strokes over the area enclosed by closed courses.

    A course inside another is a hole.
    """

    courses: tuple[Course, ...]
    angle: float
    """In degrees on the sheet, clockwise from level."""
    gap: float
    """Between two strokes, in pixels of the sheet."""
    pencil: Pencil = Pencil.LIGHT


@dataclass(frozen=True, eq=False)
class Tone:
    """A wash over the area enclosed by closed courses.

    A course inside another is a hole.
    """

    courses: tuple[Course, ...]
    wash: Wash


type Mark = Line | Hatching | Tone


def map_courses(mark: Mark, change: Callable[[Course], Course]) -> Mark:
    """The same mark, over each of its courses as `change` returns it."""
    return replace(mark, courses=tuple(change(course) for course in mark.courses))


def trace(*places: tuple[float, float, float]) -> np.ndarray:
    """A course through the places given."""
    return np.asarray(places, dtype=float)


def mirror(course: np.ndarray) -> np.ndarray:
    """The same course on the other side of the car."""
    return course * np.array([1.0, -1.0, 1.0])
