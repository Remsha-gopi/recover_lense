from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Patient, CareTeamMember
from app.schemas import Token, LoginRequest, DemoLoginRequest, UserOut
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    patient_id = user.patient_profile.id if user.patient_profile else None
    care_team_id = user.care_team_profile.id if user.care_team_profile else None

    token_data = {
        "user_id": user.id,
        "role": user.role,
        "patient_id": patient_id,
        "care_team_id": care_team_id
    }
    access_token = create_access_token(token_data)

    return Token(
        access_token=access_token,
        role=user.role,
        user_id=user.id,
        patient_id=patient_id,
        care_team_id=care_team_id,
        full_name=user.full_name,
        language_preference=user.language_preference
    )

@router.post("/demo-login", response_model=Token)
def demo_login(req: DemoLoginRequest, db: Session = Depends(get_db)):
    """Quick demo login for judging & testing"""
    if req.role == "care_team":
        user = db.query(User).filter(User.email == "dr.sharma@recoverlens.demo").first()
    else:
        # Patient mapping
        code_to_email = {
            "meera": "meera@recoverlens.demo",
            "arjun": "arjun@recoverlens.demo",
            "priya": "priya@recoverlens.demo"
        }
        target_email = code_to_email.get(req.demo_patient_code, "arjun@recoverlens.demo")
        user = db.query(User).filter(User.email == target_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found. Please reset database.")

    patient_id = user.patient_profile.id if user.patient_profile else None
    care_team_id = user.care_team_profile.id if user.care_team_profile else None

    token_data = {
        "user_id": user.id,
        "role": user.role,
        "patient_id": patient_id,
        "care_team_id": care_team_id
    }
    access_token = create_access_token(token_data)

    return Token(
        access_token=access_token,
        role=user.role,
        user_id=user.id,
        patient_id=patient_id,
        care_team_id=care_team_id,
        full_name=user.full_name,
        language_preference=user.language_preference
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
