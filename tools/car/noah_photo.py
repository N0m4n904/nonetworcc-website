"""The car as Noah's photo shows it.

How the car stands, and where the camera stood that took the photo.

A reading is a pixel of the photo after its part with the car was enlarged
five times, which is the picture the drawing is laid over while it is made.
"""

from dataclasses import dataclass, replace
from typing import assert_never

import numpy as np
from scipy.optimize import least_squares

from . import body, front, wheels
from .marks import Angular, Brink, Chain, Course, Mark, map_courses, mirror
from .projection import Camera, Point, Pose
from .wheels import Stance

# The photo is square and 640 pixels wide: the whole height of a picture taken
# with the 26 mm lens of a phone, so that lens is 640 pixels long and its axis
# meets the photo in the middle. The enlarged part starts 265 pixels from the
# left of the photo and 380 from its top.
_ENLARGED = 5
_FOCAL_LENGTH = 640.0 * _ENLARGED
_MIDDLE = ((320.0 - 265.0) * _ENLARGED, (320.0 - 380.0) * _ENLARGED)

# 21-inch rims with tyres of size 255/30, which is what the photo suggests:
# the radius of the tyre and of the bright lip of the rim, the width of the
# tread, and how far the outer wall of the tyres is from the middle of the car.
_TYRE_RADIUS = 343.0
_RIM_RADIUS = 284.0
_TYRE_WIDTH = 255.0
_TYRE_WALL = 915.0

# How much lower the body sits than on the car from the factory, found by
# laying the drawing over the photo.
_LOWERED_BY = 35.0

# Which way one blade of the front wheel and one of the rear wheel runs out
# from the hub on the photo, in degrees.
_ROLLED_TO = (43.0, 39.0)


@dataclass(frozen=True)
class RimReading:
    """The outline of the bright lip of a rim on the photo, and where its tyre meets the
    road.
    """

    left: float
    right: float
    top: float
    bottom: float
    road: float


_FRONT_RIM = RimReading(left=659.5, right=886.5, top=456.3, bottom=710.5, road=733.0)
_REAR_RIM = RimReading(left=1423.8, right=1537.3, top=437.7, bottom=649.2, road=668.0)

# Where the photo shows the windscreen meeting the roof, on the left and on
# the right of the car, the rear tip of the side windows and the middle of
# the number plate.
_WINDSCREEN_AT_ROOF = ((1009.0, 157.0), (743.0, 164.0))
_SIDE_WINDOW_TIP = (1487.0, 298.0)
_PLATE_MIDDLE = (226.0, 523.0)

# How far left the photo shows the nose at the height of the number plate.
_NOSE_EDGE = 88.0


def _sight_body() -> list[tuple[np.ndarray, Point]]:
    """Places on the body from the factory, and the pixels that show them."""
    at_roof, _ = front.windscreen_corners()
    left, right = _WINDSCREEN_AT_ROOF
    return [
        (at_roof, left),
        (mirror(at_roof), right),
        (body.side_window_tip(), _SIDE_WINDOW_TIP),
        (front.plate_middle(), _PLATE_MIDDLE),
    ]


def _unpack(values: np.ndarray) -> tuple[Pose, Stance]:
    x, y, z, heading, pitch, roll, axle_height, steered_by = values
    stance = Stance(
        tyre_radius=_TYRE_RADIUS,
        rim_radius=_RIM_RADIUS,
        tyre_width=_TYRE_WIDTH,
        axle_height=axle_height,
        tyre_wall=_TYRE_WALL,
        steered_by=steered_by,
        lowered_by=_LOWERED_BY,
        rolled_to=_ROLLED_TO,
    )
    pose = Pose(
        position=(x, y, z), heading=heading, pitch=pitch, roll=roll, focal=_FOCAL_LENGTH
    )
    return pose, stance


def _miss(values: np.ndarray) -> np.ndarray:
    """By how many pixels a pose of the camera and a stance of the car miss each
    reading.
    """
    pose, stance = _unpack(values)
    camera = photograph(pose)
    misses = []
    for wheel, reading in zip(
        wheels.mount_wheels(stance), (_FRONT_RIM, _REAR_RIM), strict=True
    ):
        lip = camera.project(wheel.ring(stance.rim_radius))
        road = camera.project(
            wheel.locate_at_angle(np.array([stance.axle_height]), np.array([-90.0]))
        )
        misses += [
            lip[:, 0].min() - reading.left,
            lip[:, 0].max() - reading.right,
            lip[:, 1].min() - reading.top,
            lip[:, 1].max() - reading.bottom,
            road[0, 1] - reading.road,
        ]
    for place, pixel in _sight_body():
        misses += list(camera.project(stance.lower(place[np.newaxis]))[0] - pixel)
    misses.append(
        camera.project(stance.lower(front.cross_nose(front.plate_middle()[2])))[
            :, 0
        ].min()
        - _NOSE_EDGE
    )
    return np.asarray(misses)


def find_pose_and_stance() -> tuple[Pose, Stance]:
    """How the camera was held and how the car stands, as fits the readings best."""
    # Seen from the front left, eight metres away at the height of the bonnet.
    start = [
        -5500.0,
        6200.0,
        800.0,
        np.radians(-52.0),
        np.radians(12.0),
        0.0,
        330.0,
        0.3,
    ]
    steps = [1000.0, 1000.0, 300.0, 0.3, 0.1, 0.05, 30.0, 0.2]
    fit = least_squares(_miss, start, x_scale=steps)
    if not fit.success:
        raise ArithmeticError(
            f"No pose of the camera and stance of the car fit: {fit.message}"
        )
    return _unpack(fit.x)


def photograph(pose: Pose) -> Camera:
    """The camera as it took the photo.

    The photo shows the car low on the right, far off the axis of the lens,
    which draws it out in length. A camera turned to face the car from the
    same spot shows it shorter and taller.
    """
    return Camera.hold(pose, _MIDDLE)


def _lower_course(course: Course, stance: Stance) -> Course:
    match course:
        case np.ndarray():
            return stance.lower(course)
        case Angular():
            return Angular(stance.lower(course.places))
        case Brink():
            return replace(course, ribs=tuple(stance.lower(rib) for rib in course.ribs))
        case Chain():
            return Chain(tuple(_lower_course(link, stance) for link in course.links))
        case _:
            assert_never(course)


def lower(mark: Mark, stance: Stance) -> Mark:
    """A mark of the car from the factory, where it is on this car."""
    return map_courses(mark, lambda course: _lower_course(course, stance))
