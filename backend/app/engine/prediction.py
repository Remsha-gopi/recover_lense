import math
from typing import List, Dict, Any, Tuple

def calculate_prediction(
    total_expected_days: int,
    current_day: int,
    status_state: str,
    checkins_count: int,
    consecutive_deviation_count: int,
    latest_delta: float
) -> Dict[str, Any]:
    """
    Computes statistical recovery timeline range and confidence percentage.
    Adjusts window dynamically based on persistence-gated status.
    """
    # Base confidence scales with adherence and progress through timeline
    observation_ratio = min(checkins_count / max(current_day, 1), 1.0)
    progress_ratio = min(current_day / total_expected_days, 1.0)

    # Base confidence: sparse data gives 45-60%, high adherence + later days gives 80-92%
    base_confidence = 50.0 + (observation_ratio * 25.0) + (progress_ratio * 15.0)
    
    # Adjust projected days depending on status
    if status_state == "recovering_faster":
        # Accelerate completion by 15-25%
        reduction_factor = 0.80
        proj_mid = total_expected_days * reduction_factor
        window_half = max(3, int(total_expected_days * 0.08))
        proj_min = max(current_day + 2, int(proj_mid - window_half))
        proj_max = max(proj_min + 4, int(proj_mid + window_half))
        confidence = min(92.0, base_confidence + 5.0)
        
        # Weeks translation
        min_w = max(1, round(proj_min / 7))
        max_w = max(min_w + 1, round(proj_max / 7))
        range_str = f"{min_w}–{max_w} weeks ({proj_min}–{proj_max} days)"
        reason = f"Accelerated functional progress maintained over {consecutive_deviation_count} check-ins narrowed expected window from original {round(total_expected_days/7)} weeks."

    elif status_state == "significant_deviation":
        # Extended timeline with wider uncertainty band
        extension_factor = 1.30
        proj_mid = total_expected_days * extension_factor
        window_half = max(7, int(total_expected_days * 0.15))
        proj_min = max(current_day + 7, int(proj_mid - window_half))
        proj_max = max(proj_min + 10, int(proj_mid + window_half))
        confidence = max(45.0, base_confidence - 15.0)
        
        min_w = round(proj_min / 7)
        max_w = round(proj_max / 7)
        range_str = f"{min_w}–{max_w} weeks ({proj_min}–{proj_max} days)"
        reason = f"Persistent symptom elevation has lengthened the projection. Awaiting care-team clinical review to recalibrate plan."

    elif status_state == "slightly_behind":
        extension_factor = 1.10
        proj_mid = total_expected_days * extension_factor
        window_half = max(5, int(total_expected_days * 0.10))
        proj_min = max(current_day + 4, int(proj_mid - window_half))
        proj_max = max(proj_min + 7, int(proj_mid + window_half))
        confidence = max(55.0, base_confidence - 5.0)
        
        min_w = round(proj_min / 7)
        max_w = round(proj_max / 7)
        range_str = f"{min_w}–{max_w} weeks ({proj_min}–{proj_max} days)"
        reason = "Mild pace lag observed. Projection widened slightly while routine recovery stabilizes."

    else:  # on_track
        proj_mid = total_expected_days
        window_half = max(4, int(total_expected_days * 0.08))
        proj_min = max(current_day + 2, int(proj_mid - window_half))
        proj_max = max(proj_min + 5, int(proj_mid + window_half))
        confidence = min(88.0, base_confidence)
        
        min_w = round(proj_min / 7)
        max_w = round(proj_max / 7)
        range_str = f"{min_w}–{max_w} weeks ({proj_min}–{proj_max} days)"
        reason = "Metrics are adhering smoothly to clinical recovery benchmarks. Projection remains stable."

    return {
        "projected_days_min": proj_min,
        "projected_days_max": proj_max,
        "projected_range_str": range_str,
        "confidence_score": round(confidence, 1),
        "status_state": status_state,
        "reason": reason
    }
