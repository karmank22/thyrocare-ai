import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime
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


class HealthRecord(Base):
    """Stores every screening submission for a user — powers personalized history."""
    __tablename__ = "health_records"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Basic info
    age = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)

    # Lab values
    tsh = Column(Float, nullable=True)
    t3 = Column(Float, nullable=True)
    t4 = Column(Float, nullable=True)
    severity_score = Column(Integer, nullable=True)

    # Symptoms (boolean flags)
    fatigue = Column(Boolean, default=False)
    hair_fall = Column(Boolean, default=False)
    weight_gain = Column(Boolean, default=False)
    cold_intolerance = Column(Boolean, default=False)
    menstrual_irregularity = Column(Boolean, default=False)
    mood_changes = Column(Boolean, default=False)
    constipation = Column(Boolean, default=False)
    dry_skin = Column(Boolean, default=False)

    # Medical history
    family_history_thyroid = Column(Boolean, default=False)
    pcos_history = Column(Boolean, default=False)
    pregnancy_status = Column(Boolean, default=False)
    postpartum_flag = Column(Boolean, default=False)
    medication_current = Column(String, nullable=True)

    # Lifestyle
    diet_pref = Column(String, nullable=True)
    iodine_zone = Column(String, nullable=True)

    # AI assessment results
    risk_class = Column(String, nullable=True)      # Normal | Mild | Moderate | High
    risk_score = Column(Float, nullable=True)
    emergency_flag = Column(Boolean, default=False)
    referral_tier = Column(String, nullable=True)
    notes = Column(String, nullable=True)           # Auto-generated summary note
