"""The body of the car as it left the factory: its side, its glass, its roof and its
tail.
"""

from dataclasses import dataclass

import numpy as np

from . import side_photo
from .marks import Angular, Chain, Hatching, Line, Mark, Pencil, Tone, Wash
from .side_photo import AXLE_HEIGHT, WHEELBASE

HALF_WIDTH = 923.5

# Half the width of the body between the wheels, at each height.
_FLANK_HEIGHTS = [
    200.0,
    320.0,
    500.0,
    680.0,
    900.0,
    1000.0,
    1060.0,
    1400.0,
    1450.0,
    1500.0,
]
_FLANK_WIDTHS = [840.0, 890.0, 912.0, 918.0, 905.0, 866.0, 838.0, 672.0, 640.0, 590.0]

# Seen from above the body narrows towards both ends.
_STRAIGHT_FROM, _STRAIGHT_UNTIL = 200.0, 2400.0
_NARROWER_AT_NOSE, _NARROWER_AT_TAIL = 80.0, 90.0
_NOSE_LENGTH, _TAIL_LENGTH = 900.0, 1300.0

# The edge of the body over a wheel is a round about the axle of the car from
# the factory, and a band of cladding lies round that edge. The edge is a
# little inside the flank.
_ARCH_RADIUS = 372.0
_CLADDING_RADIUS = 445.0
ARCH_ACROSS = HALF_WIDTH - 8
_SILL_TOP = 330.0

# The height at which the edge of an arch ends in the lower edge of a bumper,
# read off the side photo.
_ARCH_MEETS_BUMPER = 262.0

# The lower edge of the sill, from the front wheel to the rear wheel.
_SILL_BOTTOM = [(1435, 1146), (1210, 1141), (910, 1141), (650, 1139)]


def measure_flank(x: float, z: float) -> float:
    """How far the side of the body is from the middle of the car."""
    ahead = max(0.0, _STRAIGHT_FROM - x) / _NOSE_LENGTH
    behind = max(0.0, x - _STRAIGHT_UNTIL) / _TAIL_LENGTH
    narrowing = _NARROWER_AT_NOSE * ahead**2 + _NARROWER_AT_TAIL * behind**2
    return float(np.interp(z, _FLANK_HEIGHTS, _FLANK_WIDTHS)) - narrowing


def _inside_flank(by: float) -> side_photo.Surface:
    return lambda x, z: measure_flank(x, z) - by


def _at(across: float) -> side_photo.Surface:
    return lambda x, z: across


def _on_flank(*readings: tuple[float, float]) -> np.ndarray:
    return side_photo.locate(readings, measure_flank)


@dataclass(frozen=True, kw_only=True)
class Round:
    """A round about an axle of the car from the factory, as seen from the side."""

    axle: float
    """Where its middle is along the car. Its middle is as high as the axle."""
    radius: float


def find_arch_round(axle: float) -> Round:
    """The round that the edge of the body follows over the wheel on an axle."""
    return Round(axle=axle, radius=_ARCH_RADIUS)


def _find_cladding_round(axle: float) -> Round:
    """The round that the outer edge of the cladding follows over a wheel."""
    return Round(axle=axle, radius=_CLADDING_RADIUS)


def _arc(
    about: Round, from_height: float, to_height: float, across: float
) -> np.ndarray:
    """An arc over a wheel, from a height behind the axle over the top to a height ahead
    of it.
    """
    start = np.arcsin((from_height - AXLE_HEIGHT) / about.radius)
    end = np.pi - np.arcsin((to_height - AXLE_HEIGHT) / about.radius)
    angles = np.linspace(start, end, 25)
    return np.column_stack(
        [
            about.axle + about.radius * np.cos(angles),
            np.full_like(angles, across),
            AXLE_HEIGHT + about.radius * np.sin(angles),
        ]
    )


def front_arch() -> np.ndarray:
    """The edge of the body over the front wheel, from the sill over the top to the
    bumper.
    """
    return _arc(
        find_arch_round(0.0),
        _on_flank(_SILL_BOTTOM[0])[0, 2],
        _ARCH_MEETS_BUMPER,
        ARCH_ACROSS,
    )


