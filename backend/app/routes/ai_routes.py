from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Patient, CheckIn, CareTeamUpdate, ProfessionalNote, Prediction
from app.schemas import AIAskRequest, AIAskResponse
from app.auth import get_current_user, verify_patient_access
from app.engine.llm_coach import ask_recovery_coach

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/ask", response_model=AIAskResponse)
def ask_coach(
    payload: AIAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(payload.patient_id, current_user, db)

    latest_checkin = db.query(CheckIn).filter(
        CheckIn.patient_id == patient.id
    ).order_by(CheckIn.day_number.desc()).first()

    latest_update = db.query(CareTeamUpdate).filter(
        CareTeamUpdate.patient_id == patient.id
    ).order_by(CareTeamUpdate.sent_at.desc()).first()

    latest_pred = db.query(Prediction).filter(
        Prediction.patient_id == patient.id
    ).order_by(Prediction.version.desc()).first()

    patient_summary = {
        "full_name": patient.user.full_name,
        "condition_name": patient.condition_name,
        "current_day": patient.current_day,
        "expected_duration_days": patient.expected_duration_days,
        "status": patient.status,
        "latest_score": latest_checkin.composite_score if latest_checkin else 70.0,
        "latest_care_team_note": latest_update.message if latest_update else "Continue following your post-discharge instructions.",
        "projected_range": f"{round(latest_pred.projected_days_min/7)}–{round(latest_pred.projected_days_max/7)} weeks" if latest_pred else "4–6 weeks"
    }

    result = ask_recovery_coach(
        patient_data=patient_summary,
        question=payload.question,
        language=payload.language or patient.user.language_preference
    )

    return AIAskResponse(
        answer=result["answer"],
        safety_disclaimer=result["safety_disclaimer"],
        data_sources_used=result["data_sources_used"]
    )
