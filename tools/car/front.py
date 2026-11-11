"""The front of the car as it left the factory.

Its face, its bonnet, its windscreen and its mirror.

The face is written as seen from straight ahead, as (y, z) spots, and laid on
the nose, which is rounded towards the sides and leans back above the bumper.
The spots are read off the photo of Noah: a spot is where the line of sight
through a pixel meets the nose, for the camera that noah_photo.py finds, put back at
the height of the car from the factory.
"""

import numpy as np

from . import body, side_photo
from .body import HALF_WIDTH
from .marks import (
    Angular,
    Brink,
    Chain,
    Hatching,
    Line,
    Mark,
    Pencil,
    Tone,
    Wash,
    mirror,
)

FOREMOST = -898.0

# Seen from above, the nose is a curve that falls back towards the sides.
_CORNER_DEPTH = 330.0
_CORNER_ROUNDNESS = 2.5

# How far the nose leans back at each height.
_LEAN_HEIGHTS = [230.0, 520.0, 800.0]
_LEAN = [30.0, 0.0, 75.0]

type Spot = tuple[float, float]
"""A spot on the face of the car as seen from straight ahead: (y, z)."""


def measure_nose(y: float, z: float) -> float:
    """How far forward the car reaches at a spot of its face."""
    sweep = _CORNER_DEPTH * (abs(y) / HALF_WIDTH) ** _CORNER_ROUNDNESS
    return FOREMOST + sweep + float(np.interp(z, _LEAN_HEIGHTS, _LEAN))


def _on_nose(*spots: Spot, proud: float = 0.0) -> np.ndarray:
    return np.array([(measure_nose(y, z) - proud, y, z) for y, z in spots])


def cross_nose(height: float) -> np.ndarray:
    """The course of the nose at a height, from the right of the car to its left."""
    return _on_nose(*((y, height) for y in np.linspace(-HALF_WIDTH, HALF_WIDTH, 61)))


def _shrink(spots: list[Spot], to: float, around: Spot) -> list[Spot]:
    return [
        (around[0] + (y - around[0]) * to, around[1] + (z - around[1]) * to)
        for y, z in spots
    ]


# The grille is a mesh of honeycombs without a frame of chrome.
_GRILLE = [
    (-398.0, 714.0),
    (398.0, 714.0),
    (519.0, 588.0),
    (436.0, 354.0),
    (-436.0, 354.0),
    (-519.0, 588.0),
]
_GRILLE_MIDDLE = (0.0, 545.0)
_PLATE = [(-260.0, 558.0), (260.0, 558.0), (260.0, 448.0), (-260.0, 448.0)]
_RING_RADIUS = 42.0
_RING_HEIGHT = 650.0
_RING_MIDDLES = [-90.0, -30.0, 30.0, 90.0]

# The strokes that stand for the mesh: their two angles on the sheet and the gap between
# them. They fill the grille to this share of its size, so that they end short of its
# outline.
_MESH_ANGLES = (62.0, -58.0)
_MESH_GAP = 11.0
_MESH_SHARE_OF_GRILLE = 0.93

# How far the number plate and the rings stand proud of the mesh.
_PLATE_PROUD = 10.0
_RINGS_PROUD = 12.0

# A ring is drawn through this many places.
_PLACES_ROUND_RING = 16


def _lay_plate() -> np.ndarray:
    """The corners of the number plate."""
    return _on_nose(*_PLATE, proud=_PLATE_PROUD)


def _draw_grille() -> list[Mark]:
    mesh = _on_nose(*_shrink(_GRILLE, _MESH_SHARE_OF_GRILLE, _GRILLE_MIDDLE))
    plate = _lay_plate()
    turn = np.linspace(0.0, 2 * np.pi, _PLACES_ROUND_RING, endpoint=False)
    rings = [
        Line(
            (
                _on_nose(
                    *(
                        (
                            middle + _RING_RADIUS * np.cos(a),
                            _RING_HEIGHT + _RING_RADIUS * np.sin(a),
                        )
                        for a in turn
                    ),
                    proud=_RINGS_PROUD,
                ),
            ),
            closed=True,
        )
        for middle in _RING_MIDDLES
    ]
    return [
        Tone((Angular(_on_nose(*_GRILLE)),), Wash.SHADE),
        *(
            Hatching(
                (Angular(mesh), Angular(plate)),
                angle=angle,
                gap=_MESH_GAP,
                pencil=Pencil.FAINT,
            )
            for angle in _MESH_ANGLES
        ),
        Line((Angular(_on_nose(*_GRILLE)),), closed=True),
        Tone((Angular(plate),), Wash.PAINT),
        Line((Angular(plate),), closed=True),
        *rings,
    ]