def rear_arch() -> np.ndarray:
    """The edge of the body over the rear wheel, from the bumper over the top to the
    sill.
    """
    return _arc(
        find_arch_round(WHEELBASE),
        _ARCH_MEETS_BUMPER,
        _on_flank(_SILL_BOTTOM[-1])[0, 2],
        ARCH_ACROSS,
    )


def underside() -> np.ndarray:
    """The lower edge of the body between the wheels, from the arch of the front wheel
    to the arch of the rear wheel.
    """
    return np.vstack([front_arch()[0], _on_flank(*_SILL_BOTTOM), rear_arch()[-1]])


def roof_edge() -> np.ndarray:
    """The edge of the roof over the doors, from the tip of the spoiler to the top of
    the windscreen.
    """
    return _on_flank(
        (300.6, 651),
        (360, 646),
        (444, 640),
        (640, 630),
        (806.5, 626.7),
        (900, 628.5),
        (975, 633),
        (1035, 640.6),
    )


# The tail is rounded towards the middle of the car: the outline of the tail
# on the side photo lies this far inside the flank.
_TAIL_INSIDE_FLANK = 110.0

# The lower edge of the bumper behind the rear wheel, from that wheel back towards the
# tail.
_BUMPER_BOTTOM_BEHIND_WHEEL = [(245, 1120.5), (190, 1113), (140, 1101)]


def _tail_outline() -> np.ndarray:
    """The outline of the tail, from the tip of the spoiler down to the lower edge of
    the bumper.
    """
    return side_photo.locate(
        [
            (300.6, 651),
            (262.6, 700.4),
            (201.9, 746.5),
            (151.3, 779.4),
            (115.9, 800.9),
            (103, 825),
            (108, 891),
            (101, 921),
            (99, 939),
            (88, 952),
            (75, 967),
            (68, 995),
            (66.6, 1012),
            (66.7, 1040),
            (72, 1057),
            (100.6, 1085),
        ],
        _inside_flank(_TAIL_INSIDE_FLANK),
    )


def tail_underside() -> np.ndarray:
    """The lower edge of the body behind the rear wheel, from the arch of that wheel
    back to the tail.
    """
    arch_end, tail_end = rear_arch()[0], _tail_outline()[-1]

    def run_straight(x: float, z: float) -> float:
        # Seen from above the edge runs straight from the arch in towards the tail.
        return float(
            np.interp(x, [arch_end[0], tail_end[0]], [arch_end[1], tail_end[1]])
        )

    return np.vstack(
        [
            arch_end,
            side_photo.locate(_BUMPER_BOTTOM_BEHIND_WHEEL, run_straight),
            tail_end,
        ]
    )


def _round_tail() -> np.ndarray:
    """From the roof round the tail and on under the bumper to the rear wheel."""
    return np.vstack([_tail_outline(), tail_underside()[-2::-1]])


def trace_outline() -> Chain:
    """The outer edge of the body.

    From the top of the windscreen back over the roof, round the tail and
    forward under the car to the bumper ahead of the front wheel.
    """
    return Chain(
        (roof_edge()[::-1], _round_tail(), rear_arch(), underside()[::-1], front_arch())
    )


def _front_cladding() -> np.ndarray:
    """The outer edge of the cladding round the front arch, from the sill over the top
    to the bumper.
    """
    return _arc(_find_cladding_round(0.0), _SILL_TOP, _ARCH_MEETS_BUMPER, HALF_WIDTH)


def _split_at_top(arc: np.ndarray, axle: float) -> tuple[np.ndarray, np.ndarray]:
    """The part of an arc behind its axle and the part ahead of it.

    At the top the two run over each other for one step.
    """
    first_ahead = int(np.argmax(arc[:, 0] < axle))
    return arc[: first_ahead + 1], arc[first_ahead - 1 :]


