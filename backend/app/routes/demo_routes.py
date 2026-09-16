from fastapi import APIRouter
from app.seed import seed_database

router = APIRouter(prefix="/demo", tags=["demo"])

@router.post("/reset")
def reset_demo():
    """Resets all synthetic patients, check-ins, and alerts back to pristine demo state."""
    seed_database()
    return {"status": "success", "message": "Demo data successfully reset to baseline."}
