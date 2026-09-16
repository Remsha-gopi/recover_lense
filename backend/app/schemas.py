from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    patient_id: Optional[int] = None
    care_team_id: Optional[int] = None
    full_name: str
    language_preference: str = "en"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
    patient_id: Optional[int] = None
    care_team_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class DemoLoginRequest(BaseModel):
    role: str  # "patient" or "care_team"
    demo_patient_code: Optional[str] = None  # "meera", "arjun", "priya"

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    full_name: str
    language_preference: str

    class Config:
        from_attributes = True

# Check-in Schemas
class CheckInQuestion(BaseModel):
    indicator_key: str
    question_text: str
    tts_text: str
    unit: str = ""
    min_val: float = 0.0
    max_val: float = 10.0
    step: float = 1.0
    direction_better: str = "lower"
    suggested_options: List[str] = []

class CheckInNextQuestionResponse(BaseModel):
    is_done: bool
    question_number: int
    total_questions: int
    question: Optional[CheckInQuestion] = None

class CheckInSubmitRequest(BaseModel):
    measurements: Dict[str, float]  # key -> float value
    free_note: Optional[str] = None
    language_used: str = "en"

class CheckInCompleteResponse(BaseModel):
    status: str
    composite_score: float
    status_state: str
    care_team_status: str
    message: str

# Trajectory & Graph
class TrajectoryPoint(BaseModel):
    day: int
    expected_score: float
    actual_score: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    pain: Optional[float] = None
    mobility: Optional[float] = None
    fatigue: Optional[float] = None
    sleep: Optional[float] = None
    adherence: Optional[float] = None
    has_checkin: bool = False

class TrajectoryResponse(BaseModel):
    patient_id: int
    condition_name: str
    current_day: int
    total_expected_days: int
    status: str
    points: List[TrajectoryPoint]
    status_explanation: str

# Momentum & What-Changed
class MomentumInfo(BaseModel):
    direction: str  # "improving", "steady", "declining"
    rate_of_change: float  # points per check-in
    label: str
    plain_reason: str

class WhatChangedMetric(BaseModel):
    name: str
    previous: float
    current: float
    diff: float
    improved: bool
    label: str

class WhatChangedInfo(BaseModel):
    title: str
    summary: str
    metrics: List[WhatChangedMetric]

# Home Dashboard
class PatientHomeResponse(BaseModel):
    patient_id: int
    full_name: str
    condition_name: str
    recovery_type: str
    current_day: int
    expected_duration_days: int
    status: str  # on_track, slightly_behind, recovering_faster, significant_deviation
    care_team_status: str  # reviewed, update_pending, monitoring, no_recent_update
    monitoring_completed: bool
    completion_message: Optional[str] = None
    momentum: MomentumInfo
    what_changed: WhatChangedInfo
    mini_trajectory: List[TrajectoryPoint]
    latest_care_team_update: Optional[str] = None
    open_alerts_count: int
    confidence_score: float
    projected_range: str

# Prediction
class PredictionOut(BaseModel):
    id: int
    version: int
    projected_days_min: int
    projected_days_max: int
    projected_range_str: str
    confidence_score: float
    status_state: str
    generated_at: datetime
    reason: str
    previous_range: Optional[str] = None

# Alert
class AlertOut(BaseModel):
    id: int
    patient_id: int
    tier: str  # informational, monitor, review_suggested, priority_review
    status: str  # open, reviewed, escalated
    title: str
    reason: str
    persistence_count: int
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    linked_indicator: Optional[str] = None

class AlertReviewRequest(BaseModel):
    action: str = "reviewed"  # "reviewed", "escalate"
    send_update_message: Optional[str] = None

# Care Team
class CareTeamQueueItem(BaseModel):
    patient_id: int
    patient_name: str
    condition_name: str
    recovery_type: str
    current_day: int
    expected_duration_days: int
    status: str
    urgency_tier: str  # "priority_review", "review_suggested", "monitor", "on_track"
    care_team_status: str
    open_alerts: List[AlertOut]
    latest_checkin_time: Optional[datetime]
    adherence_pct: float

class CareTeamUpdateIn(BaseModel):
    message: str

class CareTeamUpdateOut(BaseModel):
    id: int
    author_name: str
    message: str
    sent_at: datetime
    read_by_patient: bool

class ProfessionalNoteIn(BaseModel):
    note_text: str
    is_patient_visible: bool = True

class ProfessionalNoteOut(BaseModel):
    id: int
    author_name: str
    note_text: str
    is_patient_visible: bool
    created_at: datetime

class RecoveryGoalIn(BaseModel):
    title: str
    target_day: Optional[int] = None

class RecoveryGoalOut(BaseModel):
    id: int
    title: str
    target_day: Optional[int]
    status: str
    created_at: datetime

class CloseMonitoringRequest(BaseModel):
    completion_message: str

# AI Recovery Coach
class AIAskRequest(BaseModel):
    patient_id: int
    question: str
    language: str = "en"

class AIAskResponse(BaseModel):
    answer: str
    safety_disclaimer: str
    data_sources_used: List[str]
