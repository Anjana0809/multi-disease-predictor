# backend/train_model.py
import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score

ROOT = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(ROOT, "data")
MODELS_DIR = os.path.join(ROOT, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_save(file_name, target_col, model_name):
    path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(path):
        print(f"❌ {file_name} not found, skipping.")
        return

    df = pd.read_csv(path)

    if target_col not in df.columns:
        print(f"❌ Target column '{target_col}' not found in {file_name}.")
        return

    X = df.drop(columns=[target_col])
    y = df[target_col]

    # Only keep numeric columns
    X = X.select_dtypes(include=["number"])

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Pipeline: impute → scale → classifier
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(n_estimators=200, random_state=42))
    ])

    # Train
    pipeline.fit(X_train, y_train)

    # Evaluate
    preds = pipeline.predict(X_test)
    probs = pipeline.predict_proba(X_test)[:, 1]
    print(f"\n📊 Report for {model_name}")
    print(classification_report(y_test, preds))
    print("ROC AUC:", roc_auc_score(y_test, probs))

    # Save model
    model_path = os.path.join(MODELS_DIR, f"{model_name}_pipeline.joblib")
    joblib.dump(pipeline, model_path)
    print(f"✅ Saved model to {model_path}")

    # Save metadata (features + importances)
    meta = {"features": list(X.columns)}
    importances = pipeline.named_steps["clf"].feature_importances_
    meta["feature_importances"] = sorted(
        zip(X.columns, importances), key=lambda x: x[1], reverse=True
    )[:10]
    with open(os.path.join(MODELS_DIR, f"{model_name}_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print(f"📄 Saved metadata for {model_name}")

if __name__ == "__main__":
    train_and_save("diabetes.csv", "Outcome", "diabetes")
    train_and_save("heart.csv", "target", "heart")
    train_and_save("breast_cancer.csv", "target", "breast_cancer")
