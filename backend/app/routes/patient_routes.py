from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Patient, CheckIn, RecoveryMeasurement, Alert, CareTeamUpdate,
    ProfessionalNote, Prediction, RecoveryGoal
)
from app.schemas import (
    PatientHomeResponse, CheckInNextQuestionResponse, CheckInSubmitRequest,
    CheckInCompleteResponse, TrajectoryResponse, TrajectoryPoint,
    PredictionOut, AlertOut, CareTeamUpdateOut, ProfessionalNoteOut,
    RecoveryGoalOut
)
from app.auth import get_current_user, verify_patient_access
from app.engine.baseline import generate_trajectory_curve, calculate_expected_score
from app.engine.trend_analysis import (
    calculate_composite_score, compute_momentum, compute_what_changed
)
from app.engine.deviation import detect_deviation_state
from app.engine.prediction import calculate_prediction
from app.engine.alerts import evaluate_and_update_alerts
from app.engine.adaptive_questions import get_next_question
from app.engine.explainability import compute_recovery_fingerprint, generate_attribution_explanation

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/{patient_id}/home", response_model=PatientHomeResponse)
def get_patient_home(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)

    # 1. Gather all check-ins ordered by day
    checkins = db.query(CheckIn).filter(CheckIn.patient_id == patient.id).order_by(CheckIn.day_number.asc()).all()
    scores = [c.composite_score for c in checkins if c.composite_score is not None]
    checkin_days = [c.day_number for c in checkins]

    # 2. Compute momentum
    momentum = compute_momentum(scores, checkin_days)

    # 3. Compute What Changed (latest vs previous check-in)
    current_m = {}
    prev_m = {}
    if len(checkins) >= 1:
        latest_c = checkins[-1]
        for m in latest_c.measurements:
            current_m[m.indicator_key] = m.value
    if len(checkins) >= 2:
        penultimate_c = checkins[-2]
        for m in penultimate_c.measurements:
            prev_m[m.indicator_key] = m.value
    
    what_changed = compute_what_changed(current_m, prev_m if prev_m else current_m)

    # 4. Mini trajectory (latest 7 days or sample curve)
    full_curve = generate_trajectory_curve(patient.expected_duration_days, patient.recovery_type.code, patient.baseline_severity)
    checkin_map = {c.day_number: c for c in checkins}
    
    mini_points = []
    # Take every 2nd or 3rd day up to expected duration, plus all check-in days
    sample_days = sorted(set(list(range(1, patient.expected_duration_days + 1, 3)) + checkin_days))
    for d in sample_days:
        if d <= patient.expected_duration_days:
            c = checkin_map.get(d)
            exp = calculate_expected_score(d, patient.expected_duration_days, patient.recovery_type.code, patient.baseline_severity)
            mini_points.append(TrajectoryPoint(
                day=d,
                expected_score=exp,
                actual_score=c.composite_score if c else None,
                has_checkin=c is not None
            ))

    # 5. Latest care-team update
    latest_update = db.query(CareTeamUpdate).filter(
        CareTeamUpdate.patient_id == patient.id
    ).order_by(CareTeamUpdate.sent_at.desc()).first()

    # 6. Open alerts count
    open_alerts_count = db.query(Alert).filter(
        Alert.patient_id == patient.id,
        Alert.status == "open"
    ).count()

    # 7. Latest prediction
    latest_pred = db.query(Prediction).filter(
        Prediction.patient_id == patient.id
    ).order_by(Prediction.version.desc()).first()

    projected_str = f"{round(latest_pred.projected_days_min/7)}–{round(latest_pred.projected_days_max/7)} weeks" if latest_pred else "4–6 weeks"
    confidence = latest_pred.confidence_score if latest_pred else 75.0

    return PatientHomeResponse(
        patient_id=patient.id,
        full_name=patient.user.full_name,
        condition_name=patient.condition_name,
        recovery_type=patient.recovery_type.code,
        current_day=patient.current_day,
        expected_duration_days=patient.expected_duration_days,
        status=patient.status,
        care_team_status=patient.care_team_status,
        monitoring_completed=patient.monitoring_completed,
        completion_message=patient.completion_message,
        momentum=momentum,
        what_changed=what_changed,
        mini_trajectory=mini_points,
        latest_care_team_update=latest_update.message if latest_update else None,
        open_alerts_count=open_alerts_count,
        confidence_score=confidence,
        projected_range=projected_str
    )

