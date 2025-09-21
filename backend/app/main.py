# backend/app/main.py
import os
import json
import logging
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import joblib
import pandas as pd

# --------------------------
# Configuration / Constants
# --------------------------
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(ROOT, "models")
# Environment variable name that can contain comma-separated allowed origins.
# Example value: "https://your-netlify-site.netlify.app,http://localhost:5173"
FRONTEND_ORIGINS_ENV = "FRONTEND_ORIGINS"

# --------------------------
# Logging
# --------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("multi-disease-predictor")

# --------------------------
# App initialization
# --------------------------
app = FastAPI(title="Multi-Disease Predictor API", version="1.0")

# Build list of allowed origins for CORS from environment or sensible defaults
def get_allowed_origins() -> List[str]:
    env_val = os.getenv(FRONTEND_ORIGINS_ENV, "").strip()
    if env_val:
        # split by comma and strip whitespace
        origins = [o.strip() for o in env_val.split(",") if o.strip()]
        logger.info("Using FRONTEND_ORIGINS from environment: %s", origins)
        return origins
    # sensible defaults for local dev + example netlify (replace later)
    defaults = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # CRA dev server
    ]
    logger.info("No FRONTEND_ORIGINS set; using defaults: %s", defaults)
    return defaults

_allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# Models and metadata stores
# --------------------------
MODELS: Dict[str, object] = {}
METADATA: Dict[str, Dict] = {}

def load_models_and_metadata(models_dir: str = MODELS_DIR) -> None:
    """Load all model pipeline joblib files and metadata JSONs from models_dir."""
    if not os.path.isdir(models_dir):
        logger.warning("Models directory does not exist: %s", models_dir)
        return

    for fname in os.listdir(models_dir):
        if fname.endswith("_pipeline.joblib"):
            disease = fname.replace("_pipeline.joblib", "")
            model_path = os.path.join(models_dir, fname)
            meta_path = os.path.join(models_dir, f"{disease}_meta.json")
            try:
                model = joblib.load(model_path)
                MODELS[disease] = model
                if os.path.exists(meta_path):
                    with open(meta_path, "r", encoding="utf-8") as f:
                        METADATA[disease] = json.load(f)
                else:
                    METADATA[disease] = {"features": []}
                logger.info("Loaded model for '%s' from %s", disease, model_path)
            except Exception as exc:
                logger.exception("Failed to load model '%s' from %s: %s", disease, model_path, exc)

# Load at startup
@app.on_event("startup")
def startup_event():
    logger.info("Starting Multi-Disease Predictor service...")
    load_models_and_metadata()

# --------------------------
# Error handlers
# --------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# --------------------------
# Health + Info endpoints
# --------------------------
@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(MODELS.keys())}

@app.get("/")
def root():
    return {"status": "ok", "available_diseases": list(MODELS.keys())}

# --------------------------
# Schema endpoint
# --------------------------
@app.get("/schema/{disease}")
def get_schema(disease: str):
    if disease not in METADATA:
        raise HTTPException(status_code=404, detail="Disease model not found")
    metadata = METADATA[disease]
    return {
        "disease": disease,
        "features": metadata.get("features", []),
        "feature_importances": metadata.get("feature_importances", []),
    }

# --------------------------
# Predict endpoint
# --------------------------
@app.post("/predict/{disease}")
def predict(disease: str, payload: Dict[str, float] = Body(...)):
    """
    Expects JSON body with numerical features matching the model metadata features.
    Example request body:
    {
      "age": 45,
      "glucose": 120,
      ...
    }
    """
    if disease not in MODELS:
        raise HTTPException(status_code=404, detail="Disease model not found")

    model = MODELS[disease]
    metadata = METADATA.get(disease, {})
    features = metadata.get("features", [])

    # Build DataFrame from payload
    try:
        df = pd.DataFrame([payload])
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {exc}")

    # Align to expected feature order (if metadata contains features)
    if features:
        df = df.reindex(columns=features)

    # Check for missing values
    if df.isnull().any().any():
        missing = df.columns[df.isnull().any()].tolist()
        raise HTTPException(status_code=400, detail=f"Missing values: {missing}")

    # Run prediction and probability (if supported)
    try:
        # Some models may not implement predict_proba; handle gracefully
        proba: Optional[float] = None
        if hasattr(model, "predict_proba"):
            proba = float(model.predict_proba(df)[:, 1][0])
        pred = int(model.predict(df)[0])
    except Exception as exc:
        logger.exception("Prediction failed for disease=%s with payload=%s: %s", disease, payload, exc)
        raise HTTPException(status_code=500, detail="Model prediction failed")

    return {
        "disease": disease,
        "prediction": pred,
        "probability": proba,
        "note": "1 = disease likely, 0 = not likely"
    }
