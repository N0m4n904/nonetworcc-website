"""The wheels of one car, which differ from car to car: their size, their rims, how they
are turned and how the body sits over them.
"""

from dataclasses import dataclass

import numpy as np

from .body import ARCH_ACROSS, find_arch_round
from .marks import Angular, Line, Mark, Pencil, Tone, Wash
from .side_photo import AXLE_HEIGHT, WHEELBASE

# The rim has five spokes. They are read off the photo of Noah: a place is
# where the line of sight through a pixel meets the plane of the spokes, for
# the camera and the wheels that noah_photo.py finds.
# Each is a blade that runs out from the hub to the rim and grows wider on its
# way. It passes beside the axle, as the blade of a rotor does. A thin branch
# leaves it a distance out along the blade and meets the rim a little farther
# round, at an angle to the blade given in degrees. The spokes lie deeper in
# the wheel at the hub than at the rim.
_SPOKES = 5
_HUB_RADIUS = 46.0
_CAP_RADIUS = 25.0
_BLADE_PASSES_AXLE_BY = 22.0
_BLADE_WIDTH_AT_HUB, _BLADE_WIDTH_AT_RIM = 20.0, 40.0
_BRANCH_LEAVES_AT = 150.0
_BRANCH_MEETS_RIM_AT = -14.0
_BRANCH_WIDTH = 12.0
_DISH = 62.0

# The polished lip of the rim, and the brake disc behind the spokes.
_LIP = 13.0
_DISC_RADIUS, _DISC_DEPTH = 180.0, 100.0

# A tyre is seen up to this far under the edge of its arch.
_UNDER_ARCH = 4.0

_UP = np.array([0.0, 0.0, 1.0])


@dataclass(frozen=True, kw_only=True)
class Stance:
    tyre_radius: float
    rim_radius: float
    tyre_width: float
    """How wide the tread of a tyre is."""
    axle_height: float
    tyre_wall: float
    """How far the outer wall of the tyres is from the middle of the car."""
    steered_by: float
    """How far the front wheels are turned to the right, in radians."""
    lowered_by: float
    """How much lower the body sits than on the car from the factory."""
    rolled_to: tuple[float, float]
    """Which way one blade of the front wheel and one of the rear wheel runs out from
    the hub, in degrees.
    """

    def lower(self, course: np.ndarray) -> np.ndarray:
        """A course on the body from the factory, where it is on this car."""
        return course - (0.0, 0.0, self.lowered_by)


@dataclass(frozen=True, kw_only=True)
class Wheel:
    axle: float
    """Where its axle is along the car."""
    turned_by: float
    rolled_to: float
    stance: Stance

    def along(self) -> np.ndarray:
        """The level direction in the face of the wheel that points to the rear."""
        return np.array([np.cos(self.turned_by), np.sin(self.turned_by), 0.0])

    def inward(self) -> np.ndarray:
        """The direction square to the face of the wheel that points under the car."""
        return np.array([np.sin(self.turned_by), -np.cos(self.turned_by), 0.0])

    def locate(
        self,
        rearward: np.ndarray | float,
        upward: np.ndarray | float,
        depth: np.ndarray | float = 0.0,
    ) -> np.ndarray:
        """Places on the wheel: each a distance to the rear of its axle, a distance
        above it, and a depth inside the outer wall of the tyre.
        """
        rearward, upward, depth = np.broadcast_arrays(
            *(np.asarray(value, dtype=float) for value in (rearward, upward, depth))
        )
        hub = np.array([self.axle, self.stance.tyre_wall, self.stance.axle_height])
        return (
            hub
            + np.outer(rearward, self.along())
            + np.outer(upward, _UP)
            + np.outer(depth, self.inward())
        )

    def locate_at_angle(
        self,
        radius: np.ndarray | float,
        degrees: np.ndarray | float,
        depth: np.ndarray | float = 0.0,
    ) -> np.ndarray:
        """Places on the wheel: each a distance from its axle, at an angle up from the
        level towards the rear, and a depth inside the outer wall of the tyre.
        """
        angles = np.radians(degrees)
        return self.locate(radius * np.cos(angles), radius * np.sin(angles), depth)

    def arc(
        self, radius: float, start: float, end: float, depth: float = 0.0
    ) -> np.ndarray:
        """Part of a round about the axle, from one angle to another."""
        return self.locate_at_angle(
            radius, np.linspace(start, end, 1 + round(abs(end - start) / 10.0)), depth
        )

    def ring(self, radius: float, depth: float = 0.0) -> np.ndarray:
        return self.locate_at_angle(
            radius, np.linspace(0.0, 360.0, 36, endpoint=False), depth
        )


def mount_wheels(stance: Stance) -> tuple[Wheel, Wheel]:
    """The front and the rear wheel on the left of the car."""
    front_rolled_to, rear_rolled_to = stance.rolled_to
    return (
        Wheel(
            axle=0.0,
            turned_by=stance.steered_by,
            rolled_to=front_rolled_to,
            stance=stance,
        ),
        Wheel(axle=WHEELBASE, turned_by=0.0, rolled_to=rear_rolled_to, stance=stance),
    )


def _stand_on_road(course: np.ndarray) -> np.ndarray:
    """The course of a tyre, which is flat where it meets the road."""
    return np.column_stack([course[:, :2], np.maximum(course[:, 2], 0.0)])


