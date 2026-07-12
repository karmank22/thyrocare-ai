from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

import models, schemas, database
from routes.auth import get_current_user

router = APIRouter(prefix="/api/records", tags=["records"])

@router.post("/", response_model=schemas.HealthRecordResponse)
def create_record(
    record: schemas.HealthRecordCreate, 
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    # In a real app, you might run the ML model here instead of trusting frontend.
    # For now, we trust the frontend assessment and just save it.
    
    db_record = models.HealthRecord(
        **record.model_dump(),
        user_id=current_user.id
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.get("/me", response_model=schemas.HealthRecordResponse)
def get_my_latest_record(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    # Fetch the latest record for this user
    record = db.query(models.HealthRecord)\
               .filter(models.HealthRecord.user_id == current_user.id)\
               .order_by(models.HealthRecord.created_at.desc())\
               .first()
    
    if not record:
        raise HTTPException(status_code=404, detail="No health records found")
        
    return record