def plate_middle() -> np.ndarray:
    return _lay_plate().mean(axis=0)


# The upper edge of the lens of a head lamp, from its tip beside the grille to the
# corner of the car.
_LENS_TOP = [(512.0, 712.0), (592.0, 733.0), (747.0, 753.0), (892.0, 767.0)]

# The light that is on by day lies this far under that edge: a row of dashes
# from the tip of the lens, and one bar from where they end to the corner.
_DAY_LIGHT_UNDER_EDGE = 9.0
_DASHES_FROM, _DASHES_UNTIL, _DASH_EVERY, _DASH_LENGTH = 548.0, 790.0, 50.0, 32.0
_BAR_FROM, _BAR_UNTIL = _DASHES_UNTIL + 8.0, 884.0


def _draw_lamps() -> list[Mark]:
    # The lens reaches round the corner of the car: its rear tip is read off the side
    # photo.
    lens = np.vstack(
        [
            _on_nose(*_LENS_TOP),
            side_photo.locate([(1785, 907), (1800, 935)], body.measure_flank),
            _on_nose((898.0, 651.0), (834.0, 642.0), (689.0, 646.0), (605.0, 666.0)),
        ]
    )
    across, heights = zip(*_LENS_TOP, strict=True)

    def draw_day_light(start: float, end: float) -> Line:
        return Line(
            (
                _on_nose(
                    *(
                        (
                            y,
                            float(np.interp(y, across, heights))
                            - _DAY_LIGHT_UNDER_EDGE,
                        )
                        for y in (start, end)
                    )
                ),
            ),
            Pencil.LIT,
        )

    dashes = [
        draw_day_light(start, start + _DASH_LENGTH)
        for start in np.arange(_DASHES_FROM, _DASHES_UNTIL, _DASH_EVERY)
    ]
    return [
        Tone((lens,), Wash.GLASS),
        Line((lens,), closed=True),
        *dashes,
        draw_day_light(_BAR_FROM, _BAR_UNTIL),
    ]


# The lower edge of the bumper at the corners of the face and the front edge
# of the bonnet at its corners, read off the photo of Noah. From a corner of
# the face the lower edge runs back to the arch of the wheel, where the side
# photo shows it 2 mm lower (see body.py).
_BUMPER_BOTTOM_AT_CORNER, _BONNET_EDGE = 264.0, 781.0
_BUMPER_UNDERSIDE = [
    (-850.0, _BUMPER_BOTTOM_AT_CORNER),
    (-640.0, 244.0),
    (-442.0, 227.0),
    (0.0, 227.0),
    (442.0, 227.0),
    (640.0, 244.0),
    (850.0, _BUMPER_BOTTOM_AT_CORNER),
]

# Under the grille a plate of polished metal lies across the bumper. Beside it,
# under each head lamp, an inlet opens, and a blade of the same metal lies
# along the floor of the inlet and stands up as a fin at its outer end.
_PLATE_UNDER_GRILLE = [(-430.0, 320.0), (430.0, 320.0), (440.0, 245.0), (-440.0, 245.0)]
_INLET = [(545.0, 505.0), (862.0, 478.0), (868.0, 315.0), (465.0, 317.0)]
_BLADE = [(461.0, 317.0), (866.0, 311.0), (900.0, 253.0), (461.0, 244.0)]
_FIN = [(868.0, 445.0), (882.0, 445.0), (907.0, 303.0), (866.0, 311.0)]

# The strokes that stand for the plate: their angle on the sheet and the gap between
# them.
_BRUSHED_ANGLE, _BRUSHED_GAP = 4.0, 8.0


def underside() -> np.ndarray:
    """The lower edge of the body ahead of the front wheels: round the nose from its
    right side to its left, and back to the arch of the left wheel.
    """
    return np.vstack([_on_nose(*_BUMPER_UNDERSIDE), body.front_arch()[-1]])


def _far_corner() -> Brink:
    """The corner of the bumper on the right of the car, from its lower edge up to the
    bonnet.
    """
    return Brink(
        tuple(
            _on_nose(*((y, height) for y in np.linspace(-HALF_WIDTH, -300.0, 40)))
            for height in np.linspace(_BUMPER_BOTTOM_AT_CORNER, _BONNET_EDGE, 7)
        )
    )


