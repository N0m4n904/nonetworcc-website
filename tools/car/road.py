"""What a study of a car shows beside the car: the road it stands on, and the shadows on
that road.
"""

import numpy as np

from .marks import Angular, Hatching, Line, Mark, Pencil, trace
from .side_photo import WHEELBASE
from .wheels import Stance

# How far the line of the road runs on past the car, ahead of its front axle and behind
# its rear axle.
_AHEAD, _BEHIND = 1500.0, 1300.0

# The shadow lies on the road beside the car, as wide as this. Along the wall
# of the tyres it runs from ahead of the front axle to behind the rear axle,
# and its outer edge is shorter at both ends.
_SHADOW_WIDTH = 330.0
_SHADOW_AHEAD, _SHADOW_BEHIND = 760.0, 900.0
_SHADOW_EDGE_AHEAD, _SHADOW_EDGE_BEHIND = 640.0, 700.0

# The strokes of every shadow on the road: their angle on the sheet and the gap between
# them.
_SHADOW_ANGLE, _SHADOW_GAP = -32.0, 10.0


def draw_road(stance: Stance) -> list[Mark]:
    road = trace(
        (-_AHEAD, stance.tyre_wall, 0.0), (WHEELBASE + _BEHIND, stance.tyre_wall, 0.0)
    )
    shadow = trace(
        (-_SHADOW_AHEAD, stance.tyre_wall, 0.0),
        (WHEELBASE + _SHADOW_BEHIND, stance.tyre_wall, 0.0),
        (WHEELBASE + _SHADOW_EDGE_BEHIND, stance.tyre_wall + _SHADOW_WIDTH, 0.0),
        (-_SHADOW_EDGE_AHEAD, stance.tyre_wall + _SHADOW_WIDTH, 0.0),
    )
    return [
        Line((road,), Pencil.LIGHT),
        Hatching((Angular(shadow),), angle=_SHADOW_ANGLE, gap=_SHADOW_GAP),
    ]


def draw_shade(under: np.ndarray) -> Hatching:
    """The road under the car, which lies in the dark.

    It is drawn as far as it is seen below the lower edge of the body.

    `under` is that edge from the nose to the tail. The wheels are drawn over
    the shade.
    """
    on_road = under * (1.0, 1.0, 0.0)
    return Hatching(
        (Angular(np.vstack([under, on_road[::-1]])),),
        angle=_SHADOW_ANGLE,
        gap=_SHADOW_GAP,
    )
