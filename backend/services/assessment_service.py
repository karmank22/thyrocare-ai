import json
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from models import Assessment, User
from services.ai_service import AIService

logger = logging.getLogger("thyrocare.assessment_service")

class AssessmentService:
    @staticmethod
    def create_assessment(db: Session, user: User, raw_data: dict) -> Assessment:
        """
        Executes AI predictions and saves the assessment in a transaction.
        """
        try:
            # 1. AI Prediction
            ai_result = AIService.compute_risk(raw_data)
            
            # 2. Recommendations
            recs = AIService.generate_recommendations(
                risk_class=ai_result["risk_class"],
                emergency_flag=ai_result["emergency_flag"],
                data=raw_data
            )
            
            # 3. Create DB Model
            db_assessment = Assessment(
                user_id=user.id,
                # Raw inputs
                age=raw_data.get("age"),
                bmi=raw_data.get("bmi"),
                tsh=raw_data.get("tsh"),
                t3=raw_data.get("t3"),
                t4=raw_data.get("t4"),
                severity_score=raw_data.get("severity_score"),
                fatigue=raw_data.get("fatigue", False),
                hair_fall=raw_data.get("hair_fall", False),
                weight_gain=raw_data.get("weight_gain", False),
                cold_intolerance=raw_data.get("cold_intolerance", False),
                menstrual_irregularity=raw_data.get("menstrual_irregularity", False),
                mood_changes=raw_data.get("mood_changes", False),
                constipation=raw_data.get("constipation", False),
                dry_skin=raw_data.get("dry_skin", False),
                family_history_thyroid=raw_data.get("family_history_thyroid", False),
                pcos_history=raw_data.get("pcos_history", False),
                pregnancy_status=raw_data.get("pregnancy_status", False),
                postpartum_flag=raw_data.get("postpartum_flag", False),
                medication_current=raw_data.get("medication_current"),
                diet_pref=raw_data.get("diet_pref"),
                iodine_zone=raw_data.get("iodine_zone"),
                
                # AI Outputs
                model_version=ai_result["model_version"],
                risk_class=ai_result["risk_class"],
                risk_score=ai_result["risk_score"],
                emergency_flag=ai_result["emergency_flag"],
                top_features=json.dumps(ai_result["top_features"]),
                recommendations_json=json.dumps(recs)
            )

            # Transaction Start
            db.add(db_assessment)
            db.commit()
            db.refresh(db_assessment)
            
            logger.info(f"Assessment {db_assessment.id} created successfully for user {user.id}")
            return db_assessment
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database transaction failed during assessment creation: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal database error. Transaction rolled back.")
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error during assessment creation: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to process assessment.")

    @staticmethod
    def get_user_assessments(db: Session, user: User) -> List[Assessment]:
        """Returns all assessments for a user, sorted newest first."""
        return db.query(Assessment).filter(Assessment.user_id == user.id).order_by(Assessment.created_at.desc()).all()

    @staticmethod
    def get_latest_assessment(db: Session, user: User) -> Optional[Assessment]:
        """Returns the most recent assessment for a user."""
        return db.query(Assessment).filter(Assessment.user_id == user.id).order_by(Assessment.created_at.desc()).first()

    @staticmethod
    def get_assessment_by_id(db: Session, user: User, assessment_id: str) -> Assessment:
        """Returns a specific assessment, verifying ownership."""
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == user.id).first()
        if not assessment:
            logger.warning(f"Unauthorized or missing assessment access attempt by user {user.id} for {assessment_id}")
            raise HTTPException(status_code=404, detail="Assessment not found.")
        return assessment

    @staticmethod
    def delete_assessment(db: Session, user: User, assessment_id: str) -> bool:
        """Deletes a specific assessment, verifying ownership."""
        try:
            assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == user.id).first()
            if not assessment:
                raise HTTPException(status_code=404, detail="Assessment not found.")
            
            db.delete(assessment)
            db.commit()
            logger.info(f"Assessment {assessment_id} deleted by user {user.id}")
            return True
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to delete assessment {assessment_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal database error. Transaction rolled back.")
