from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import Alert, Patient

def evaluate_and_update_alerts(
    db: Session,
    patient: Patient,
    status_state: str,
    latest_delta: float,
    consecutive_count: int,
    measurements: Dict[str, float]
) -> Optional[Alert]:
    """
    Evaluates tiered alert thresholds and manages fatigue suppression:
    Updates existing open alerts with persistence counters instead of creating duplicate spam.
    """
    # 1. Determine which tier is warranted
    target_tier = None
    alert_title = ""
    alert_reason = ""
    linked_indicator = None

    if status_state == "significant_deviation":
        target_tier = "priority_review"
        alert_title = "Priority Review: Significant Recovery Deviation"
        alert_reason = f"Composite score is {abs(latest_delta):.1f} pts below expected baseline over {consecutive_count} check-ins."
        # Find key offending indicator
        if measurements.get("fatigue", 0) >= 7.0:
            linked_indicator = "fatigue"
            alert_reason += f" Elevated fatigue ({measurements['fatigue']}/10) reported."
        elif measurements.get("pain", 0) >= 7.0:
            linked_indicator = "pain"
            alert_reason += f" Unusually high pain level ({measurements['pain']}/10) recorded."
        else:
            linked_indicator = "composite"

    elif status_state == "slightly_behind":
        if consecutive_count >= 2:
            target_tier = "review_suggested"
            alert_title = "Review Suggested: Recovery Pace Slower than Target"
            alert_reason = f"Patient is lagging expected trajectory by {abs(latest_delta):.1f} pts across {consecutive_count} consecutive check-ins."
        else:
            target_tier = "monitor"
            alert_title = "Monitoring: Mild Deviation Detected"
            alert_reason = f"Mild deviation ({abs(latest_delta):.1f} pts) detected. Active watch enabled."
        linked_indicator = "progress"

    elif abs(latest_delta) > 8.0 and consecutive_count == 1:
        target_tier = "informational"
        alert_title = "Informational: Single Check-in Fluctuation"
        alert_reason = f"Isolated reading shift ({latest_delta:+.1f} pts). Awaiting confirming check-in."
        linked_indicator = "single_reading"

    if not target_tier:
        return None

    # 2. Fatigue Protection Check: Look for open unresolved alerts of similar scope
    open_alert = db.query(Alert).filter(
        Alert.patient_id == patient.id,
        Alert.status == "open"
    ).order_by(Alert.created_at.desc()).first()

    if open_alert:
        # If open alert exists, suppress new alert and increment persistence counter
        open_alert.persistence_count += 1
        
        # Check if worsening necessitates tier escalation
        tier_hierarchy = {"informational": 1, "monitor": 2, "review_suggested": 3, "priority_review": 4}
        current_rank = tier_hierarchy.get(open_alert.tier, 1)
        new_rank = tier_hierarchy.get(target_tier, 1)

        if new_rank > current_rank:
            open_alert.tier = target_tier
            open_alert.title = alert_title
            open_alert.reason = alert_reason + f" (Escalated after {open_alert.persistence_count} entries without resolution)"
        else:
            open_alert.reason = f"Monitoring ongoing deviation ({open_alert.persistence_count} check-ins). {alert_reason}"
        
        db.commit()
        db.refresh(open_alert)
        return open_alert

    # 3. Create fresh alert
    new_alert = Alert(
        patient_id=patient.id,
        tier=target_tier,
        status="open",
        title=alert_title,
        reason=alert_reason,
        persistence_count=1,
        linked_indicator=linked_indicator,
        created_at=datetime.utcnow()
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert
