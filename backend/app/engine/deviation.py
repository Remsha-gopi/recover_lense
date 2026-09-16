from typing import List, Dict, Any, Tuple
from app.engine.baseline import calculate_expected_score

def detect_deviation_state(
    checkin_history: List[Dict[str, Any]],
    total_days: int,
    recovery_type_code: str,
    baseline_severity: float = 7.0,
    persistence_window: int = 2
) -> Tuple[str, float, int, str]:
    """
    Evaluates deviation between actual composite score and expected baseline.
    Requires persistence across 'persistence_window' consecutive check-ins before changing state.
    
    Returns:
        (status_state, latest_deviation, consecutive_count, explanation)
        status_state in: ["on_track", "slightly_behind", "recovering_faster", "significant_deviation"]
    """
    if not checkin_history:
        return ("on_track", 0.0, 0, "Initial calibration underway.")

    # Sort history by day_number ascending
    sorted_history = sorted(checkin_history, key=lambda x: x["day_number"])
    
    deviations = []
    for c in sorted_history:
        day = c["day_number"]
        actual = c["composite_score"]
        expected = calculate_expected_score(day, total_days, recovery_type_code, baseline_severity)
        delta = round(actual - expected, 1)
        deviations.append((day, delta))

    latest_delta = deviations[-1][1]

    # Evaluate the last `persistence_window` entries
    recent_deltas = [d[1] for d in deviations[-max(persistence_window, 1):]]
    
    # Check if all recent entries exceed faster threshold (+7.0)
    if len(recent_deltas) >= persistence_window and all(d >= 7.0 for d in recent_deltas):
        consecutive = sum(1 for d in reversed([x[1] for x in deviations]) if d >= 7.0)
        return (
            "recovering_faster",
            latest_delta,
            consecutive,
            f"Consistently tracking +{latest_delta:.1f} pts above expected trajectory across {consecutive} check-ins."
        )

    # Check if all recent entries show significant lag (< -14.0)
    if len(recent_deltas) >= persistence_window and all(d <= -14.0 for d in recent_deltas):
        consecutive = sum(1 for d in reversed([x[1] for x in deviations]) if d <= -14.0)
        return (
            "significant_deviation",
            latest_delta,
            consecutive,
            f"Persistent negative variance ({latest_delta:.1f} pts below expected) sustained across {consecutive} consecutive check-ins."
        )

    # Check if all recent entries show mild lag (-14.0 < d <= -7.0)
    if len(recent_deltas) >= persistence_window and all(-14.0 < d <= -7.0 for d in recent_deltas):
        consecutive = sum(1 for d in reversed([x[1] for x in deviations]) if -14.0 < d <= -7.0)
        return (
            "slightly_behind",
            latest_delta,
            consecutive,
            f"Mild deviation ({latest_delta:.1f} pts) maintained across {consecutive} check-ins. Ongoing monitoring active."
        )

    # If single day bad/good spike without persistence
    if abs(latest_delta) > 8.0 and len(deviations) >= 2:
        prev_delta = deviations[-2][1]
        if abs(prev_delta) <= 7.0:
            return (
                "on_track",
                latest_delta,
                1,
                f"Single-day reading noted ({latest_delta:+.1f} pts). Awaiting confirmation on next check-in before status adjustment."
            )

    return (
        "on_track",
        latest_delta,
        0,
        f"Recovery metrics are adhering closely to the clinical baseline ({latest_delta:+.1f} pts)."
    )
