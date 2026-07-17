from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import Annotated, List

import models, schemas, database
from routes.auth import get_current_user
from services.assessment_service import AssessmentService
from services.pdf_service import PdfService

router = APIRouter(prefix="/api/assessments", tags=["assessments"])

@router.post("/", response_model=schemas.AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    request_data: schemas.AssessmentCreateRequest, 
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    """Creates a new assessment by running the AI model on raw input data."""
    # Convert Pydantic model to dict
    raw_dict = request_data.model_dump(exclude_unset=True)
    
    # Save via Service Layer
    db_assessment = AssessmentService.create_assessment(db, current_user, raw_dict)
    return db_assessment

@router.get("/", response_model=List[schemas.AssessmentResponse])
def get_assessments(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    """Returns all assessments for the authenticated user."""
    return AssessmentService.get_user_assessments(db, current_user)

@router.get("/latest")
def get_latest_assessment(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    """Returns the most recent assessment. Returns 200 OK with hasReport false if empty."""
    latest = AssessmentService.get_latest_assessment(db, current_user)
    if not latest:
        return {"hasReport": False, "report": None}
    
    # We must manually map the DB model to the response dict here since we are returning a custom dict
    response_model = schemas.AssessmentResponse.model_validate(latest)
    return {"hasReport": True, "report": response_model}

@router.get("/{assessment_id}", response_model=schemas.AssessmentResponse)
def get_assessment(
    assessment_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    """Returns a specific assessment, verifying ownership."""
    return AssessmentService.get_assessment_by_id(db, current_user, assessment_id)

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    assessment_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    """Deletes a specific assessment, verifying ownership."""
    AssessmentService.delete_assessment(db, current_user, assessment_id)
    return None

@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_and_parse_report(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """Parses a PDF report, extracts biomarkers, and validates them."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported. Please upload a .pdf lab report.")
        
    try:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum allowed size is 5MB.")
            
        extracted = PdfService.extract_biomarkers(content)
        
        # Validation: TSH is mandatory for any thyroid assessment
        if 'tsh' not in extracted:
            raise HTTPException(
                status_code=422, 
                detail="We couldn't confidently extract the thyroid values (TSH) from this report. Please upload a clearer PDF or enter the values manually."
            )
            
        return {"extracted": extracted, "filename": file.filename}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process report: {str(e)}")

@router.put("/{assessment_id}/referral", response_model=schemas.AssessmentResponse)
def update_referral_status(
    assessment_id: str,
    update_data: schemas.ReferralUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Updates the referral status and notes for an ASHA beneficiary assessment."""
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id, 
        models.Assessment.user_id == current_user.id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
        
    assessment.referral_status = update_data.referral_status
    if update_data.follow_up_notes is not None:
        assessment.follow_up_notes = update_data.follow_up_notes
        
    db.commit()
    db.refresh(assessment)
    return assessment

@router.delete("/{assessment_id}")
def delete_assessment(
    assessment_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Deletes an assessment if it belongs to the current user."""
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id, 
        models.Assessment.user_id == current_user.id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
        
    db.delete(assessment)
    db.commit()
    return {"message": "Assessment deleted successfully"}