def draw_outline() -> list[Mark]:
    """The outer edge of the body and the edge of the cladding round each arch, but for
    the front arch ahead of its top.
    """
    front_edge, _ = _split_at_top(front_arch(), 0.0)
    front_cladding, _ = _split_at_top(_front_cladding(), 0.0)
    return [
        Line((roof_edge(),), Pencil.HEAVY),
        Line((_round_tail(),), Pencil.HEAVY),
        Line((rear_arch(),), Pencil.HEAVY),
        Line((underside(),), Pencil.HEAVY),
        Line((front_edge,), Pencil.HEAVY),
        Line((front_cladding,), Pencil.LIGHT),
        Line(
            (
                _arc(
                    _find_cladding_round(WHEELBASE),
                    _ARCH_MEETS_BUMPER,
                    _SILL_TOP,
                    HALF_WIDTH,
                ),
            ),
            Pencil.LIGHT,
        ),
    ]


def draw_over_front_wheel() -> list[Mark]:
    """The cladding of the front arch ahead of its top.

    The front wheel is turned into the arch there, and the cladding hides the tyre.
    """
    _, edge = _split_at_top(front_arch(), 0.0)
    _, cladding = _split_at_top(_front_cladding(), 0.0)
    return [
        Tone((Chain((edge, cladding[::-1])),), Wash.PAINT),
        Line((edge,), Pencil.HEAVY),
        Line((cladding,), Pencil.LIGHT),
    ]


def draw_wheel_housings() -> list[Mark]:
    """The dark inside the two arches, which the wheels stand in."""
    return [Tone((Chain((arch,)),), Wash.SHADE) for arch in (front_arch(), rear_arch())]


# A blade of polished metal lies along the sill. The strokes that stand for
# it: their angle on the sheet and the gap between them.
_BRUSHED_ANGLE, _BRUSHED_GAP = -7.0, 7.0


def _draw_sill() -> list[Mark]:
    blade_top = _on_flank(
        (649, 1138),
        (715, 1111),
        (922, 1112.6),
        (1110.6, 1119),
        (1346, 1127.6),
        (1405, 1141),
    )
    return [
        Hatching(
            (Chain((Angular(blade_top), _on_flank(*_SILL_BOTTOM))),),
            angle=_BRUSHED_ANGLE,
            gap=_BRUSHED_GAP,
        ),
        Line((_on_flank((701, 1099.4), (941, 1104), (1378.8, 1113.5)),), Pencil.LIGHT),
        Line((Angular(blade_top),)),
    ]


def front_door_edge() -> np.ndarray:
    """The front edge of the front door, from the window down to the sill."""
    return _on_flank(
        (1372, 829),
        (1388, 871),
        (1398, 928),
        (1404, 970),
        (1402, 1038),
        (1394, 1085),
        (1384, 1118),
    )


def _draw_doors() -> list[Mark]:
    front_edge = front_door_edge()
    split = _on_flank(
        (922.4, 800), (934, 852), (946, 928), (949.6, 970), (950, 1040), (949, 1104)
    )
    rear_edge = _on_flank(
        (528.8, 794.7),
        (507, 838),
        (502, 862),
        (512, 880),
        (528.8, 897),
        (561.8, 944),
        (594.7, 991),
        (623, 1038),
        (651, 1076),
        (688.8, 1094.7),
        (701, 1099.4),
    )
    # A crease runs along the side under the windows, from the edge of the bonnet to the
    # lamp of the tail.
    shoulder = _on_flank(
        (1393.5, 854.7),
        (1200, 848),
        (1000, 840.5),
        (800, 833),
        (560, 824),
        (400, 818),
        (322, 815),
    )
    crease = _on_flank((649.4, 1061.8), (1000, 1077), (1374, 1094.7))
    # A handle is a bar, and the shade of the recess it lies in shows under it.
    handles = [
        mark
        for bar, recess in (
            (((961.4, 880.6), (1056.5, 883)), ((972, 889.5), (1046, 891.5))),
            (((554.7, 868.8), (655.9, 871.2)), ((565, 877.5), (645, 879.5))),
        )
        for mark in (
            Line((_on_flank(*bar),)),
            Line((_on_flank(*recess),), Pencil.LIGHT),
        )
    ]
    seams = [
        Line((seam,), Pencil.LIGHT)
        for seam in (front_edge, split, rear_edge, shoulder, crease)
    ]
    return [*seams, *handles]


_SIDE_WINDOW_TIP = (284.9, 779.4)