@router.get("/{patient_id}/checkin/next-question", response_model=CheckInNextQuestionResponse)
def get_checkin_next_question(
    patient_id: int,
    answered: Optional[str] = Query(None, description="Comma-separated list of answered keys"),
    lang: Optional[str] = Query("en"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)
    answered_keys = [k.strip() for k in answered.split(",")] if answered else []
    
    result = get_next_question(
        recovery_type_code=patient.recovery_type.code,
        answered_keys=answered_keys,
        language=lang or patient.user.language_preference
    )
    return result

@router.post("/{patient_id}/checkin/submit", response_model=CheckInCompleteResponse)
def submit_checkin(
    patient_id: int,
    payload: CheckInSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)

    # 1. Compute composite recovery score
    comp_score = calculate_composite_score(payload.measurements, patient.recovery_type.code)

    # Increment current_day if check-in is for a new day
    next_day = patient.current_day + 1
    patient.current_day = next_day

    # 2. Record CheckIn
    new_checkin = CheckIn(
        patient_id=patient.id,
        timestamp=datetime.utcnow(),
        day_number=next_day,
        language_used=payload.language_used,
        completed=True,
        free_note=payload.free_note,
        composite_score=comp_score
    )
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)

    for k, val in payload.measurements.items():
        db.add(RecoveryMeasurement(
            checkin_id=new_checkin.id,
            indicator_key=k,
            value=val
        ))
    db.commit()

    # 3. Re-evaluate trajectory & persistence-gated deviation
    all_checkins = db.query(CheckIn).filter(CheckIn.patient_id == patient.id).order_by(CheckIn.day_number.asc()).all()
    checkin_history = [{"day_number": c.day_number, "composite_score": c.composite_score} for c in all_checkins]

    status_state, latest_delta, consecutive_count, explanation = detect_deviation_state(
        checkin_history=checkin_history,
        total_days=patient.expected_duration_days,
        recovery_type_code=patient.recovery_type.code,
        baseline_severity=patient.baseline_severity,
        persistence_window=2
    )

    patient.status = status_state
    # Check-in submission immediately flags care-team status as "update_pending"
    patient.care_team_status = "update_pending"

    # 4. Re-calculate prediction
    pred_data = calculate_prediction(
        total_expected_days=patient.expected_duration_days,
        current_day=next_day,
        status_state=status_state,
        checkins_count=len(all_checkins),
        consecutive_deviation_count=consecutive_count,
        latest_delta=latest_delta
    )

    # Check previous prediction
    prev_pred = db.query(Prediction).filter(
        Prediction.patient_id == patient.id
    ).order_by(Prediction.version.desc()).first()
    new_ver = (prev_pred.version + 1) if prev_pred else 1
    prev_range_str = prev_pred.reason if prev_pred else None

    new_pred = Prediction(
        patient_id=patient.id,
        version=new_ver,
        projected_days_min=pred_data["projected_days_min"],
        projected_days_max=pred_data["projected_days_max"],
        confidence_score=pred_data["confidence_score"],
        status_state=status_state,
        reason=pred_data["reason"],
        previous_range=prev_range_str
    )
    db.add(new_pred)

    # 5. Evaluate tiered alerts & fatigue suppression
    evaluate_and_update_alerts(
        db=db,
        patient=patient,
        status_state=status_state,
        latest_delta=latest_delta,
        consecutive_count=consecutive_count,
        measurements=payload.measurements
    )

    db.commit()
    db.refresh(patient)

    return CheckInCompleteResponse(
        status="success",
        composite_score=comp_score,
        status_state=status_state,
        care_team_status=patient.care_team_status,
        message="Check-in analyzed. Your care team has been notified."
    )

@router.get("/{patient_id}/trajectory", response_model=TrajectoryResponse)
def get_patient_trajectory(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)

    curve = generate_trajectory_curve(
        total_days=patient.expected_duration_days,
        recovery_type_code=patient.recovery_type.code,
        baseline_severity=patient.baseline_severity
    )

    checkins = db.query(CheckIn).filter(CheckIn.patient_id == patient.id).order_by(CheckIn.day_number.asc()).all()
    checkin_by_day = {c.day_number: c for c in checkins}

    points = []
    for item in curve:
        d = item["day"]
        c = checkin_by_day.get(d)
        m_dict = {m.indicator_key: m.value for m in c.measurements} if c else {}

        points.append(TrajectoryPoint(
            day=d,
            expected_score=item["expected_score"],
            actual_score=c.composite_score if c else None,
            lower_bound=item["lower_bound"],
            upper_bound=item["upper_bound"],
            pain=m_dict.get("pain"),
            mobility=m_dict.get("mobility", m_dict.get("activity")),
            fatigue=m_dict.get("fatigue"),
            sleep=m_dict.get("sleep"),
            adherence=m_dict.get("adherence"),
            has_checkin=c is not None
        ))

    return TrajectoryResponse(
        patient_id=patient.id,
        condition_name=patient.condition_name,
        current_day=patient.current_day,
        total_expected_days=patient.expected_duration_days,
        status=patient.status,
        points=points,
        status_explanation=f"Patient is currently {patient.status.replace('_', ' ')} based on clinical expected curve."
    )

