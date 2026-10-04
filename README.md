# MedQuery — Healthcare Question & Symptom Guidance Assistant

> **"Describe. Understand. Get Guidance."**  
> An educational healthcare NLP conversational assistant built with Python 3, Flask, Vanilla JavaScript (ES6+), Web Speech API, and Web Audio API.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?style=for-the-badge&logo=github)](https://chiragroshan18.github.io/MedQuery/)
[![Tests](https://img.shields.io/badge/tests-50%20passed-10b981?style=flat-square)](https://github.com/chiragroshan18/MedQuery)
[![Python](https://img.shields.io/badge/python-3.10%2B-0f766e?style=flat-square)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-3.1-0e7490?style=flat-square)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/license-MIT-64748b?style=flat-square)](LICENSE)

---

## 🌐 Live Demonstration

🚀 **Live Interactive App:** [https://chiragroshan18.github.io/MedQuery/](https://chiragroshan18.github.io/MedQuery/)

MedQuery features a **dual-engine architecture**:
1. **Flask REST API (Local/Server):** Full modular Python NLP pipeline with dynamic runtime session state.
2. **Static Browser Engine (`docs/`):** Zero-dependency client-side engine running directly on GitHub Pages with identical triage logic, pictorial charts, voice dictation, and speech synthesis.

---

## 💡 Overview & Purpose

MedQuery analyzes user symptom descriptions and health questions in natural language. It provides structured educational guidance without attempting medical diagnoses:
- **Intent Classification:** Recognizes 10 clinical domains (symptoms, medication, sleep, nutrition, exercise, etc.) with normalized confidence scoring.
- **Symptom Extraction:** Matches single and compound clinical keywords (e.g. *throbbing headache*, *chest pain*, *fatigue*).
- **Conservative Triage Urgency:** Assigns *Routine*, *Needs Attention*, or *Urgent* triage indicators with red-flag emergency advisories.
- **Tone Analysis:** Detects emotional sentiment (*Calm*, *Concerned*, *Frustrated*, *Positive*, *Neutral*).
- **Pictorial Visualizations:** SVG Donut Chart for urgency triage and animated Bar Graphs for intent distribution — 100% computed dynamically from runtime session data.

---

## ⚡ Core Features

| Feature | Description |
| :--- | :--- |
| **Conversational Assistant** | Multi-turn health inquiry assistant with speech dictation (STT) and read-aloud (TTS). |
| **Intent NLP Engine** | Classifies 10 health domains with confidence evaluation and intent breakdown. |
| **Symptom Extraction** | Keyword tokenizer and multi-word clinical entity matching. |
| **Conservative Triage** | Educational triage urgency with immediate emergency alerts for acute symptoms. |
| **Affective Tone Analyzer** | Identifies emotional demeanor to ensure empathetic guidance. |
| **Pictorial Analytics** | Dynamic SVG Donut Chart, intent bar graphs, and active session counters. |
| **Session Management** | Conversation history, detailed NLP inspection modal, reset session, and printable A4 consultation report. |

---

## 🚀 Quick Start (Local Flask App)

### 1. Clone & Setup
```bash
git clone https://github.com/chiragroshan18/MedQuery.git
cd MedQuery
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check and NLP engine status. |
| `/api/chat` | `POST` | Primary chatbot inquiry endpoint (`{"message": "..."}`). |
| `/api/analyze` | `POST` | Non-mutating NLP pipeline inspector endpoint. |
| `/api/dashboard` | `GET` | Returns real-time session analytics and distributions. |
| `/api/conversation` | `GET` | Returns active runtime conversation message history. |
| `/api/conversation/clear` | `POST` | Resets conversation messages and dashboard state to zero. |
| `/api/demo` | `POST` | Restores verified multi-turn clinical sample scenarios. |

---

## 🧪 Automated Testing

MedQuery contains 50 automated tests covering unit, API, integration, and edge cases:
```bash
python -m unittest discover tests
# Ran 50 tests in 0.089s — OK
```
*(All test files, caches, and coverage artifacts are strictly excluded from git tracking via `.gitignore`.)*

---

## ⚠️ Clinical Disclaimer

**MedQuery is an educational health assistant and does not provide medical diagnoses, treatment plans, or prescriptions.** It is designed for educational exploration and health literacy. If you experience severe symptoms, crushing chest pain, or breathing difficulty, immediately contact emergency services (**911 / 112**) or visit the nearest emergency facility.

---

## 📄 License

This project is licensed under the MIT License.
