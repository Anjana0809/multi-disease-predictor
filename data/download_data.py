# backend/data/download_data.py
import os
import requests
import pandas as pd
from io import StringIO
from sklearn.datasets import load_breast_cancer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
os.makedirs(DATA_DIR, exist_ok=True)

diabetes_urls = [
    "https://raw.githubusercontent.com/plotly/datasets/master/diabetes.csv",
    "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
]

heart_urls = [
    "https://raw.githubusercontent.com/ageron/handson-ml2/master/datasets/heart/heart.csv",
    "https://raw.githubusercontent.com/anishathalye/datasets/master/heart.csv"
]

def try_download(urls, out_path, header='infer', colnames=None):
    for url in urls:
        try:
            print("Trying", url)
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            text = r.text
            df = pd.read_csv(StringIO(text), header=header)
            if colnames:
                df.columns = colnames
            df.to_csv(out_path, index=False)
            print("Saved", out_path)
            return True
        except Exception as e:
            print("Failed", url, ":", e)
    print("All attempts failed for", out_path)
    return False

def save_breast_cancer(out_path):
    bc = load_breast_cancer(as_frame=True)
    df = pd.concat([bc.data, bc.target.rename("target")], axis=1)
    df.to_csv(out_path, index=False)
    print("Saved breast cancer dataset to", out_path)

if __name__ == "__main__":
    diabetes_out = os.path.join(DATA_DIR, "diabetes.csv")
    heart_out = os.path.join(DATA_DIR, "heart.csv")
    breast_out = os.path.join(DATA_DIR, "breast_cancer.csv")

    try_download(diabetes_urls, diabetes_out)
    try_download(heart_urls, heart_out)
    save_breast_cancer(breast_out)

    print("Download step completed. Files in:", DATA_DIR)
