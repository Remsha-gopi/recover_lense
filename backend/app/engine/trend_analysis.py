from typing import Dict, List, Any, Optional

INDICATOR_WEIGHTS = {
    "post_surgery": {
        "pain": 0.35,
        "mobility": 0.35,
        "adherence": 0.15,
        "sleep": 0.15,
    },
    "illness": {
        "fatigue": 0.40,
        "sleep": 0.25,
        "activity": 0.20,
        "appetite": 0.15,
    },
    "injury": {
        "mobility": 0.35,
        "pain": 0.30,
        "adherence": 0.20,
        "strength": 0.15,
    }
}

DEFAULT_WEIGHTS = {
    "pain": 0.30,
    "mobility": 0.30,
    "fatigue": 0.20,
    "sleep": 0.20,
}

def calculate_composite_score(measurements: Dict[str, float], recovery_type_code: str = "post_surgery") -> float:
    """
    Computes a standardized composite recovery index (0 to 100).
    Higher is better functional recovery.
    """
    weights = INDICATOR_WEIGHTS.get(recovery_type_code, DEFAULT_WEIGHTS)
    weighted_sum = 0.0
    total_weight = 0.0

    for key, value in measurements.items():
        weight = weights.get(key, 0.2)
        # Normalize to 0-100 where 100 is best outcome
        if key in ["pain", "fatigue", "nausea", "swelling"]:
            # Lower raw value is better
            normalized = max(0.0, min(100.0, (10.0 - value) * 10.0))
        elif key in ["mobility", "sleep", "adherence", "activity", "strength", "appetite"]:
            # Higher raw value is better
            normalized = max(0.0, min(100.0, value * 10.0))
        else:
            normalized = max(0.0, min(100.0, value * 10.0))

        weighted_sum += normalized * weight
        total_weight += weight

    if total_weight > 0:
        score = weighted_sum / total_weight
    else:
        score = 50.0

    return round(score, 1)

def compute_momentum(scores: List[float], checkin_days: List[int]) -> Dict[str, Any]:
    """
    Computes recovery momentum (direction, rate of change, label, plain language reason)
    from historical composite scores.
    """
    if not scores or len(scores) < 2:
        return {
            "direction": "steady",
            "rate_of_change": 0.0,
            "label": "Establishing Baseline",
            "plain_reason": "We are calibrating your baseline. Keep logging daily check-ins."
        }

    # Compare recent 2-3 scores
    recent = scores[-1]
    prev = scores[-2]
    diff = round(recent - prev, 1)

    if diff >= 3.0:
        direction = "improving"
        label = "Accelerating Recovery (+{:.1f} pts)".format(diff)
        plain_reason = "Your pain and mobility markers show strong positive velocity over consecutive days."
    elif diff <= -3.0:
        direction = "declining"
        label = "Slowing Trajectory ({:.1f} pts)".format(diff)
        plain_reason = "Slight uptick in fatigue and reduced physical capacity noted across your recent entries."
    else:
        direction = "steady"
        label = "Steady Progress ({:+.1f} pts)".format(diff)
        plain_reason = "Recovery is stabilizing smoothly within expected physiological margins."

    return {
        "direction": direction,
        "rate_of_change": diff,
        "label": label,
        "plain_reason": plain_reason
    }

def compute_what_changed(current_measurements: Dict[str, float], previous_measurements: Dict[str, float]) -> Dict[str, Any]:
    """
    Computes granular metric deltas for the 'What Changed?' comparison card.
    """
    metrics = []
    improved_count = 0
    worsened_count = 0

    all_keys = set(current_measurements.keys()).union(set(previous_measurements.keys()))
    
    for key in sorted(all_keys):
        curr = current_measurements.get(key, 5.0)
        prev = previous_measurements.get(key, curr)
        diff = round(curr - prev, 1)

        # Determine if diff is an improvement
        is_lower_better = key in ["pain", "fatigue", "nausea", "swelling"]
        if is_lower_better:
            improved = diff < 0
        else:
            improved = diff > 0

        if abs(diff) > 0.01:
            if improved:
                improved_count += 1
            else:
                worsened_count += 1

        label = f"{key.replace('_', ' ').title()}"
        metrics.append({
            "name": key,
            "previous": prev,
            "current": curr,
            "diff": diff,
            "improved": improved,
            "label": label
        })

    if improved_count > worsened_count:
        summary = f"{improved_count} indicator(s) improved since your last check-in, showing favorable recovery velocity."
    elif worsened_count > improved_count:
        summary = f"{worsened_count} indicator(s) showed mild setbacks. Resting and hydration recommended."
    else:
        summary = "Your indicators are holding consistent with your recent baseline."

    return {
        "title": "Since Last Check-in",
        "summary": summary,
        "metrics": metrics
    }
