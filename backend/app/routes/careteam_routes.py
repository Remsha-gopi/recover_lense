from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Patient, CareTeamMember, Alert, CareTeamUpdate,
    ProfessionalNote, RecoveryGoal, CheckIn, Prediction
)
from app.schemas import (
    CareTeamQueueItem, AlertOut, AlertReviewRequest,
    CareTeamUpdateIn, CareTeamUpdateOut, ProfessionalNoteIn,
    ProfessionalNoteOut, RecoveryGoalIn, RecoveryGoalOut,
    CloseMonitoringRequest
)
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/careteam", tags=["careteam"])

@router.get("/queue", response_model=List[CareTeamQueueItem])
def get_careteam_queue(
    filter: Optional[str] = Query("all"),
    current_user: User = Depends(require_role(["care_team"])),
    db: Session = Depends(get_db)
):
    """
    Patient Queue sorted by clinical urgency:
    Priority Review -> Review Suggested -> Monitor -> On Track
    """
    patients = db.query(Patient).filter(Patient.monitoring_completed == False).all()

    queue_items = []
    urgency_weights = {
        "priority_review": 4,
        "review_suggested": 3,
        "monitor": 2,
        "on_track": 1
    }

    for p in patients:
        # Fetch open alerts
        open_alerts = db.query(Alert).filter(
            Alert.patient_id == p.id,
            Alert.status == "open"
        ).order_by(Alert.created_at.desc()).all()

        # Determine highest urgency tier
        if any(a.tier == "priority_review" for a in open_alerts) or p.status == "significant_deviation":
            urgency = "priority_review"
        elif any(a.tier == "review_suggested" for a in open_alerts) or p.status == "slightly_behind":
            urgency = "review_suggested"
        elif any(a.tier == "monitor" for a in open_alerts):
            urgency = "monitor"
        else:
            urgency = "on_track"

        # Apply filter if provided
        if filter and filter != "all" and urgency != filter:
            continue

        latest_checkin = db.query(CheckIn).filter(
            CheckIn.patient_id == p.id
        ).order_by(CheckIn.day_number.desc()).first()

        total_days = max(p.current_day, 1)
        checkin_count = db.query(CheckIn).filter(CheckIn.patient_id == p.id).count()
        adherence_pct = round(min((checkin_count / total_days) * 100.0, 100.0), 1)

        queue_items.append({
            "item": CareTeamQueueItem(
                patient_id=p.id,
                patient_name=p.user.full_name,
                condition_name=p.condition_name,
                recovery_type=p.recovery_type.code,
                current_day=p.current_day,
                expected_duration_days=p.expected_duration_days,
                status=p.status,
                urgency_tier=urgency,
                care_team_status=p.care_team_status,
                open_alerts=[
                    AlertOut(
                        id=a.id,
                        patient_id=a.patient_id,
                        tier=a.tier,
                        status=a.status,
                        title=a.title,
                        reason=a.reason,
                        persistence_count=a.persistence_count,
                        created_at=a.created_at,
                        reviewed_at=a.reviewed_at,
                        linked_indicator=a.linked_indicator
                    ) for a in open_alerts
                ],
                latest_checkin_time=latest_checkin.timestamp if latest_checkin else None,
                adherence_pct=adherence_pct
            ),
            "urgency_weight": urgency_weights.get(urgency, 1),
            "update_pending": 1 if p.care_team_status == "update_pending" else 0
        })

    # Sort primarily by urgency weight descending, then by update_pending descending
    queue_items.sort(key=lambda x: (x["urgency_weight"], x["update_pending"]), reverse=True)

    return [q["item"] for q in queue_items]

