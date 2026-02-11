from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.core.database import get_db
from app.models.house import House
from app.models.survey import Survey
from app.schemas.schemas import SurveyCreate, SurveyResponse

router = APIRouter()


@router.get("/houses/{house_id}/survey", response_model=SurveyResponse)
def get_survey(house_id: int, db: Session = Depends(get_db)):
    """실사 데이터 조회"""
    survey = db.query(Survey).filter(Survey.house_id == house_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


@router.post("/houses/{house_id}/survey", response_model=SurveyResponse)
def create_or_update_survey(house_id: int, survey: SurveyCreate, db: Session = Depends(get_db)):
    """실사 데이터 생성/수정"""
    # 세대 존재 확인
    house = db.query(House).filter(House.house_id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    # 기존 실사 데이터 확인
    existing_survey = db.query(Survey).filter(Survey.house_id == house_id).first()
    
    if existing_survey:
        # 업데이트
        for key, value in survey.dict().items():
            setattr(existing_survey, key, value)
        db.commit()
        db.refresh(existing_survey)
        
        # 세대 실사 날짜 업데이트
        house.survey_date = date.today()
        db.commit()
        
        return existing_survey
    else:
        # 생성
        db_survey = Survey(**survey.dict(), house_id=house_id)
        db.add(db_survey)
        
        # 세대 실사 날짜 업데이트
        house.survey_date = date.today()
        
        db.commit()
        db.refresh(db_survey)
        return db_survey