def _hold_under_arch(wheel: Wheel, course: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """The course round a tyre as the body leaves it to be seen.

    Returned with which of its places lie behind the body.

    Nothing of a tyre reaches above the edge of its arch, so the course is
    held down along that edge there. Where a wheel is turned out of its arch,
    that part of the tyre stands in front of the body.
    """
    arch = find_arch_round(wheel.axle)
    middle = np.array([arch.axle, AXLE_HEIGHT - wheel.stance.lowered_by])
    offset = course[:, [0, 2]] - middle
    reach = np.hypot(offset[:, 0], offset[:, 1])
    limit = arch.radius - _UNDER_ARCH
    above_edge = reach > limit
    held = middle + offset * np.where(above_edge, limit / reach, 1.0)[:, np.newaxis]
    return np.column_stack([held[:, 0], course[:, 1], held[:, 1]]), above_edge & (
        course[:, 1] <= ARCH_ACROSS
    )


def _draw_spoke(wheel: Wheel, heading: float) -> list[Mark]:
    rim = wheel.stance.rim_radius - _LIP
    out = np.array([np.cos(np.radians(heading)), np.sin(np.radians(heading))])
    aside = np.array([-out[1], out[0]])

    def lay(*spots: tuple[float, float]) -> np.ndarray:
        """Spots given as (out along the blade, aside from it), where they are on the
        wheel.
        """
        flat = np.array([along * out + across * aside for along, across in spots])
        depth = _DISH * (rim - np.hypot(flat[:, 0], flat[:, 1])) / (rim - _HUB_RADIUS)
        return wheel.locate(flat[:, 0], flat[:, 1], depth)

    def meet_rim(across: float) -> tuple[float, float]:
        """Where a line along the blade meets the rim."""
        return float(np.sqrt(rim**2 - across**2)), across

    near, far = (
        _BLADE_PASSES_AXLE_BY + side * _BLADE_WIDTH_AT_RIM / 2 for side in (-1.0, 1.0)
    )
    slim_near, slim_far = (
        _BLADE_PASSES_AXLE_BY + side * _BLADE_WIDTH_AT_HUB / 2 for side in (-1.0, 1.0)
    )
    blade = lay(
        (_HUB_RADIUS / 2, slim_near),
        meet_rim(near),
        meet_rim(far),
        (_HUB_RADIUS / 2, slim_far),
    )

    met = np.radians(
        _BRANCH_MEETS_RIM_AT
        + np.degrees(_BRANCH_WIDTH / (2 * rim)) * np.array([1.0, -1.0])
    )
    branch = lay(
        (_BRANCH_LEAVES_AT + _BRANCH_WIDTH, _BLADE_PASSES_AXLE_BY),
        *((rim * np.cos(angle), rim * np.sin(angle)) for angle in met),
        (_BRANCH_LEAVES_AT - _BRANCH_WIDTH, _BLADE_PASSES_AXLE_BY),
    )
    return [Tone((Angular(blade),), Wash.METAL), Tone((Angular(branch),), Wash.METAL)]


def _draw_tyre(wheel: Wheel) -> tuple[Tone, Line]:
    """The outer wall of a tyre and its outline."""
    # Round from the top, so that what the arch hides lies at both ends of the course.
    round_tyre = wheel.locate_at_angle(
        wheel.stance.tyre_radius, np.linspace(90.0, 450.0, 72, endpoint=False)
    )
    wall, hidden = _hold_under_arch(wheel, _stand_on_road(round_tyre))
    if not hidden.any():
        return Tone((wall,), Wash.SHADE), Line((wall,), Pencil.HEAVY, closed=True)
    seen = np.flatnonzero(~hidden)
    # The outline runs out of the arch and back into it: one place more at each end,
    # round the course.
    outline = np.take(wall, range(seen[0] - 1, seen[-1] + 2), axis=0, mode="wrap")
    return Tone((wall,), Wash.SHADE), Line((outline,), Pencil.HEAVY)


def _draw_face(wheel: Wheel) -> list[Mark]:
    stance = wheel.stance
    wall, outline = _draw_tyre(wheel)
    spokes = [
        mark
        for number in range(_SPOKES)
        for mark in _draw_spoke(wheel, wheel.rolled_to + number * 360.0 / _SPOKES)
    ]
    return [
        wall,
        Line((wheel.ring(_DISC_RADIUS, _DISC_DEPTH),), Pencil.LIGHT, closed=True),
        *spokes,
        Tone((wheel.ring(_HUB_RADIUS + 4, _DISH),), Wash.METAL),
        Tone((wheel.ring(_CAP_RADIUS, _DISH),), Wash.SHADE),
        outline,
        Line((wheel.ring(stance.rim_radius),), closed=True),
        Line((wheel.ring(stance.rim_radius - _LIP),), Pencil.LIGHT, closed=True),
    ]


def _draw_tread(wheel: Wheel) -> list[Mark]:
    radius, width = wheel.stance.tyre_radius, wheel.stance.tyre_width
    # Seen from ahead of the car: the rear half of the outer wall of the tyre
    # and the front half of its inner wall.
    outline = np.vstack(
        [wheel.arc(radius, -90.0, 90.0), wheel.arc(radius, 90.0, 270.0, width)]
    )
    edge = np.vstack(
        [wheel.arc(radius, 180.0, 270.0, width), wheel.locate_at_angle(radius, 270.0)]
    )
    return [
        Tone((_stand_on_road(outline),), Wash.SHADE),
        Line((_stand_on_road(edge),), Pencil.LIGHT),
    ]


def draw_treads(stance: Stance) -> list[Mark]:
    """The tread of each tyre, which the body hides in part."""
    return [mark for wheel in mount_wheels(stance) for mark in _draw_tread(wheel)]


def draw(stance: Stance) -> list[Mark]:
    """The face of each wheel."""
    return [mark for wheel in mount_wheels(stance) for mark in _draw_face(wheel)]
