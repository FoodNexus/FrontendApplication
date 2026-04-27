"""
NutriFlow — inference HTTP service (ONNX).
Loads waste_or_lr.onnx + label map from ready-models/ (sibling of this folder under ai-model).

Run from the FrontendApplication repo root:
  cd src/app/modules/valorisation-organique-economie-circulaire/ai-model/nutriflow-onnx-api
  py -3 -m pip install -r requirements.txt
  py -3 -m uvicorn main:app --host 0.0.0.0 --port 8096 --reload
"""

from __future__ import annotations

import hashlib
import io
import json
import os
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import onnxruntime as ort
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL = REPO_ROOT / "ready-models" / "waste_or_lr.onnx"
DEFAULT_LABEL_MAP = REPO_ROOT / "ready-models" / "waste_or_lr_label_map.json"

MODEL_PATH = Path(os.environ.get("NUTRIFLOW_ONNX_PATH", str(DEFAULT_MODEL)))
LABEL_MAP_PATH = Path(os.environ.get("NUTRIFLOW_LABEL_MAP_PATH", str(DEFAULT_LABEL_MAP)))

ALLOWED_ORIGINS = os.environ.get(
    "NUTRIFLOW_CORS_ORIGINS",
    "http://localhost:4200,http://127.0.0.1:4200",
).split(",")


def _load_meta() -> dict[str, Any]:
    if not LABEL_MAP_PATH.is_file():
        raise FileNotFoundError(f"Label map not found: {LABEL_MAP_PATH}")
    return json.loads(LABEL_MAP_PATH.read_text(encoding="utf-8"))


def _preprocess(content: bytes, size: int) -> np.ndarray:
    im = Image.open(io.BytesIO(content)).convert("RGB")
    im = im.resize((size, size), Image.Resampling.BILINEAR)
    arr = np.asarray(im, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 1, 3)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 1, 3)
    arr = (arr - mean) / std
    chw = np.transpose(arr, (2, 0, 1))
    return np.expand_dims(chw, 0)


def _softmax(logits: np.ndarray) -> np.ndarray:
    z = logits - np.max(logits)
    e = np.exp(z)
    return e / e.sum()


def _map_filieres(top_folder: str, confidence: float) -> list[dict[str, Any]]:
    """Rule-based hints from O vs R folder id (MVP). Replace with config or second model later."""
    if top_folder.upper() == "O":
        return [
            {
                "code": "METHANISATION",
                "score": round(float(confidence) * 0.95, 4),
                "notes": "Piste typique — flux organique",
            },
            {"code": "COMPOST", "score": round(float(confidence) * 0.88, 4)},
        ]
    return [
        {
            "code": "TRI_SELECTIF",
            "score": round(float(confidence) * 0.92, 4),
            "notes": "Piste typique — matière valorisable",
        },
        {"code": "VALORISATION_MATIERE", "score": round(float(confidence) * 0.78, 4)},
    ]


meta = _load_meta()
img_size = int(meta.get("image_size", 224))
idx_to_class: dict[str, str] = dict(meta.get("index_to_class") or {})

if not MODEL_PATH.is_file():
    raise FileNotFoundError(f"ONNX model not found: {MODEL_PATH}")

_session = ort.InferenceSession(
    str(MODEL_PATH), providers=["CPUExecutionProvider", "CUDAExecutionProvider"]
)
_input_name = _session.get_inputs()[0].name

app = FastAPI(title="NutriFlow ONNX API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": str(MODEL_PATH)}


@app.post("/api/nutriflow/classify-image")
async def classify_image(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Expected an image file (image/*).")
    raw = await file.read()
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(413, "Image too large (max 15 MB).")
    try:
        x = _preprocess(raw, img_size)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, f"Could not decode image: {e}") from e

    digest = hashlib.sha256(raw).hexdigest()
    out = _session.run(None, {_input_name: x})[0]
    logits = np.asarray(out[0], dtype=np.float64)
    probs = _softmax(logits)
    order = np.argsort(-probs)
    n_class = int(probs.shape[0])
    class_labels = [str(idx_to_class.get(str(i), str(i))) for i in range(n_class)]
    categories = [
        {"label": class_labels[i], "score": float(probs[i])}
        for i in order
    ]
    top_i = int(order[0])
    top_label = categories[0]["label"]
    confidence = float(categories[0]["score"])
    filieres = _map_filieres(top_label, confidence)

    return {
        "schemaVersion": "1.0",
        "sourceTextHash": digest,
        "categories": categories,
        "filieres": filieres,
        "confidence": confidence,
        "flags": [],
        "modelVersion": meta.get("backbone", "waste_or_lr") + "@onnx",
    }
