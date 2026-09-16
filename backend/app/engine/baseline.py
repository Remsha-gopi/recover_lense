import math
from typing import List, Dict, Any

def calculate_expected_score(day: int, total_days: int, recovery_type_code: str, baseline_severity: float = 7.0) -> float:
    """
    Computes expected composite recovery score (0 to 100, where 100 is fully recovered)
    based on the recovery trajectory model.
    """
    if day <= 0:
        return 20.0
    if day >= total_days:
        return 95.0

    t = min(max(day / total_days, 0.0), 1.0)

    if recovery_type_code == "post_surgery":
        # Logistic / Sigmoidal recovery curve
        # Slow initial mobilization (inflammation/incision), steep mid-phase, asymptotic plateau
        k = 7.0
        x0 = 0.42
        logistic_val = 1.0 / (1.0 + math.exp(-k * (t - x0)))
        # Scale to 20 -> 95
        score = 20.0 + logistic_val * 75.0
        return round(min(max(score, 15.0), 98.0), 1)

    elif recovery_type_code == "illness":
        # Exponential saturation curve
        # Faster initial symptomatic relief, slower tail
        decay = 1.0 - math.exp(-3.2 * t)
        score = 25.0 + decay * 70.0
        return round(min(max(score, 20.0), 96.0), 1)

    elif recovery_type_code == "injury":
        # Bi-phasic recovery (protective stabilization then active rehabilitation)
        if t < 0.35:
            # Phase 1: healing & gentle passive range of motion
            score = 25.0 + (t / 0.35) * 25.0
        else:
            # Phase 2: progressive load & active strength
            phase2_t = (t - 0.35) / 0.65
            score = 50.0 + (phase2_t ** 0.85) * 45.0
        return round(min(max(score, 20.0), 97.0), 1)

    else:
        # Default smooth progressive curve
        score = 20.0 + (t ** 0.75) * 75.0
        return round(min(max(score, 10.0), 95.0), 1)

def generate_trajectory_curve(total_days: int, recovery_type_code: str, baseline_severity: float = 7.0) -> List[Dict[str, float]]:
    """
    Generates the entire expected trajectory baseline from day 1 to total_days
    including statistical expectation bounds (+/- 7-10% tolerance band).
    """
    curve = []
    for d in range(1, total_days + 1):
        expected = calculate_expected_score(d, total_days, recovery_type_code, baseline_severity)
        # Margin of normal biological variation
        variance = 7.5 * math.sin(math.pi * (d / total_days)) + 4.0
        curve.append({
            "day": d,
            "expected_score": expected,
            "lower_bound": round(max(expected - variance, 0.0), 1),
            "upper_bound": round(min(expected + variance, 100.0), 1),
        })
    return curve
