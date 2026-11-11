"""Sees marks in space with a camera and writes them as the geometry of a drawing: clean
lines, which the hand of the page draws over.
"""

from typing import assert_never

import numpy as np

from .marks import Angular, Brink, Chain, Course, Hatching, Line, Mark, Tone
from .projection import Camera
from .words import (
    CourseCall,
    HatchingCall,
    LoopCall,
    MarkCall,
    PencilCall,
    Place,
    ShapeCall,
    SmoothCall,
    StraightCall,
    ToneCall,
)

# Room around the marks for the hand, which runs a little past the end of a line. In
# pixels of the camera.
_MARGIN = 14.0


def write_places(spots: np.ndarray) -> tuple[Place, ...]:
    """Spots on the sheet, to a tenth of a pixel of the camera."""
    return tuple((round(x, 1), round(y, 1)) for x, y in spots.tolist())


def _see(course: Course, camera: Camera) -> np.ndarray:
    """The spots on the sheet a course passes."""
    match course:
        case np.ndarray():
            return camera.project(course)
        case Angular():
            return camera.project(course.places)
        case Brink():
            seen = [camera.project(rib) for rib in course.ribs]
            return np.array([spots[np.argmin(spots[:, 0])] for spots in seen])
        case Chain():
            return np.vstack([_see(link, camera) for link in course.links])
        case _:
            assert_never(course)


def _run_to(spots: np.ndarray) -> StraightCall:
    return StraightCall(write_places(spots))


def _follow(course: Course, camera: Camera) -> tuple[StraightCall | SmoothCall, ...]:
    """The links that follow a course from its first spot to its last."""
    match course:
        case Angular():
            return (_run_to(_see(course, camera)[1:]),)
        case Chain():
            first, *others = course.links
            return _follow(first, camera) + tuple(
                link
                for other in others
                for link in (_run_to(_see(other, camera)[:1]), *_follow(other, camera))
            )
        case np.ndarray() | Brink():
            spots = _see(course, camera)
            places = write_places(spots[1:])
            return (SmoothCall(places) if len(spots) > 2 else StraightCall(places),)
        case _:
            assert_never(course)


def _write_shape(course: Course, camera: Camera, *, closed: bool) -> ShapeCall:
    match course:
        case np.ndarray() if closed and len(course) > 2:
            # A closed curve bends through the spot it starts at as well.
            return LoopCall(write_places(camera.project(course)))
        case _:
            (start,) = write_places(_see(course, camera)[:1])
            return CourseCall(start, _follow(course, camera), closed)


def write_mark(mark: Mark, camera: Camera) -> MarkCall:
    """A mark as a camera sees it."""
    match mark:
        case Line():
            return PencilCall(
                mark.pencil,
                tuple(
                    _write_shape(course, camera, closed=mark.closed)
                    for course in mark.courses
                ),
            )
        case Hatching():
            outlines = tuple(
                _write_shape(course, camera, closed=True) for course in mark.courses
            )
            return HatchingCall(mark.pencil, mark.angle, mark.gap, outlines)
        case Tone():
            return ToneCall(
                mark.wash,
                tuple(
                    _write_shape(course, camera, closed=True) for course in mark.courses
                ),
            )
        case _:
            assert_never(mark)


def frame(marks: list[Mark], camera: Camera) -> tuple[int, int, int, int]:
    """The box that shows every mark: left, top, width and height in whole pixels of the
    camera.
    """
    spots = np.vstack(
        [_see(course, camera) for mark in marks for course in mark.courses]
    )
    left, top = (spots.min(axis=0) - _MARGIN).tolist()
    right, bottom = (spots.max(axis=0) + _MARGIN).tolist()
    return (round(left), round(top), round(right - left), round(bottom - top))
