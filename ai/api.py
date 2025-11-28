"""
FastAPI service that exposes the ID validation logic via HTTP.
Run with:
    uvicorn ai.api:app --host 127.0.0.1 --port 5001
"""

from __future__ import annotations

import base64
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .attachment_analyzer import analyze_file
from .id_validator import validate_image_file


class ImagePayload(BaseModel):
    image: str  # Base64 string, with or without data URI prefix


class AttachmentPayload(BaseModel):
    filename: str
    content_type: str
    document_type: str | None = None
    data: str  # Base64 body


app = FastAPI(title="ID Validator Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck():
    return {"status": "ok"}


@app.post("/verify")
def verify_image(payload: ImagePayload):
    raw = payload.image.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Image payload is required.")

    # Allow data URLs (e.g., data:image/png;base64,...)
    if "," in raw:
        _, _, raw = raw.partition(",")

    try:
        image_bytes = base64.b64decode(raw)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail=f"Invalid Base64 data: {exc}") from exc

    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        tmp.write(image_bytes)
        tmp_path = Path(tmp.name)

    try:
        result = validate_image_file(tmp_path)
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    return result


@app.post("/attachments/analyze")
def analyze_attachment(payload: AttachmentPayload):
    raw = payload.data.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="File payload is required.")

    if "," in raw:
        _, _, raw = raw.partition(",")

    try:
        file_bytes = base64.b64decode(raw)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail=f"Invalid Base64 data: {exc}") from exc

    suffix = Path(payload.filename).suffix or {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(payload.content_type, "")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = Path(tmp.name)

    try:
        result = analyze_file(tmp_path, document_type=payload.document_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    return result