def side_window_tip() -> np.ndarray:
    """Where the side windows end in a tip over the rear wheel."""
    return _on_flank(_SIDE_WINDOW_TIP)[0]


def _draw_glass() -> list[Mark]:
    upper_trim = _on_flank(
        _SIDE_WINDOW_TIP,
        (295.5, 766.7),
        (318.3, 746.5),
        (349.9, 721.2),
        (399.2, 693.4),
        (453.5, 677.0),
        (500.6, 663.9),
        (547.6, 657.3),
        (618.2, 652.6),
        (806.5, 648.8),
        (884.7, 647.6),
        (969.4, 650.0),
        (1040.0, 657.0),
        (1110.6, 677.3),
        (1157.6, 699.4),
        (1204.7, 727.6),
        (1251.8, 758.2),
        (1298.8, 791.2),
        (1340, 813),
        (1364.7, 822),
    )
    lower_trim = _on_flank(
        (284.9, 780.5), (640, 794), (922.4, 804.9), (1228, 816.6), (1364.7, 822)
    )
    # A pillar stands between two windows: its edge towards the rear and its edge
    # towards the front, each from the roof down.
    pillars = [
        (
            _on_flank((870.6, 649.5), (884.7, 801.5)),
            _on_flank((912.9, 648.5), (927.0, 803.5)),
        ),
        (_on_flank((616, 652.6), (528.8, 792)), _on_flank((628, 652.3), (541, 792.5))),
    ]
    return [
        Tone((Chain((upper_trim, Angular(lower_trim[::-1]))),), Wash.GLASS),
        *(
            Tone((Angular(np.vstack([rear_edge, front_edge[::-1]])),), Wash.PAINT)
            for rear_edge, front_edge in pillars
        ),
        *(
            Line((Angular(edge),), Pencil.LIGHT)
            for pillar in pillars
            for edge in pillar
        ),
        Line((upper_trim,)),
        Line((Angular(lower_trim),)),
    ]


# The windscreen is narrower at the roof than at the bonnet: half its width at two
# heights.
_WINDSCREEN_HEIGHTS = [940.0, 1420.0]
_WINDSCREEN_WIDTHS = [790.0, 520.0]


def windscreen_pillar() -> np.ndarray:
    """The edge of the windscreen along its pillar, from the roof down to the bonnet."""
    return side_photo.locate(
        [
            (1035, 640.6),
            (1110.6, 657),
            (1157.6, 675.9),
            (1204.7, 706.5),
            (1251.8, 741.8),
            (1298.8, 777),
            (1345.9, 812),
        ],
        lambda x, z: float(np.interp(z, _WINDSCREEN_HEIGHTS, _WINDSCREEN_WIDTHS)),
    )


# A rail runs along each side of the roof, as far from the middle of the car as this.
_RAIL_ACROSS = 600.0


def draw_roof_rail() -> list[Mark]:
    """The rail on the left of the roof, whose foot the edge of the roof hides."""
    rail_top = side_photo.locate(
        [
            (444, 632),
            (500.6, 619.6),
            (618, 613.5),
            (806.5, 606.5),
            (900, 607.5),
            (975, 618),
            (1033, 640),
        ],
        _at(_RAIL_ACROSS),
    )
    rail_foot = side_photo.locate(
        [(470, 636), (618, 625), (806.5, 618), (900, 619), (990, 631)],
        _at(_RAIL_ACROSS),
    )
    return [Line((rail_top,)), Line((rail_foot,), Pencil.LIGHT)]


def _draw_tail_lamp() -> list[Mark]:
    lamp = side_photo.locate(
        [
            (103, 825),
            (150, 829),
            (197, 834),
            (202, 839),
            (192, 853),
            (161, 881),
            (146, 893),
            (108, 891),
        ],
        _inside_flank(_TAIL_INSIDE_FLANK),
    )
    return [Line((Angular(lamp),), Pencil.LIT, closed=True)]


def draw() -> list[Mark]:
    """What is seen on the body, over its paint."""
    return [*_draw_glass(), *_draw_tail_lamp(), *_draw_sill(), *_draw_doors()]
