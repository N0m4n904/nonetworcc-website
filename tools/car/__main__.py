"""Writes src/drawings/car.geometry.json: the geometry of the car.

src/drawings/car.js builds the drawing of the car from that file.

Run `npm run car` after changing anything in this package. A rerun writes the
file that is already committed.

`npm run car` needs Nix: it runs this package with the Python, the numpy and
the scipy that flake.lock beside this file locks.
"""

from pathlib import Path

import numpy as np

from . import body, drawing, front, noah_photo, road, wheels, words
from .marks import Chain, Mark, Tone, Wash
from .projection import Camera

_REPOSITORY = Path(__file__).resolve().parents[2]
_OUT = _REPOSITORY / "src" / "drawings" / "car.geometry.json"


def compose(stance: wheels.Stance) -> list[Mark]:
    """The marks of the car, from what is farthest from the camera of the photo to what
    is nearest, so that each wash hides what is behind it.
    """

    def lower(marks: list[Mark]) -> list[Mark]:
        return [noah_photo.lower(mark, stance) for mark in marks]

    under = np.vstack([front.underside(), body.underside(), body.tail_underside()])
    return [
        *road.draw_road(stance),
        road.draw_shade(stance.lower(under)),
        *lower(body.draw_wheel_housings()),
        *wheels.draw_treads(stance),
        *lower(
            [
                *body.draw_roof_rail(),
                Tone(
                    (Chain((body.trace_outline(), front.trace_outline())),), Wash.PAINT
                ),
                *body.draw(),
                *front.draw(),
                *body.draw_outline(),
                *front.draw_outline(),
            ]
        ),
        *wheels.draw(stance),
        *lower(body.draw_over_front_wheel()),
    ]


# The wire of the open book crosses the car this far behind the front edge of
# the front door, at half the height of the door. There it hides neither a
# wheel nor the mirror.
_WIRE_BEHIND_DOOR_EDGE = 70.0

# Left of the windscreen the car is low. Above the bonnet this share of the
# height of the sheet is empty, and the things on the desk of the page reach
# down into it.
_EMPTY_ABOVE_BONNET = 0.2


def anchor(
    stance: wheels.Stance, camera: Camera, frame: tuple[int, int, int, int]
) -> words.Anchors:
    """The places by which the page lays the drawing out."""
    door_edge = body.front_door_edge()
    along, _, height = door_edge[len(door_edge) // 2]
    behind_door_edge = along + _WIRE_BEHIND_DOOR_EDGE
    wire = np.array(
        [behind_door_edge, body.measure_flank(behind_door_edge, height), height]
    )
    # The empty part of the sheet ends on the right where the far pillar
    # rises from the bonnet.
    windscreen = np.vstack([wire, front.far_pillar()[-1]])
    (wire_seen, (pillar_foot_seen, _)) = drawing.write_places(
        camera.project(stance.lower(windscreen))
    )
    _, top, _, sheet_height = frame
    return words.Anchors(
        wire=wire_seen,
        desk=(pillar_foot_seen, top + _EMPTY_ABOVE_BONNET * sheet_height),
    )


def main() -> None:
    pose, stance = noah_photo.find_pose_and_stance()
    camera = noah_photo.photograph(pose)
    marks = compose(stance)
    frame = drawing.frame(marks, camera)
    geometry = words.Geometry(
        frame=frame,
        anchors=anchor(stance, camera, frame),
        marks=tuple(drawing.write_mark(mark, camera) for mark in marks),
    )
    _OUT.write_text(words.write(geometry), encoding="utf-8")
    print(f"{_OUT.relative_to(_REPOSITORY)} written: {len(marks)} marks")


if __name__ == "__main__":
    main()
