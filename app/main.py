# backend/app/main.py
import os
import json
from typing import Dict
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(ROOT, "models")

app = FastAPI(title="Multi-Disease Predictor API", version="1.0")

# Enable CORS (so frontend can call this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for dev; tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS = {}
METADATA = {}

def load_models():
    """Load all models + metadata at startup."""
    for fname in os.listdir(MODELS_DIR):
        if fname.endswith("_pipeline.joblib"):
            disease = fname.replace("_pipeline.joblib", "")
            model_path = os.path.join(MODELS_DIR, fname)
            meta_path = os.path.join(MODELS_DIR, f"{disease}_meta.json")

            try:
                MODELS[disease] = joblib.load(model_path)
                if os.path.exists(meta_path):
                    with open(meta_path, "r") as f:
                        METADATA[disease] = json.load(f)
                else:
                    METADATA[disease] = {"features": []}
                print(f"✅ Loaded {disease} model")
            except Exception as e:
                print(f"❌ Failed to load {disease}:", e)

@app.on_event("startup")
def startup_event():
    load_models()

@app.get("/")
def root():
    return {"status": "ok", "available_diseases": list(MODELS.keys())}

@app.get("/schema/{disease}")
def get_schema(disease: str):
    if disease not in METADATA:
        raise HTTPException(status_code=404, detail="Disease model not found")
    return {
        "disease": disease,
        "features": METADATA[disease].get("features", []),
        "feature_importances": METADATA[disease].get("feature_importances", [])
    }

@app.post("/predict/{disease}")
def predict(disease: str, payload: Dict[str, float] = Body(...)):
    if disease not in MODELS:
        raise HTTPException(status_code=404, detail="Disease model not found")

    model = MODELS[disease]
    features = METADATA[disease].get("features", [])
    df = pd.DataFrame([payload])

    # Align columns with training features
    if features:
        df = df.reindex(columns=features)

    if df.isnull().any().any():
        missing = df.columns[df.isnull().any()].tolist()
        raise HTTPException(status_code=400, detail=f"Missing values: {missing}")

    try:
        proba = float(model.predict_proba(df)[:, 1][0])
    except Exception:
        proba = None
    pred = int(model.predict(df)[0])

    return {
        "disease": disease,
        "prediction": pred,
        "probability": proba,
        "note": "1 = disease likely, 0 = not likely"
    }