@router.get("/patients/{patient_id}")
def get_careteam_patient_detail(
    patient_id: int,
    current_user: User = Depends(require_role(["care_team"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    checkins = db.query(CheckIn).filter(
        CheckIn.patient_id == patient.id
    ).order_by(CheckIn.day_number.desc()).all()

    alerts = db.query(Alert).filter(
        Alert.patient_id == patient.id
    ).order_by(Alert.created_at.desc()).all()

    updates = db.query(CareTeamUpdate).filter(
        CareTeamUpdate.patient_id == patient.id
    ).order_by(CareTeamUpdate.sent_at.desc()).all()

    notes = db.query(ProfessionalNote).filter(
        ProfessionalNote.patient_id == patient.id
    ).order_by(ProfessionalNote.created_at.desc()).all()

    goals = db.query(RecoveryGoal).filter(
        RecoveryGoal.patient_id == patient.id
    ).order_by(RecoveryGoal.target_day.asc()).all()

    latest_pred = db.query(Prediction).filter(
        Prediction.patient_id == patient.id
    ).order_by(Prediction.version.desc()).first()

    return {
        "patient_id": patient.id,
        "full_name": patient.user.full_name,
        "email": patient.user.email,
        "condition_name": patient.condition_name,
        "recovery_type": patient.recovery_type.code,
        "current_day": patient.current_day,
        "expected_duration_days": patient.expected_duration_days,
        "status": patient.status,
        "care_team_status": patient.care_team_status,
        "monitoring_completed": patient.monitoring_completed,
        "completion_message": patient.completion_message,
        "latest_prediction": {
            "projected_range": f"{round(latest_pred.projected_days_min/7)}–{round(latest_pred.projected_days_max/7)} weeks",
            "confidence": latest_pred.confidence_score,
            "reason": latest_pred.reason
        } if latest_pred else None,
        "alerts": [
            AlertOut(
                id=a.id,
                patient_id=a.patient_id,
                tier=a.tier,
                status=a.status,
                title=a.title,
                reason=a.reason,
                persistence_count=a.persistence_count,
                created_at=a.created_at,
                reviewed_at=a.reviewed_at,
                linked_indicator=a.linked_indicator
            ) for a in alerts
        ],
        "checkin_history": [
            {
                "id": c.id,
                "day": c.day_number,
                "score": c.composite_score,
                "timestamp": c.timestamp,
                "note": c.free_note,
                "measurements": {m.indicator_key: m.value for m in c.measurements}
            } for c in checkins
        ],
        "updates": [
            {
                "id": u.id,
                "message": u.message,
                "sent_at": u.sent_at,
                "author": u.author.title if u.author else "Care Team"
            } for u in updates
        ],
        "notes": [
            {
                "id": n.id,
                "note_text": n.note_text,
                "is_patient_visible": n.is_patient_visible,
                "created_at": n.created_at,
                "author": n.author.title if n.author else "Clinician"
            } for n in notes
        ],
        "goals": [
            {
                "id": g.id,
                "title": g.title,
                "target_day": g.target_day,
                "status": g.status
            } for g in goals
        ]
    }

@router.post("/patients/{patient_id}/alerts/{alert_id}/review")
def review_alert(
    patient_id: int,
    alert_id: int,
    payload: AlertReviewRequest,
    current_user: User = Depends(require_role(["care_team"])),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.patient_id == patient_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    member = current_user.care_team_profile
    member_id = member.id if member else None

    alert.status = payload.action  # "reviewed" or "escalate"
    alert.reviewed_at = datetime.utcnow()
    alert.reviewed_by_id = member_id

    # If supportive message provided, send it
    if payload.send_update_message:
        update = CareTeamUpdate(
            patient_id=patient_id,
            care_team_member_id=member_id,
            message=payload.send_update_message,
            sent_at=datetime.utcnow()
        )
        db.add(update)
        # Clear update pending
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            patient.care_team_status = "reviewed"

    db.commit()
    return {"status": "success", "alert_status": alert.status}

@router.post("/patients/{patient_id}/updates", response_model=CareTeamUpdateOut)
def send_patient_update(
    patient_id: int,
    payload: CareTeamUpdateIn,
    current_user: User = Depends(require_role(["care_team"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    member = current_user.care_team_profile
    member_id = member.id if member else None

    update = CareTeamUpdate(
        patient_id=patient.id,
        care_team_member_id=member_id,
        message=payload.message,
        sent_at=datetime.utcnow()
    )
    db.add(update)

    # Immediately flips care-team status to "reviewed"
    patient.care_team_status = "reviewed"
    db.commit()
    db.refresh(update)

    return CareTeamUpdateOut(
        id=update.id,
        author_name=member.title if member else "Care Team",
        message=update.message,
        sent_at=update.sent_at,
        read_by_patient=False
    )

@router.post("/patients/{patient_id}/notes", response_model=ProfessionalNoteOut)
def add_professional_note(
    patient_id: int,
    payload: ProfessionalNoteIn,
    current_user: User = Depends(require_role(["care_team"])),
    db: Session = Depends(get_db)
):
    member = current_user.care_team_profile
    member_id = member.id if member else None

    note = ProfessionalNote(
        patient_id=patient_id,
        author_id=member_id,
        note_text=payload.note_text,
        is_patient_visible=payload.is_patient_visible,
        created_at=datetime.utcnow()
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return ProfessionalNoteOut(
        id=note.id,
        author_name=member.title if member else "Clinician",
        note_text=note.note_text,
        is_patient_visible=note.is_patient_visible,
        created_at=note.created_at
    )

@router.post("/patients/{patient_id}/goals", response_model=RecoveryGoalOut)
def add_recovery_goal(
    patient_id: int,
    payload: RecoveryGoalIn,
    current_user: User = Depends(require_role(["care_team"])),
    db: Session = Depends(get_db)
):
    goal = RecoveryGoal(
        patient_id=patient_id,
        title=payload.title,
        target_day=payload.target_day,
        status="active",
        created_at=datetime.utcnow()
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return RecoveryGoalOut(
        id=goal.id,
        title=goal.title,
        target_day=goal.target_day,
        status=goal.status,
        created_at=goal.created_at
    )

@router.post("/patients/{patient_id}/complete-monitoring")
def complete_monitoring(
    patient_id: int,
    payload: CloseMonitoringRequest,
    current_user: User = Depends(require_role(["care_team"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.monitoring_completed = True
    patient.completion_message = payload.completion_message
    patient.care_team_status = "reviewed"
    db.commit()

    return {"status": "success", "message": "Recovery monitoring marked complete"}
