# 🧑‍⚕️ Multi Disease Predictor

A **machine learning-based web application** that predicts the likelihood of multiple diseases such as **Diabetes, Heart Disease, and Breast Cancer**.  

Built with:
- **Backend:** Python (FastAPI), Scikit-learn, Joblib  
- **Frontend:** React (JavaScript)  
- **ML Models:** Trained pipelines with JSON metadata  

---

## 🚀 Features
- Predict multiple diseases using trained ML models  
- REST API built with FastAPI  
- Interactive frontend UI (React)  
- Clean project structure (Backend + Frontend separated)  
- Lightweight & extensible  

---

## 📂 Project Structure
```
multi-disease-predictor/
│
├── backend/               # FastAPI backend
│   ├── app/               # API endpoints
│   ├── data/              # Data scripts
│   ├── models/            # Saved ML models
│   ├── requirements.txt   # Backend dependencies
│   └── train_model.py     # Model training script
│
├── frontend/              # React frontend (UI)
│   └── ...                # Components, pages, etc.
│
└── README.md
```

---

## ⚡ Installation & Setup

### 1️⃣ Backend (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # On Windows
# source .venv/bin/activate   # On Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload
```

By default, backend runs on 👉 `http://127.0.0.1:8000`

---

### 2️⃣ Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm start
```

By default, frontend runs on 👉 `http://localhost:3000`

---

## 🎯 Usage
1. Open the React frontend (`localhost:3000`)  
2. Enter input values (age, bp, glucose, etc.)  
3. Get predictions from backend ML models in real-time  

---

## 🛠 Future Improvements
- Add more diseases (Liver, Kidney, etc.)  
- Deploy backend + frontend online (Render/Heroku/Vercel)  
- Add authentication system  

---

## 👨‍💻 Author
**Anjana**  
🚀 Final Year CSE Student (VTU) | 💡 Web Dev & Machine Learning Enthusiast
