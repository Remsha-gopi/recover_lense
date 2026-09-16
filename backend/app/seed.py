from datetime import datetime, timedelta
from app.database import Base, engine, SessionLocal
from app.models import (
    User, RecoveryType, RecoveryIndicator, Patient, CareTeamMember,
    PatientCareTeamAssignment, CheckIn, RecoveryMeasurement, Alert,
    CareTeamUpdate, ProfessionalNote, Prediction, RecoveryGoal
)
from app.auth import get_password_hash
from app.engine.baseline import calculate_expected_score
from app.engine.trend_analysis import calculate_composite_score
from app.engine.prediction import calculate_prediction

def seed_database():
    # Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Recovery Types
        rt_surgery = RecoveryType(
            code="post_surgery",
            display_name="Post-Surgery Rehabilitation (Knee Arthroplasty)",
            description="Surgical tissue healing, incision care, progressive weight-bearing, and joint range of motion."
        )
        rt_illness = RecoveryType(
            code="illness",
            display_name="Post-Viral Illness Recovery",
            description="Cellular energy restoration, exertion tolerance, sleep normalization, and autonomic balance."
        )
        rt_injury = RecoveryType(
            code="injury",
            display_name="Musculoskeletal Injury Rehab (Rotator Cuff)",
            description="Tendon healing, stabilization, isometric loading, and functional overhead movement."
        )
        db.add_all([rt_surgery, rt_illness, rt_injury])
        db.commit()

        # 2. Indicators
        indicators = [
            # Post Surgery
            RecoveryIndicator(recovery_type_id=rt_surgery.id, indicator_key="pain", label="Joint / Incision Discomfort", unit="/10", min_val=0, max_val=10, direction_better="lower", priority_order=1),
            RecoveryIndicator(recovery_type_id=rt_surgery.id, indicator_key="mobility", label="Flexion & Walking Tolerance", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=2),
            RecoveryIndicator(recovery_type_id=rt_surgery.id, indicator_key="adherence", label="Home Exercise Compliance", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=3),
            RecoveryIndicator(recovery_type_id=rt_surgery.id, indicator_key="sleep", label="Sleep Quality", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=4),
            # Illness
            RecoveryIndicator(recovery_type_id=rt_illness.id, indicator_key="fatigue", label="Systemic Exhaustion Level", unit="/10", min_val=0, max_val=10, direction_better="lower", priority_order=1),
            RecoveryIndicator(recovery_type_id=rt_illness.id, indicator_key="activity", label="Upright & Active Tolerance", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=2),
            RecoveryIndicator(recovery_type_id=rt_illness.id, indicator_key="sleep", label="Restorative Sleep Quality", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=3),
            RecoveryIndicator(recovery_type_id=rt_illness.id, indicator_key="adherence", label="Hydration & Regimen Adherence", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=4),
            # Injury
            RecoveryIndicator(recovery_type_id=rt_injury.id, indicator_key="mobility", label="Shoulder Range of Motion", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=1),
            RecoveryIndicator(recovery_type_id=rt_injury.id, indicator_key="pain", label="Movement & Rest Discomfort", unit="/10", min_val=0, max_val=10, direction_better="lower", priority_order=2),
            RecoveryIndicator(recovery_type_id=rt_injury.id, indicator_key="adherence", label="Therapy Protocol Adherence", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=3),
            RecoveryIndicator(recovery_type_id=rt_injury.id, indicator_key="sleep", label="Uninterrupted Sleep", unit="/10", min_val=0, max_val=10, direction_better="higher", priority_order=4),
        ]
        db.add_all(indicators)
        db.commit()

        # 3. Users
        pwd_hash = get_password_hash("demo")
        
        user_doctor = User(
            email="dr.sharma@recoverlens.demo",
            hashed_password=pwd_hash,
            role="care_team",
            full_name="Dr. Alok Sharma, MD",
            language_preference="en"
        )
        user_meera = User(
            email="meera@recoverlens.demo",
            hashed_password=pwd_hash,
            role="patient",
            full_name="Meera Patel",
            language_preference="en"
        )
        user_arjun = User(
            email="arjun@recoverlens.demo",
            hashed_password=pwd_hash,
            role="patient",
            full_name="Arjun Varma",
            language_preference="en"
        )
        user_priya = User(
            email="priya@recoverlens.demo",
            hashed_password=pwd_hash,
            role="patient",
            full_name="Priya Nair",
            language_preference="ta"
        )
        db.add_all([user_doctor, user_meera, user_arjun, user_priya])
        db.commit()

        # 4. Care Team Member Profile
        dr_member = CareTeamMember(
            user_id=user_doctor.id,
            title="Dr. Alok Sharma, MD",
            specialty="Orthopedic Surgery & Rehabilitation",
            hospital="Apex Specialty Health Institute"
        )
        db.add(dr_member)
        db.commit()

        # 5. Patients Profiles
        # Patient A: Meera (Knee Replacement, Day 24 of 56, On Track)
        patient_meera = Patient(
            user_id=user_meera.id,
            recovery_type_id=rt_surgery.id,
            condition_name="Total Knee Replacement (Right)",
            start_date=datetime.utcnow() - timedelta(days=24),
            expected_duration_days=56,
            current_day=24,
            baseline_severity=8.0,
            status="on_track",
            care_team_status="reviewed",
            monitoring_completed=False
        )
        # Patient B: Arjun (Post-Viral Illness, Day 12 of 30, Significant Deviation, Update Pending)
        patient_arjun = Patient(
            user_id=user_arjun.id,
            recovery_type_id=rt_illness.id,
            condition_name="Post-Viral Exhaustion Syndrome",
            start_date=datetime.utcnow() - timedelta(days=12),
            expected_duration_days=30,
            current_day=12,
            baseline_severity=7.5,
            status="significant_deviation",
            care_team_status="update_pending",
            monitoring_completed=False
        )
        # Patient C: Priya (Rotator Cuff Injury, Day 18 of 42, Recovering Faster, Reviewed)
        patient_priya = Patient(
            user_id=user_priya.id,
            recovery_type_id=rt_injury.id,
            condition_name="Rotator Cuff Tendon Tear (Left)",
            start_date=datetime.utcnow() - timedelta(days=18),
            expected_duration_days=42,
            current_day=18,
            baseline_severity=6.5,
            status="recovering_faster",
            care_team_status="reviewed",
            monitoring_completed=False
        )
        db.add_all([patient_meera, patient_arjun, patient_priya])
        db.commit()

        # Assignments
        for pat in [patient_meera, patient_arjun, patient_priya]:
            db.add(PatientCareTeamAssignment(patient_id=pat.id, care_team_member_id=dr_member.id))
        db.commit()

        # --- SEED PATIENT A (MEERA) CHECK-INS (6 check-ins, steady progress) ---
        meera_checkins_data = [
            (3, {"pain": 7.5, "mobility": 2.5, "adherence": 8.0, "sleep": 5.0}),
            (7, {"pain": 6.0, "mobility": 3.8, "adherence": 9.0, "sleep": 6.0}),
            (11, {"pain": 5.0, "mobility": 5.0, "adherence": 8.5, "sleep": 6.5}),
            (15, {"pain": 4.2, "mobility": 6.2, "adherence": 9.0, "sleep": 7.0}),
            (20, {"pain": 3.5, "mobility": 7.0, "adherence": 9.5, "sleep": 7.5}),
            (24, {"pain": 2.8, "mobility": 7.8, "adherence": 9.0, "sleep": 8.0}),
        ]
        for day, m_dict in meera_checkins_data:
            score = calculate_composite_score(m_dict, "post_surgery")
            c = CheckIn(
                patient_id=patient_meera.id,
                timestamp=datetime.utcnow() - timedelta(days=(24 - day)),
                day_number=day,
                completed=True,
                composite_score=score,
                free_note="Completed knee extension drills without sharp pain." if day == 24 else None
            )
            db.add(c)
            db.commit()
            for k, val in m_dict.items():
                db.add(RecoveryMeasurement(checkin_id=c.id, indicator_key=k, value=val))
        db.commit()

        # Meera Prediction & Note
        pred_meera = calculate_prediction(56, 24, "on_track", 6, 0, 1.2)
        db.add(Prediction(
            patient_id=patient_meera.id,
            version=1,
            projected_days_min=pred_meera["projected_days_min"],
            projected_days_max=pred_meera["projected_days_max"],
            confidence_score=pred_meera["confidence_score"],
            status_state="on_track",
            reason=pred_meera["reason"]
        ))
        db.add(ProfessionalNote(
            patient_id=patient_meera.id,
            author_id=dr_member.id,
            note_text="Great progress Meera. Knee extension angle is within target. Keep up the quad sets and ice routine.",
            is_patient_visible=True
        ))
        db.add(CareTeamUpdate(
            patient_id=patient_meera.id,
            care_team_member_id=dr_member.id,
            message="Your knee flexion trajectory is looking excellent. You may transition to gentle stationary cycling this week.",
            sent_at=datetime.utcnow() - timedelta(hours=8),
            read_by_patient=True
        ))
        db.add(RecoveryGoal(patient_id=patient_meera.id, title="Unassisted 15-minute walk", target_day=30, status="active"))
        db.add(RecoveryGoal(patient_id=patient_meera.id, title="90-degree active knee flexion", target_day=20, status="achieved"))

        # --- SEED PATIENT B (ARJUN) CHECK-INS (Illness, 4 check-ins, last 3 show rising fatigue & falling activity) ---
        arjun_checkins_data = [
            (3, {"fatigue": 4.5, "activity": 6.5, "sleep": 7.0, "adherence": 8.0}),
            (6, {"fatigue": 6.5, "activity": 4.5, "sleep": 6.5, "adherence": 7.0}),  # Lag begins
            (9, {"fatigue": 8.0, "activity": 3.0, "sleep": 6.0, "adherence": 6.0}),  # Lag persists
            (12, {"fatigue": 8.5, "activity": 2.2, "sleep": 5.8, "adherence": 5.0}), # Significant deviation confirmed
        ]
        for day, m_dict in arjun_checkins_data:
            score = calculate_composite_score(m_dict, "illness")
            c = CheckIn(
                patient_id=patient_arjun.id,
                timestamp=datetime.utcnow() - timedelta(days=(12 - day)),
                day_number=day,
                completed=True,
                composite_score=score,
                free_note="Woke up feeling drained even after 7 hours in bed. Heavy limbs." if day == 12 else None
            )
            db.add(c)
            db.commit()
            for k, val in m_dict.items():
                db.add(RecoveryMeasurement(checkin_id=c.id, indicator_key=k, value=val))
        db.commit()

        # Arjun Alert (Priority Review, unreviewed so Care Team sees it)
        db.add(Alert(
            patient_id=patient_arjun.id,
            tier="priority_review",
            status="open",
            title="Priority Review: Significant Recovery Deviation",
            reason="Composite score dropped 18.2 pts below expected trajectory over 3 consecutive check-ins. Persistent heavy fatigue (8.5/10) logged.",
            persistence_count=3,
            linked_indicator="fatigue",
            created_at=datetime.utcnow() - timedelta(hours=3)
        ))
        pred_arjun = calculate_prediction(30, 12, "significant_deviation", 4, 3, -18.2)
        db.add(Prediction(
            patient_id=patient_arjun.id,
            version=1,
            projected_days_min=pred_arjun["projected_days_min"],
            projected_days_max=pred_arjun["projected_days_max"],
            confidence_score=pred_arjun["confidence_score"],
            status_state="significant_deviation",
            reason=pred_arjun["reason"]
        ))
        db.add(RecoveryGoal(patient_id=patient_arjun.id, title="Light 20-min upright posture without crash", target_day=16, status="active"))

        # --- SEED PATIENT C (PRIYA) CHECK-INS (Injury rehab, 4 check-ins, outperforming curve for 3 checks) ---
        priya_checkins_data = [
            (5, {"mobility": 4.0, "pain": 5.5, "adherence": 8.0, "sleep": 7.0}),
            (9, {"mobility": 6.5, "pain": 3.8, "adherence": 9.5, "sleep": 8.0}),  # Outpacing
            (14, {"mobility": 8.0, "pain": 2.5, "adherence": 10.0, "sleep": 8.5}), # Outpacing
            (18, {"mobility": 8.8, "pain": 1.8, "adherence": 9.5, "sleep": 9.0}),  # Recovering faster confirmed
        ]
        for day, m_dict in priya_checkins_data:
            score = calculate_composite_score(m_dict, "injury")
            c = CheckIn(
                patient_id=patient_priya.id,
                timestamp=datetime.utcnow() - timedelta(days=(18 - day)),
                day_number=day,
                completed=True,
                composite_score=score,
                free_note="Able to reach top kitchen shelf without shoulder pain today!" if day == 18 else None
            )
            db.add(c)
            db.commit()
            for k, val in m_dict.items():
                db.add(RecoveryMeasurement(checkin_id=c.id, indicator_key=k, value=val))
        db.commit()

        # Priya Prediction (narrowed from 6-8 weeks to 4-5 weeks)
        pred_priya = calculate_prediction(42, 18, "recovering_faster", 4, 3, 14.5)
        db.add(Prediction(
            patient_id=patient_priya.id,
            version=2,
            projected_days_min=28,
            projected_days_max=35,
            confidence_score=86.5,
            status_state="recovering_faster",
            reason="Rapid regaining of shoulder abduction and external rotation across 3 check-ins reduced timeline by ~10 days.",
            previous_range="6–8 weeks (42–56 days)"
        ))
        db.add(CareTeamUpdate(
            patient_id=patient_priya.id,
            care_team_member_id=dr_member.id,
            message="Outstanding progress Priya! Your rotator cuff stability is advancing ahead of schedule. Keep maintaining careful form on the resistance band exercises.",
            sent_at=datetime.utcnow() - timedelta(days=1),
            read_by_patient=True
        ))
        db.add(RecoveryGoal(patient_id=patient_priya.id, title="120-degree active shoulder abduction", target_day=21, status="achieved"))
        db.add(RecoveryGoal(patient_id=patient_priya.id, title="Return to light badminton rally", target_day=35, status="active"))

        db.commit()
        print("Database seeded successfully with 3 patients and Dr. Sharma!")
    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