def _draw_bumper() -> list[Mark]:
    inlet, plate, blade, fin = (
        Angular(_on_nose(*spots))
        for spots in (_INLET, _PLATE_UNDER_GRILLE, _BLADE, _FIN)
    )
    return [
        Tone((inlet,), Wash.SHADE),
        Line((inlet,), Pencil.LIGHT, closed=True),
        # The plate lies in the shade of the bumper: strokes along it in place of a
        # wash.
        Hatching((plate,), angle=_BRUSHED_ANGLE, gap=_BRUSHED_GAP),
        Line((plate,), closed=True),
        *(
            mark
            for metal in (blade, fin)
            for mark in (
                Tone((metal,), Wash.METAL),
                Line((metal,), Pencil.LIGHT, closed=True),
            )
        ),
    ]


def windscreen_corners() -> tuple[np.ndarray, np.ndarray]:
    """Where the windscreen meets the roof and where it meets the bonnet, on the left of
    the car.
    """
    pillar = body.windscreen_pillar()
    return pillar[0], pillar[-1]


# The rear edge of the bonnet is higher than the foot of the glass, and highest
# in the middle of the car: by how much. The camera of the photo stood lower
# than that edge, so the glass ends there on the photo, and the bonnet hides
# the pillar on the right of the car below the second height.
_BONNET_OVER_GLASS = 32.0
_FAR_PILLAR_SEEN_ABOVE = 1042.0

# In the middle of the car the rear edge of the bonnet lies this far ahead of
# the foot of a pillar, and the upper edge of the windscreen this far ahead of
# the top of a pillar and this much higher.
_BONNET_EDGE_AHEAD_IN_MIDDLE = 130.0
_HEADER_AHEAD_IN_MIDDLE, _HEADER_HIGHER_IN_MIDDLE = 60.0, 22.0

# Light on the glass: two strokes that lean with the screen. Each runs from one
# place to another, given as the share of the way up from the bonnet to the
# roof and the millimetres in from the left edge of the glass.
_GLINTS = (((0.12, 330.0), (0.78, 180.0)), ((0.1, 430.0), (0.6, 310.0)))


def _keep_above(course: np.ndarray, height: float) -> np.ndarray:
    """The upper part of a course that runs downwards, cut where it comes down to a
    height.
    """
    below = int(np.argmax(course[:, 2] < height))
    before, after = course[below - 1], course[below]
    share = (before[2] - height) / (before[2] - after[2])
    return np.vstack([course[:below], before + share * (after - before)])


def far_pillar() -> np.ndarray:
    """The windscreen pillar on the right of the car, from the roof down to where the
    bonnet hides it.
    """
    return _keep_above(mirror(body.windscreen_pillar()), _FAR_PILLAR_SEEN_ABOVE)


def _header() -> np.ndarray:
    """The upper edge of the windscreen, from the left of the car to its right."""
    top, _ = windscreen_corners()
    middle = (top[0] - _HEADER_AHEAD_IN_MIDDLE, 0.0, top[2] + _HEADER_HIGHER_IN_MIDDLE)
    return np.vstack([top, middle, mirror(top)])


def _draw_windscreen() -> list[Mark]:
    top, foot = windscreen_corners()
    pillar_on_right = far_pillar()
    middle = (foot[0] - _BONNET_EDGE_AHEAD_IN_MIDDLE, 0.0, foot[2] + _BONNET_OVER_GLASS)
    bonnet_edge = np.vstack([foot, middle, pillar_on_right[-1]])

    def find_on_screen(up: float, across: float) -> np.ndarray:
        """A place on the glass: part of the way up from the bonnet to the roof, and
        millimetres in from its left edge.
        """
        return foot + up * (top - foot) - (0.0, across, 0.0)

    glints = [
        Line((np.vstack([find_on_screen(*low), find_on_screen(*high)]),), Pencil.LIGHT)
        for low, high in _GLINTS
    ]
    glass = Chain(
        (body.windscreen_pillar(), bonnet_edge, pillar_on_right[::-1], _header()[::-1])
    )
    return [
        Tone((glass,), Wash.GLASS),
        Line((body.windscreen_pillar(),), Pencil.HEAVY),
        Line((bonnet_edge,)),
        *glints,
    ]


_GRILLE_CORNER = (400.0, 754.0)

# A crease runs back over the bonnet from each upper corner of the grille
# towards the foot of a windscreen pillar. Seen from above it is straight:
# where it would meet the glass, as (x, distance from the middle of the car).
_CREASE_MEETS_GLASS = (600.0, 700.0)

# How high the crease is along the car, as (x, z). The photo of Noah shows the
# crease on the right of the car as the edge of the bonnet, and the heights
# are read off that edge: being straight from above, the crease lies in an
# upright plane, which the line of sight through a pixel meets at one place.
_CREASE_HEIGHTS = [(-670.0, 857.0), (-359.0, 931.0), (-48.0, 981.0), (282.0, 1016.0)]

