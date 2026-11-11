"""Reads places on the car off a photo of its side.

The photo shows the right side of a car as it left the factory, on tyres of
size 245/45 R18. A reading is a pixel of that photo. The left side of the car
is taken to be the mirror image of its right side.
"""

import math
from collections.abc import Callable, Sequence

import numpy as np

from .projection import Homography, Point

WHEELBASE = 2818.0

# Tyres of size 245/45 R18: their radius, how high their axle stands under the
# weight of the car, and how far their outer wall is from the middle of the car.
TYRE_RADIUS = 339.0
AXLE_HEIGHT = 322.0
TYRE_WALL = 908.0

# The photo is 1920 by 1440 pixels and was taken with the 26 mm lens of a phone.
FOCAL_LENGTH = 1440.0
MIDDLE = (960.0, 720.0)

# Pixels on the outline of the two tyres, and the places on the plane of the
# tyre walls shown there, as (x, z).
_TYRES = [
    ((1625.1, 1102.7), (0.0, AXLE_HEIGHT)),
    ((1622.5, 959.2), (0.0, AXLE_HEIGHT + TYRE_RADIUS)),
    ((1764.4, 1102.0), (-TYRE_RADIUS, AXLE_HEIGHT)),
    ((1480.6, 1102.0), (TYRE_RADIUS, AXLE_HEIGHT)),
    ((444.1, 1104.7), (WHEELBASE, AXLE_HEIGHT)),
    ((445.8, 954.5), (WHEELBASE, AXLE_HEIGHT + TYRE_RADIUS)),
    ((597.0, 1105.0), (WHEELBASE - TYRE_RADIUS, AXLE_HEIGHT)),
    ((294.5, 1105.0), (WHEELBASE + TYRE_RADIUS, AXLE_HEIGHT)),
]

_PICTURE = Homography.fit(
    [place for _, place in _TYRES], [pixel for pixel, _ in _TYRES]
)
_PLANE = _PICTURE.inverse()
_CAMERA_X, _CAMERA_DISTANCE, _CAMERA_HEIGHT = _PICTURE.find_viewpoint(
    FOCAL_LENGTH, MIDDLE
)

type Surface = Callable[[float, float], float]
"""How far a surface of the car is from its middle, at (x, z)."""

# A sight line has met a surface once a round moves the place where it meets
# by less than this, in millimetres. A pixel of the photo shows more than two
# millimetres of the car.
_MET_WITHIN = 1e-9


def _meet(x: float, z: float, surface: Surface) -> tuple[float, float, float]:
    """Where the sight line through a place on the plane of the tyre walls meets
    `surface`.
    """
    across, step = TYRE_WALL, math.inf
    # A surface behind the plane of the tyre walls is met farther along the
    # sight line, and how far depends on where it is met. Each round closes
    # in on that place.
    while True:
        beyond = (TYRE_WALL - across) / _CAMERA_DISTANCE
        along, up = x + beyond * (x - _CAMERA_X), z + beyond * (z - _CAMERA_HEIGHT)
        met = surface(along, up)
        previous, step = step, abs(met - across)
        if step < _MET_WITHIN:
            return along, met, up
        if step >= previous:
            raise ArithmeticError(
                f"The sight line through ({x}, {z}) on the plane of the tyre walls "
                "does not close in on the surface"
            )
        across = met


def locate(readings: Sequence[Point], surface: Surface) -> np.ndarray:
    """Where points read off the photo are in space, if they lie on `surface`."""
    return np.asarray(
        [_meet(x, z, surface) for x, z in _PLANE(np.asarray(readings, dtype=float))]
    )
