import pytest
from app.engine.baseline import calculate_expected_score, generate_trajectory_curve
from app.engine.trend_analysis import calculate_composite_score, compute_momentum, compute_what_changed
from app.engine.deviation import detect_deviation_state
from app.engine.prediction import calculate_prediction
from app.engine.adaptive_questions import get_next_question

def test_baseline_expected_curves():
    # Test surgery curve
    score_day_1 = calculate_expected_score(1, 56, "post_surgery")
    score_day_28 = calculate_expected_score(28, 56, "post_surgery")
    score_day_56 = calculate_expected_score(56, 56, "post_surgery")
    assert score_day_1 < score_day_28 < score_day_56
    assert 20 <= score_day_1 <= 35
    assert 85 <= score_day_56 <= 98

    # Test illness curve
    ill_1 = calculate_expected_score(1, 30, "illness")
    ill_15 = calculate_expected_score(15, 30, "illness")
    assert ill_1 < ill_15

    # Test injury curve
    inj_5 = calculate_expected_score(5, 42, "injury")
    inj_25 = calculate_expected_score(25, 42, "injury")
    assert inj_5 < inj_25

def test_composite_score_calculation():
    # High pain should yield low score
    bad_meas = {"pain": 8.5, "mobility": 2.0, "sleep": 4.0, "adherence": 3.0}
    bad_score = calculate_composite_score(bad_meas, "post_surgery")

    # Low pain, high mobility should yield high score
    good_meas = {"pain": 1.5, "mobility": 8.5, "sleep": 8.0, "adherence": 9.5}
    good_score = calculate_composite_score(good_meas, "post_surgery")

    assert bad_score < good_score
    assert bad_score < 40.0
    assert good_score > 75.0

def test_persistence_gated_deviation():
    # 1 bad day preceded by normal days should NOT trigger significant_deviation (anti-noise)
    history_one_bad = [
        {"day_number": 4, "composite_score": 45.0},
        {"day_number": 8, "composite_score": 58.0},
        {"day_number": 12, "composite_score": 25.0}, # Sudden single dip
    ]
    state_1, delta_1, count_1, _ = detect_deviation_state(history_one_bad, 56, "post_surgery", persistence_window=2)
    assert state_1 == "on_track"  # Gated by persistence! Single day waiting for confirmation.

    # 3 consecutive bad days MUST trigger significant_deviation
    history_three_bad = [
        {"day_number": 3, "composite_score": 40.0},
        {"day_number": 6, "composite_score": 30.0}, # Delta <= -14
        {"day_number": 9, "composite_score": 28.0}, # Delta <= -14
        {"day_number": 12, "composite_score": 24.0}, # Delta <= -14
    ]
    state_2, delta_2, count_2, _ = detect_deviation_state(history_three_bad, 30, "illness", persistence_window=2)
    assert state_2 == "significant_deviation"
    assert count_2 >= 2

    # 3 consecutive outperforming days MUST trigger recovering_faster
    history_faster = [
        {"day_number": 5, "composite_score": 55.0},
        {"day_number": 10, "composite_score": 75.0},
        {"day_number": 15, "composite_score": 88.0},
        {"day_number": 18, "composite_score": 92.0},
    ]
    state_3, delta_3, count_3, _ = detect_deviation_state(history_faster, 42, "injury", persistence_window=2)
    assert state_3 == "recovering_faster"
    assert count_3 >= 2

def test_prediction_adjustments():
    # Faster recovery should reduce projected weeks
    pred_fast = calculate_prediction(42, 18, "recovering_faster", 4, 3, 12.0)
    assert pred_fast["projected_days_min"] < 42
    assert "recovering_faster" in pred_fast["status_state"]

    # Significant deviation should extend projected days
    pred_slow = calculate_prediction(30, 12, "significant_deviation", 4, 3, -18.0)
    assert pred_slow["projected_days_max"] > 30
    assert pred_slow["confidence_score"] < pred_fast["confidence_score"]

def test_adaptive_questions():
    # Initial question for post_surgery should prioritize pain
    q1 = get_next_question("post_surgery", answered_keys=[], language="en")
    assert not q1["is_done"]
    assert q1["question"]["indicator_key"] == "pain"

    # Once pain is answered, next should be mobility
    q2 = get_next_question("post_surgery", answered_keys=["pain"], language="ta")
    assert not q2["is_done"]
    assert q2["question"]["indicator_key"] == "mobility"
    # Tamil translation check
    assert "அசைவு" in q2["question"]["question_text"]

    # All answered signals completion
    q_done = get_next_question("post_surgery", answered_keys=["pain", "mobility", "adherence", "sleep"], language="hi")
    assert q_done["is_done"]