@router.get("/{patient_id}/prediction", response_model=PredictionOut)
def get_latest_prediction(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)
    pred = db.query(Prediction).filter(
        Prediction.patient_id == patient.id
    ).order_by(Prediction.version.desc()).first()

    if not pred:
        raise HTTPException(status_code=404, detail="No predictions found for patient")

    min_w = round(pred.projected_days_min / 7)
    max_w = round(pred.projected_days_max / 7)
    range_str = f"{min_w}–{max_w} weeks ({pred.projected_days_min}–{pred.projected_days_max} days)"

    return PredictionOut(
        id=pred.id,
        version=pred.version,
        projected_days_min=pred.projected_days_min,
        projected_days_max=pred.projected_days_max,
        projected_range_str=range_str,
        confidence_score=pred.confidence_score,
        status_state=pred.status_state,
        generated_at=pred.generated_at,
        reason=pred.reason,
        previous_range=pred.previous_range
    )

@router.get("/{patient_id}/prediction/history", response_model=List[PredictionOut])
def get_prediction_history(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)
    preds = db.query(Prediction).filter(
        Prediction.patient_id == patient.id
    ).order_by(Prediction.version.desc()).all()

    out = []
    for pred in preds:
        min_w = round(pred.projected_days_min / 7)
        max_w = round(pred.projected_days_max / 7)
        range_str = f"{min_w}–{max_w} weeks ({pred.projected_days_min}–{pred.projected_days_max} days)"
        out.append(PredictionOut(
            id=pred.id,
            version=pred.version,
            projected_days_min=pred.projected_days_min,
            projected_days_max=pred.projected_days_max,
            projected_range_str=range_str,
            confidence_score=pred.confidence_score,
            status_state=pred.status_state,
            generated_at=pred.generated_at,
            reason=pred.reason,
            previous_range=pred.previous_range
        ))
    return out

@router.get("/{patient_id}/explanation")
def get_patient_explanation(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)
    latest_c = db.query(CheckIn).filter(
        CheckIn.patient_id == patient.id
    ).order_by(CheckIn.day_number.desc()).first()

    measurements = {}
    if latest_c:
        for m in latest_c.measurements:
            measurements[m.indicator_key] = m.value

    fingerprint = compute_recovery_fingerprint(measurements)
    attribution = generate_attribution_explanation(measurements, patient.status, 0.0)

    return {
        "fingerprint": fingerprint,
        "attribution": attribution
    }

@router.get("/{patient_id}/alerts", response_model=List[AlertOut])
def get_patient_alerts(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)
    alerts = db.query(Alert).filter(
        Alert.patient_id == patient.id
    ).order_by(Alert.created_at.desc()).all()
    return alerts

@router.get("/{patient_id}/history")
def get_patient_history(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)
    checkins = db.query(CheckIn).filter(
        CheckIn.patient_id == patient.id
    ).order_by(CheckIn.day_number.desc()).all()

    history_list = []
    for c in checkins:
        m_dict = {m.indicator_key: m.value for m in c.measurements}
        history_list.append({
            "id": c.id,
            "day_number": c.day_number,
            "timestamp": c.timestamp,
            "composite_score": c.composite_score,
            "free_note": c.free_note,
            "language_used": c.language_used,
            "measurements": m_dict
        })
    return history_list

@router.get("/{patient_id}/updates")
def get_patient_updates(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)

    updates = db.query(CareTeamUpdate).filter(
        CareTeamUpdate.patient_id == patient.id
    ).order_by(CareTeamUpdate.sent_at.desc()).all()

    notes = db.query(ProfessionalNote).filter(
        ProfessionalNote.patient_id == patient.id,
        ProfessionalNote.is_patient_visible == True
    ).order_by(ProfessionalNote.created_at.desc()).all()

    goals = db.query(RecoveryGoal).filter(
        RecoveryGoal.patient_id == patient.id
    ).order_by(RecoveryGoal.target_day.asc()).all()

    return {
        "care_team_updates": [
            CareTeamUpdateOut(
                id=u.id,
                author_name=u.author.title if u.author else "Care Team",
                message=u.message,
                sent_at=u.sent_at,
                read_by_patient=u.read_by_patient
            ) for u in updates
        ],
        "professional_notes": [
            ProfessionalNoteOut(
                id=n.id,
                author_name=n.author.title if n.author else "Clinician",
                note_text=n.note_text,
                is_patient_visible=n.is_patient_visible,
                created_at=n.created_at
            ) for n in notes
        ],
        "goals": [
            RecoveryGoalOut(
                id=g.id,
                title=g.title,
                target_day=g.target_day,
                status=g.status,
                created_at=g.created_at
            ) for g in goals
        ]
    }

@router.put("/{patient_id}/language")
def update_patient_language(
    patient_id: int,
    lang: str = Query(..., regex="^(en|ta|hi)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = verify_patient_access(patient_id, current_user, db)
    patient.user.language_preference = lang
    db.commit()
    return {"status": "success", "language": lang}
