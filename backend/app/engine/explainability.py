from typing import Dict, List, Any

def compute_recovery_fingerprint(measurements: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Computes a normalized 5-dimension radar 'Recovery Fingerprint' [0-100 scale].
    Dimensions: Comfort (pain), Movement (mobility/activity), Energy (fatigue), Rest (sleep), Discipline (adherence).
    """
    pain = measurements.get("pain", 3.0)
    mobility = measurements.get("mobility", measurements.get("activity", 6.0))
    fatigue = measurements.get("fatigue", 3.0)
    sleep = measurements.get("sleep", 7.0)
    adherence = measurements.get("adherence", 8.0)

    return [
        {"subject": "Comfort", "value": round((10.0 - pain) * 10.0, 1), "fullMark": 100},
        {"subject": "Mobility", "value": round(mobility * 10.0, 1), "fullMark": 100},
        {"subject": "Vitality", "value": round((10.0 - fatigue) * 10.0, 1), "fullMark": 100},
        {"subject": "Sleep Quality", "value": round(sleep * 10.0, 1), "fullMark": 100},
        {"subject": "Adherence", "value": round(adherence * 10.0, 1), "fullMark": 100},
    ]

def generate_attribution_explanation(
    measurements: Dict[str, float],
    status_state: str,
    latest_delta: float
) -> Dict[str, Any]:
    """
    Identifies top positive and negative driving factors behind the recovery state.
    """
    factors = []
    
    # Analyze individual factors
    if "pain" in measurements:
        p = measurements["pain"]
        if p <= 3.0:
            factors.append({"factor": "Low Pain Levels", "impact": "positive", "score": "+25%", "detail": "Controlled surgical site inflammation accelerates daily milestone achievement."})
        elif p >= 6.0:
            factors.append({"factor": "Elevated Pain", "impact": "negative", "score": "-20%", "detail": "Discomfort is restraining joint flexion and movement tolerance."})

    if "mobility" in measurements:
        m = measurements["mobility"]
        if m >= 7.0:
            factors.append({"factor": "High Mobility", "impact": "positive", "score": "+30%", "detail": "Range of motion is tracking ahead of typical biological tissue repair rate."})
        elif m <= 4.0:
            factors.append({"factor": "Restricted Joint ROM", "impact": "negative", "score": "-25%", "detail": "Joint stiffness is slowing down functional walking transitions."})

    if "fatigue" in measurements:
        f = measurements["fatigue"]
        if f >= 6.0:
            factors.append({"factor": "Persistent Fatigue", "impact": "negative", "score": "-30%", "detail": "Systemic exhaustion is dampening upright tolerance and daily energy reserves."})
        elif f <= 3.0:
            factors.append({"factor": "Strong Vitality", "impact": "positive", "score": "+20%", "detail": "Sustained daytime alertness correlates with rapid tissue regeneration."})

    if "adherence" in measurements:
        a = measurements["adherence"]
        if a >= 8.0:
            factors.append({"factor": "Exercise Adherence", "impact": "positive", "score": "+20%", "detail": "Consistent completion of home rehab protocol builds neuromuscular stability."})
        elif a <= 4.0:
            factors.append({"factor": "Rehab Inconsistency", "impact": "negative", "score": "-15%", "detail": "Skipped exercise sessions delay muscular reactivation."})

    if not factors:
        factors.append({"factor": "Balanced Baseline", "impact": "neutral", "score": "0%", "detail": "All physiological markers are harmonized with standard recovery guidelines."})

    return {
        "status": status_state,
        "delta": latest_delta,
        "key_factors": factors,
        "summary": "Attribution analysis indicates that recovery velocity is predominantly guided by these physiological factors."
    }
