import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    preferred_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'patient' or 'worker'


class Assessment(Base):
    """Stores full raw data and the AI prediction result with versioning."""
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ASHA Beneficiary Tracking
    is_asha_assessment = Column(Boolean, default=False)
    patient_name = Column(String, nullable=True)
    patient_mobile = Column(String, nullable=True)
    patient_village = Column(String, nullable=True)
    referral_status = Column(String, default="Not Referred")
    follow_up_notes = Column(String, nullable=True)

    # 1. Raw Input Data
    age = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    tsh = Column(Float, nullable=True)
    t3 = Column(Float, nullable=True)
    t4 = Column(Float, nullable=True)
    severity_score = Column(Integer, nullable=True)
    fatigue = Column(Boolean, default=False)
    hair_fall = Column(Boolean, default=False)
    weight_gain = Column(Boolean, default=False)
    cold_intolerance = Column(Boolean, default=False)
    menstrual_irregularity = Column(Boolean, default=False)
    mood_changes = Column(Boolean, default=False)
    constipation = Column(Boolean, default=False)
    dry_skin = Column(Boolean, default=False)
    family_history_thyroid = Column(Boolean, default=False)
    pcos_history = Column(Boolean, default=False)
    pregnancy_status = Column(Boolean, default=False)
    postpartum_flag = Column(Boolean, default=False)
    medication_current = Column(String, nullable=True)
    diet_pref = Column(String, nullable=True)
    iodine_zone = Column(String, nullable=True)

    # 2. AI Prediction Data
    model_version = Column(String, nullable=False, default="Ensemble-v1.0")
    risk_class = Column(String, nullable=False)  # Normal | Mild | Moderate | High
    risk_score = Column(Float, nullable=False)   # 0.0 to 1.0 confidence/score
    emergency_flag = Column(Boolean, default=False)
    
    # We can store JSON as String for simple sqlite/neon compatibility without extra dialect dependencies
    top_features = Column(String, nullable=True) # JSON string of SHAP features
    recommendations_json = Column(String, nullable=True) # JSON string of recommendations