# The line along which the bonnet shuts on the wing is this far from the
# middle of the car.
_SHUT_LINE_ACROSS = 780.0


def crease_across(x: float) -> float:
    """How far a crease of the bonnet is from the middle of the car, at a place along
    the car.
    """
    start = _on_nose(_GRILLE_CORNER)[0]
    end_x, end_across = _CREASE_MEETS_GLASS
    return float(
        start[1] + (x - start[0]) / (end_x - start[0]) * (end_across - start[1])
    )


def _leading_edge() -> np.ndarray:
    """The front edge of the bonnet over the grille and the lamps, from the right of the
    car to its left.
    """
    return _on_nose(
        (-920.0, _BONNET_EDGE),
        (-587.0, 762.0),
        (-_GRILLE_CORNER[0], _GRILLE_CORNER[1]),
        (0.0, 758.0),
        _GRILLE_CORNER,
        (587.0, 762.0),
        (920.0, _BONNET_EDGE),
    )


def _crease() -> np.ndarray:
    """The crease of the bonnet on the left of the car, from the front towards the
    glass.
    """
    return np.array([(x, crease_across(x), z) for x, z in _CREASE_HEIGHTS])


def _far_edge() -> np.ndarray:
    """The edge of the bonnet on the right of the car, as the camera of the photo saw
    it: from the nose back to the windscreen pillar.
    """
    return np.vstack([_leading_edge()[0], mirror(_crease()), far_pillar()[-1]])


def _draw_bonnet() -> list[Mark]:
    shut = side_photo.locate(
        [
            (1393.5, 854.7),
            (1470, 870.9),
            (1596.5, 880.5),
            (1697.7, 891.9),
            (1773.6, 898.7),
            (1809, 899.4),
        ],
        lambda x, z: _SHUT_LINE_ACROSS,
    )
    crease = _crease()
    # Behind the front axle the crease on the left runs so close under the edge
    # of the glass, as the camera of the photo saw it, that the two would read
    # as one thick line.
    near_crease = np.vstack([_on_nose(_GRILLE_CORNER), crease[crease[:, 0] < 0.0]])
    return [
        Line((_leading_edge(),)),
        Line((shut,), Pencil.LIGHT),
        Line((near_crease,), Pencil.LIGHT),
    ]


# The mirror on the left stands this far from the middle of the car. Its cap is
# polished and its foot lies in the shade of the cap. Both are read off the
# photo of Noah as (x, z): where the line of sight through a pixel comes that
# far from the middle of the car.
_MIRROR_ACROSS = 1010.0
_MIRROR_CAP = [
    (705.0, 1024.0),
    (734.0, 1067.0),
    (804.0, 1095.0),
    (911.0, 1104.0),
    (1010.0, 1087.0),
    (1077.0, 1051.0),
    (1102.0, 1018.0),
    (1019.0, 1009.0),
    (752.0, 1005.0),
]
_MIRROR_FOOT = [(725.0, 1005.0), (1089.0, 1010.0), (1055.0, 980.0), (757.0, 977.0)]


def _draw_mirror() -> list[Mark]:
    cap, foot = (
        np.array([(x, _MIRROR_ACROSS, z) for x, z in spots])
        for spots in (_MIRROR_CAP, _MIRROR_FOOT)
    )
    # The mirror on the right is behind the windscreen pillar for anyone ahead of the
    # car on its left.
    return [
        Tone((Angular(foot),), Wash.SHADE),
        Tone((cap,), Wash.METAL),
        Line((cap,), closed=True),
    ]


def trace_outline() -> Chain:
    """The outer edge of the front of the car, as the camera of the photo saw it.

    From the bumper ahead of the left front wheel under the nose to its right
    side, up the corner of the bumper, back along the edge of the bonnet, up
    the windscreen pillar on the right and across the top of the windscreen.
    """
    return Chain(
        (
            underside()[::-1],
            _far_corner(),
            _far_edge(),
            far_pillar()[::-1],
            _header()[::-1],
        )
    )


def draw_outline() -> list[Mark]:
    """The outer edge of the front of the car."""
    return [
        Line((underside(),), Pencil.HEAVY),
        Line((_far_corner(),), Pencil.HEAVY),
        Line((_far_edge(),), Pencil.HEAVY),
        Line((far_pillar(),), Pencil.HEAVY),
        Line((_header(),), Pencil.HEAVY),
    ]


def draw() -> list[Mark]:
    """What is seen on the front of the car, over its paint."""
    return [
        *_draw_windscreen(),
        *_draw_bonnet(),
        *_draw_bumper(),
        *_draw_grille(),
        *_draw_lamps(),
        *_draw_mirror(),
    ]
