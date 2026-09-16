import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "patient" or "care_team"
    full_name = Column(String, nullable=False)
    language_preference = Column(String, default="en")  # "en", "ta", "hi"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    care_team_profile = relationship("CareTeamMember", back_populates="user", uselist=False)


class RecoveryType(Base):
    __tablename__ = "recovery_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)  # "post_surgery", "illness", "injury"
    display_name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    patients = relationship("Patient", back_populates="recovery_type")
    indicators = relationship("RecoveryIndicator", back_populates="recovery_type")


class RecoveryIndicator(Base):
    __tablename__ = "recovery_indicators"

    id = Column(Integer, primary_key=True, index=True)
    recovery_type_id = Column(Integer, ForeignKey("recovery_types.id"), nullable=False)
    indicator_key = Column(String, nullable=False)  # "pain", "mobility", "fatigue", "sleep", "adherence", etc.
    label = Column(String, nullable=False)
    unit = Column(String, default="")
    min_val = Column(Float, default=0.0)
    max_val = Column(Float, default=10.0)
    direction_better = Column(String, default="lower")  # "lower" (e.g. pain) or "higher" (e.g. mobility)
    priority_order = Column(Integer, default=1)

    recovery_type = relationship("RecoveryType", back_populates="indicators")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    recovery_type_id = Column(Integer, ForeignKey("recovery_types.id"), nullable=False)
    condition_name = Column(String, nullable=False)  # e.g., "Knee Replacement", "Post-Viral Fatigue"
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    expected_duration_days = Column(Integer, default=56)
    current_day = Column(Integer, default=1)
    baseline_severity = Column(Float, default=7.0)  # Initial severity 1-10
    status = Column(String, default="on_track")  # "on_track", "slightly_behind", "recovering_faster", "significant_deviation"
    care_team_status = Column(String, default="reviewed")  # "reviewed", "update_pending", "monitoring", "no_recent_update"
    monitoring_completed = Column(Boolean, default=False)
    completion_message = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="patient_profile")
    recovery_type = relationship("RecoveryType", back_populates="patients")
    checkins = relationship("CheckIn", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete-orphan")
    updates = relationship("CareTeamUpdate", back_populates="patient", cascade="all, delete-orphan")
    notes = relationship("ProfessionalNote", back_populates="patient", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="patient", cascade="all, delete-orphan")
    goals = relationship("RecoveryGoal", back_populates="patient", cascade="all, delete-orphan")
    assignments = relationship("PatientCareTeamAssignment", back_populates="patient")


class CareTeamMember(Base):
    __tablename__ = "care_team_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    title = Column(String, nullable=False)  # e.g., "Dr. Sharma, MD"
    specialty = Column(String, nullable=False)  # e.g., "Orthopedics & Rehab"
    hospital = Column(String, nullable=False)

    user = relationship("User", back_populates="care_team_profile")
    assignments = relationship("PatientCareTeamAssignment", back_populates="care_team_member")
    updates_sent = relationship("CareTeamUpdate", back_populates="author")
    notes_written = relationship("ProfessionalNote", back_populates="author")


class PatientCareTeamAssignment(Base):
    __tablename__ = "patient_care_team_assignments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    care_team_member_id = Column(Integer, ForeignKey("care_team_members.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="assignments")
    care_team_member = relationship("CareTeamMember", back_populates="assignments")


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    day_number = Column(Integer, nullable=False)
    language_used = Column(String, default="en")
    completed = Column(Boolean, default=True)
    free_note = Column(Text, nullable=True)
    composite_score = Column(Float, nullable=True)  # Normalized recovery progress 0-100

    patient = relationship("Patient", back_populates="checkins")
    measurements = relationship("RecoveryMeasurement", back_populates="checkin", cascade="all, delete-orphan")


class RecoveryMeasurement(Base):
    __tablename__ = "recovery_measurements"

    id = Column(Integer, primary_key=True, index=True)
    checkin_id = Column(Integer, ForeignKey("checkins.id"), nullable=False)
    indicator_key = Column(String, nullable=False)
    value = Column(Float, nullable=False)

    checkin = relationship("CheckIn", back_populates="measurements")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    version = Column(Integer, default=1)
    projected_days_min = Column(Integer, nullable=False)
    projected_days_max = Column(Integer, nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0 to 100%
    status_state = Column(String, nullable=False)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    reason = Column(Text, nullable=False)
    previous_range = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    tier = Column(String, nullable=False)  # "informational", "monitor", "review_suggested", "priority_review"
    status = Column(String, default="open")  # "open", "reviewed", "escalated"
    title = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    persistence_count = Column(Integer, default=1)  # Fatigue protection tracking
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("care_team_members.id"), nullable=True)
    linked_indicator = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="alerts")


class CareTeamUpdate(Base):
    __tablename__ = "care_team_updates"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    care_team_member_id = Column(Integer, ForeignKey("care_team_members.id"), nullable=False)
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    read_by_patient = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="updates")
    author = relationship("CareTeamMember", back_populates="updates_sent")


class ProfessionalNote(Base):
    __tablename__ = "professional_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("care_team_members.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    is_patient_visible = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="notes")
    author = relationship("CareTeamMember", back_populates="notes_written")


class RecoveryGoal(Base):
    __tablename__ = "recovery_goals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    title = Column(String, nullable=False)
    target_day = Column(Integer, nullable=True)
    status = Column(String, default="active")  # "active", "achieved"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="goals")
