# RecoverLens (v2 Blueprint)
> *"Your recovery, understood — every step of the way."*

RecoverLens is a two-sided clinical decision-support and continuous recovery monitoring platform connecting patients recovering from surgery, injury, or illness with their care teams.

---

## Non-Negotiable Clinical Decision Support Positioning
> **IMPORTANT**: RecoverLens provides recovery **MONITORING and DECISION SUPPORT only**. It never diagnoses, never prescribes treatment, never guarantees a recovery date or outcome, and never replaces a healthcare professional's judgment. A persistent disclaimer is present across every clinical and patient screen.

---

## Core Innovations & Differentiation
1. **Layer 0 Adaptive Question Engine**: Check-ins dynamically adapt per patient and recovery type (only 3–4 high-impact questions), skipping irrelevant queries.
2. **Persistence-Gated Deviation Modeling**: Status states (`On Track` 🟢, `Slightly Behind` 🟡, `Recovering Faster` 🔵, `Significant Deviation` 🔴) require deviations to hold across consecutive check-ins to eliminate single-day physiological noise.
3. **Closed-Loop Feedback Loop**: Every check-in visibly updates the care-team status (`Update Pending` $\rightarrow$ `Reviewed` with personalized clinician instructions).
4. **Voice & Multilingual Native**: Full Web Speech API integration (🔊 text-to-speech reading and 🎙 speech-to-text with patient verification chip) across **English**, **Tamil (தமிழ்)**, and **Hindi (हिन्दी)**.
5. **Explainable Timeline Predictions**: Statistical completion intervals (e.g., "4–5 weeks") with dynamic confidence levels and audit trails explaining *"Why did my prediction change?"*.
6. **Smart Alert Fatigue Suppression**: Unresolved deviations update existing alert persistence counters rather than overwhelming care teams with alert spam.

---

## 3 Pre-Seeded Synthetic Demo Personas
| Persona | Condition | Status | Trajectory Scenario |
|---|---|---|---|
| **Meera Patel** | Knee Replacement (Post-Surgery, Day 24/56) | `On Track` 🟢 | Steady progressive healing, high adherence, pain steadily decreasing, reviewed by Dr. Sharma. |
| **Arjun Varma** | Post-Viral Illness Recovery (Day 12/30) | `Significant Deviation` 🔴 | Rising fatigue (8.5/10) and falling physical activity across 3 consecutive days. Tier-4 Priority Review alert open, Care-Team status: `Update Pending`. Ideal for live check-in demo! |
| **Priya Nair** | Rotator Cuff Injury Rehab (Day 18/42) | `Recovering Faster` 🔵 | Rapid joint range of motion restoration outperforming clinical baseline. Prediction narrowed from 6–8 weeks to 4–5 weeks with explainability log. |
| **Dr. Alok Sharma, MD** | Orthopedic & Rehab Specialist | *Care Team Lead* | Care Team console with triage queue sorted by clinical urgency, alert review modal, and supportive message dispatch. |

---

## Quick Start Instructions

### 1. Backend (FastAPI + Python)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Automated Verification
Run backend unit tests verifying mathematical baseline curves, composite score weighting, persistence gating, and adaptive question algorithms:
```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\python.exe -m pytest tests -p no:cacheprovider
```
