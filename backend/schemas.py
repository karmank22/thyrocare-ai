from pydantic import BaseModel, field_validator
from typing import Literal
import re

class UserCreate(BaseModel):
    username: str
    password: str
    preferred_name: str
    role: Literal['patient', 'worker']

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.]{3,20}$", v):
            raise ValueError('Username must be 3-20 characters long and contain only letters, numbers, underscores, and dots (no spaces)')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v

class UserResponse(BaseModel):
    id: str
    username: str
    preferred_name: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class HealthRecordBase(BaseModel):
    age: float | None = None
    bmi: float | None = None
    tsh: float | None = None
    t3: float | None = None
    t4: float | None = None
    severity_score: int | None = None
    fatigue: bool = False
    hair_fall: bool = False
    weight_gain: bool = False
    cold_intolerance: bool = False
    menstrual_irregularity: bool = False
    mood_changes: bool = False
    constipation: bool = False
    dry_skin: bool = False
    family_history_thyroid: bool = False
    pcos_history: bool = False
    pregnancy_status: bool = False
    postpartum_flag: bool = False
    medication_current: str | None = None
    diet_pref: str | None = None
    iodine_zone: str | None = None

    # AI assessment results
    risk_class: str | None = None
    risk_score: float | None = None
    emergency_flag: bool = False
    referral_tier: str | None = None
    notes: str | None = None

class HealthRecordCreate(HealthRecordBase):
    pass

class HealthRecordResponse(HealthRecordBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True
