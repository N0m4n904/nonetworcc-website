"""Maps between a photo and the thing it shows.

A flat part of a thing and its picture are related by a homography. A camera
known for one flat part and for a few sightings off that part projects any
point in space.
"""

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np

type Point = tuple[float, float]
type Place = tuple[float, float, float]


def _condition(points: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Moves points to their middle at a mean distance of √2.

    With that the fit is well posed.

    Returns the moved points and the matrix that moved them.
    """
    middle = points.mean(axis=0)
    scale = np.sqrt(2) / np.linalg.norm(points - middle, axis=1).mean()
    matrix = np.array(
        [[scale, 0, -scale * middle[0]], [0, scale, -scale * middle[1]], [0, 0, 1]]
    )
    return (points - middle) * scale, matrix


def _drop_scale(lifted: np.ndarray) -> np.ndarray:
    return lifted[:, :2] / lifted[:, 2:]


def _lift(points: np.ndarray) -> np.ndarray:
    return np.column_stack([points, np.ones(len(points))])


def _build_lens(focal: float, middle: Point) -> np.ndarray:
    """The matrix of a lens.

    `focal` is its focal length in pixels, `middle` the pixel on its axis.
    """
    return np.array([[focal, 0, middle[0]], [0, focal, middle[1]], [0, 0, 1]])


@dataclass(frozen=True)
class Homography:
    """The picture of a plane: where each point of the plane is in the photo."""

    matrix: np.ndarray

    @classmethod
    def fit(cls, on_plane: Sequence[Point], in_photo: Sequence[Point]) -> "Homography":
        sources, condition_sources = _condition(np.asarray(on_plane, dtype=float))
        targets, condition_targets = _condition(np.asarray(in_photo, dtype=float))
        rows = []
        for (x, y), (u, v) in zip(sources, targets, strict=True):
            rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u])
            rows.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
        solution = np.linalg.svd(np.asarray(rows))[2][-1].reshape(3, 3)
        return cls(np.linalg.inv(condition_targets) @ solution @ condition_sources)

    def __call__(self, points: np.ndarray) -> np.ndarray:
        return _drop_scale(_lift(np.asarray(points, dtype=float)) @ self.matrix.T)

    def inverse(self) -> "Homography":
        return Homography(np.linalg.inv(self.matrix))

    def find_viewpoint(self, focal: float, middle: Point) -> Place:
        """Where the camera stood, in the units of the plane.

        Returned as (x, distance from the plane, y).

        `focal` is the focal length of the lens in pixels, `middle` the pixel
        on its axis.
        """
        along, up, origin = (np.linalg.inv(_build_lens(focal, middle)) @ self.matrix).T
        # Both directions of the plane are one unit long in space.
        scale = 2 / (np.linalg.norm(along) + np.linalg.norm(up))
        turned = np.column_stack([along, np.cross(up, along) * scale, up]) * scale
        x, distance, y = -turned.T @ (origin * scale)
        return (x, abs(distance), y)


@dataclass(frozen=True, kw_only=True)
class Pose:
    """Where a camera stands and how it is held. Angles are in radians."""

    position: Place
    heading: float
    """Its direction seen from above, as a turn from the x axis towards the y axis."""
    pitch: float
    """How far it looks up."""
    roll: float
    focal: float
    """The focal length of its lens, in pixels."""


@dataclass(frozen=True)
class Camera:
    """Where each point in space is in a photo.

    Space has the axes of a car: x from its front to its rear, y to its left
    and z up.
    """

    matrix: np.ndarray

    @classmethod
    def hold(cls, pose: Pose, middle: Point) -> "Camera":
        """The camera held in a pose. `middle` is the pixel on the axis of its lens."""
        forward = np.array(
            [
                np.cos(pose.heading) * np.cos(pose.pitch),
                np.sin(pose.heading) * np.cos(pose.pitch),
                np.sin(pose.pitch),
            ]
        )
        up = np.array([0.0, 0.0, 1.0])
        level = np.cross(up, forward)
        level /= np.linalg.norm(level)
        plumb = forward * (up @ forward) - up
        plumb /= np.linalg.norm(plumb)
        right = np.cos(pose.roll) * level + np.sin(pose.roll) * plumb
        down = np.cos(pose.roll) * plumb - np.sin(pose.roll) * level
        turned = np.vstack([right, down, forward])
        lens = _build_lens(pose.focal, middle)
        return cls(
            lens @ np.column_stack([turned, -turned @ np.asarray(pose.position)])
        )

    def project(self, places: np.ndarray) -> np.ndarray:
        return _drop_scale(_lift(np.asarray(places, dtype=float)) @ self.matrix.T)
