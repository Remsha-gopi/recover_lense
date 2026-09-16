import requests
import json

BASE = "http://127.0.0.1:8001/api"

def test_full_e2e_demo_flow():
    # Reset database to clean initial state
    r_reset = requests.post(f"{BASE}/demo/reset")
    assert r_reset.status_code == 200

    # 1. Test Demo Login: Arjun (Patient B)
    r = requests.post(f"{BASE}/auth/demo-login", json={"role": "patient", "demo_patient_code": "arjun"})
    assert r.status_code == 200, f"Arjun login failed: {r.text}"
    arjun_token = r.json()["access_token"]
    arjun_id = r.json()["patient_id"]
    headers_arjun = {"Authorization": f"Bearer {arjun_token}"}

    # 2. Verify Patient Home Telemetry
    r = requests.get(f"{BASE}/patients/{arjun_id}/home", headers=headers_arjun)
    assert r.status_code == 200
    home = r.json()
    assert home["status"] == "significant_deviation"
    assert home["care_team_status"] == "update_pending"
    assert home["open_alerts_count"] >= 1

    # 3. Test Layer 0 Adaptive Question Engine
    r = requests.get(f"{BASE}/patients/{arjun_id}/checkin/next-question?answered=&lang=en", headers=headers_arjun)
    assert r.status_code == 200
    q1 = r.json()
    assert q1["question"]["indicator_key"] == "fatigue"

    # 4. Submit Adaptive Check-in
    submit_payload = {
        "measurements": {"fatigue": 8.0, "activity": 3.0, "sleep": 6.0, "adherence": 6.0},
        "free_note": "Feeling persistent heaviness in the legs. Hydrating as advised.",
        "language_used": "en"
    }
    r = requests.post(f"{BASE}/patients/{arjun_id}/checkin/submit", json=submit_payload, headers=headers_arjun)
    assert r.status_code == 200
    checkin_res = r.json()
    assert checkin_res["care_team_status"] == "update_pending"

    # 5. Demo Login: Dr. Sharma (Care Team)
    r = requests.post(f"{BASE}/auth/demo-login", json={"role": "care_team"})
    assert r.status_code == 200
    doc_token = r.json()["access_token"]
    headers_doc = {"Authorization": f"Bearer {doc_token}"}

    # 6. Verify Care Team Queue sorted by urgency
    r = requests.get(f"{BASE}/careteam/queue", headers=headers_doc)
    assert r.status_code == 200
    queue = r.json()
    top_patient = queue[0]
    assert top_patient["patient_name"] == "Arjun Varma"
    assert top_patient["urgency_tier"] == "priority_review"

    # 7. Closed-Loop Care Team Action: Review Alert & Send Update
    alert_id = top_patient["open_alerts"][0]["id"]
    review_payload = {
        "action": "reviewed",
        "send_update_message": "Dr. Sharma reviewed your fatigue logs. Please prioritize daytime rest and light hydration; we will assess on Day 15."
    }
    r = requests.post(f"{BASE}/careteam/patients/{arjun_id}/alerts/{alert_id}/review", json=review_payload, headers=headers_doc)
    assert r.status_code == 200

    # 8. Verify Closed Loop on Patient Side (Care Team status flips to reviewed!)
    r = requests.get(f"{BASE}/patients/{arjun_id}/home", headers=headers_arjun)
    assert r.status_code == 200
    home_after = r.json()
    assert home_after["care_team_status"] == "reviewed"
    assert "Dr. Sharma" in home_after["latest_care_team_update"]

    # 9. Test AI Recovery Coach
    ai_payload = {"patient_id": arjun_id, "question": "Is my fatigue normal right now?", "language": "en"}
    r = requests.post(f"{BASE}/ai/ask", json=ai_payload, headers=headers_arjun)
    assert r.status_code == 200
    ai_res = r.json()
    assert len(ai_res["answer"]) > 10
    assert "Decision Support Only" in ai_res["safety_disclaimer"]

    # 10. Test Priya (Patient C: Recovering Faster)
    r = requests.post(f"{BASE}/auth/demo-login", json={"role": "patient", "demo_patient_code": "priya"})
    priya_token = r.json()["access_token"]
    priya_id = r.json()["patient_id"]
    r = requests.get(f"{BASE}/patients/{priya_id}/home", headers={"Authorization": f"Bearer {priya_token}"})
    home_priya = r.json()
    assert home_priya["status"] == "recovering_faster"

if __name__ == "__main__":
    test_full_e2e_demo_flow()
    print("ALL 10 END-TO-END DEMO FLOW CHECKS PASSED!")
