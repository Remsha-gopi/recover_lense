from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import User
from app.seed import seed_database
from app.routes import auth_routes, patient_routes, careteam_routes, ai_routes, demo_routes

# Ensure tables exist
Base.metadata.create_all(bind=engine)

# Auto-seed if database is fresh/empty (e.g. Vercel serverless /tmp instance)
try:
    _db = SessionLocal()
    if not _db.query(User).first():
        seed_database()
    _db.close()
except Exception as _e:
    print("Startup auto-seed check:", _e)

app = FastAPI(
    title="RecoverLens API",
    description="AI-powered continuous recovery monitoring & clinical decision support platform",
    version=settings.VERSION
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For prototype flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(patient_routes.router, prefix=settings.API_PREFIX)
app.include_router(careteam_routes.router, prefix=settings.API_PREFIX)
app.include_router(ai_routes.router, prefix=settings.API_PREFIX)
app.include_router(demo_routes.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "service": "RecoverLens Clinical Decision Support API",
        "status": "operational",
        "disclaimer": "RecoverLens provides recovery monitoring and decision support only. It never diagnoses, prescribes, or replaces professional medical judgment."
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}
