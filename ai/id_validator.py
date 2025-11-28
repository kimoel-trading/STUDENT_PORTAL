"""
Utility functions for validating uploaded ID photos.

The logic is adapted from the Colab prototype provided by the user but
refactored into reusable helpers that can run on the local server.
"""

from __future__ import annotations

import inspect
import logging
from pathlib import Path
from typing import Dict, List, Tuple

import cv2
import numpy as np
import torch
from torch import nn
from torch.serialization import add_safe_globals
from rembg import remove
from ultralytics import YOLO
from ultralytics.nn import modules as ul_modules
from ultralytics.nn.tasks import DetectionModel


def _collect_safe_classes(module) -> List[Tuple[type, str]]:
    classes = []
    for attr_name in dir(module):
        attr_value = getattr(module, attr_name)
        if inspect.isclass(attr_value):
            qualified_name = f"{attr_value.__module__}.{attr_value.__qualname__}"
            classes.append((attr_value, qualified_name))
    return classes


safe_entries = _collect_safe_classes(ul_modules)
safe_entries += _collect_safe_classes(nn.modules)
safe_entries.append((DetectionModel, f"{DetectionModel.__module__}.{DetectionModel.__qualname__}"))

add_safe_globals(safe_entries)

_original_torch_load = torch.load


def _patched_torch_load(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _original_torch_load(*args, **kwargs)


torch.load = _patched_torch_load


LOGGER = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).resolve().parent
YOLO_MODEL_PATH = ASSETS_DIR / "yolov8n.pt"


def _load_yolo_model() -> YOLO:
    """
    Lazily load the YOLO model once. If the weight file is missing,
    Ultraytics will download it to the default cache automatically.
    """
    LOGGER.info("Loading YOLO model from %s", YOLO_MODEL_PATH)
    return YOLO(str(YOLO_MODEL_PATH))


YOLO_MODEL = _load_yolo_model()
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def _prepare_validation_image(image: np.ndarray, max_side: int = 640) -> np.ndarray:
    """
    Create a downscaled copy of `image` purely for validation to keep the
    original upload untouched while speeding up inference.
    """
    height, width = image.shape[:2]
    longest = max(height, width)
    if longest <= max_side:
        return image.copy()

    scale = max_side / longest
    new_size = (int(width * scale), int(height * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def check_white_background(image: np.ndarray, threshold: float = 0.90) -> Dict:
    """
    Checks whether at least `threshold` percent of the background pixels are
    close to white (RGB > 235). Returns a dict with the status and metrics.
    """
    try:
        output_with_alpha = remove(image)
    except Exception as exc:  # pragma: no cover - defensive
        return {
            "is_valid": False,
            "message": f"Failed to isolate background: {exc}",
            "white_ratio": 0.0,
        }

    if output_with_alpha.shape[-1] < 4:
        return {
            "is_valid": False,
            "message": "Background mask missing alpha channel.",
            "white_ratio": 0.0,
        }

    alpha_channel = output_with_alpha[:, :, 3]
    background_mask = alpha_channel < 10
    original_background = image[background_mask]

    if original_background.size == 0:
        return {
            "is_valid": False,
            "message": "Could not determine the background of the image.",
            "white_ratio": 0.0,
        }

    white_pixels = np.sum(np.all(original_background > 235, axis=1))
    white_ratio = white_pixels / len(original_background)
    is_valid = white_ratio >= threshold

    return {
        "is_valid": bool(is_valid),
        "message": "Background is valid." if is_valid else "Background must be plain white.",
        "white_ratio": float(round(white_ratio, 4)),
    }


def detect_forbidden_objects(image: np.ndarray, conf_threshold: float = 0.25) -> Dict:
    """
    Uses YOLO to detect unwanted objects (cell phones, headphones, etc.) in
    the supplied image. Returns a dict describing the decision.
    """
    forbidden_classes = {"cell phone", "headphone"}
    detected: List[str] = []

    results = YOLO_MODEL(
        image,
        verbose=False,
        conf=conf_threshold,
        device=DEVICE,
    )

    for result in results:
        boxes = getattr(result, "boxes", None)
        if boxes is None or boxes.cls is None:
            continue

        for cls_id in boxes.cls.tolist():
            class_name = YOLO_MODEL.names.get(int(cls_id), "")
            if class_name in forbidden_classes and class_name not in detected:
                detected.append(class_name)

    is_valid = len(detected) == 0
    return {
        "is_valid": bool(is_valid),
        "message": "No forbidden objects detected." if is_valid else f"Forbidden objects detected: {', '.join(detected)}.",
        "detected_objects": detected,
    }


def validate_image_file(image_path: Path) -> Dict:
    """
    Orchestrates all checks for the provided image path and returns a JSON
    serialisable dict summarising the result.
    """
    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    original_image = cv2.imread(str(image_path))
    if original_image is None:
        raise ValueError("Unable to read the provided image file.")

    validation_image = _prepare_validation_image(original_image)

    bg_result = check_white_background(validation_image)
    obj_result = detect_forbidden_objects(validation_image)

    is_valid = bg_result["is_valid"] and obj_result["is_valid"]
    issues = []
    if not bg_result["is_valid"]:
        issues.append(bg_result["message"])
    if not obj_result["is_valid"]:
        issues.append(obj_result["message"])

    return {
        "is_valid": bool(is_valid),
        "messages": issues or ["ID image passed all checks."],
        "details": {
            "background": {
                "white_ratio": bg_result["white_ratio"],
            },
            "objects": {
                "detected": obj_result["detected_objects"],
            },
        },
    }


__all__ = [
    "validate_image_file",
    "check_white_background",
    "detect_forbidden_objects",
]

