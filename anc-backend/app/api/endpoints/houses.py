from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.models.house import House
from app.models.project import Project
from app.schemas.schemas import HouseCreate, HouseResponse

router = APIRouter()


@router.get("/projects/{project_id}/houses", response_model=List[HouseResponse])
def get_houses(project_id: int, db: Session = Depends(get_db)):
    """프로젝트의 세대 목록 조회"""
    houses = db.query(House).filter(House.project_id == project_id).all()
    return houses


@router.post("/projects/{project_id}/houses", response_model=HouseResponse)
def create_house(project_id: int, house: HouseCreate, db: Session = Depends(get_db)):
    """세대 추가"""
    # 프로젝트 존재 확인
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_house = House(**house.dict(), project_id=project_id)
    db.add(db_house)
    
    # 프로젝트 세대 수 업데이트
    project.total_houses += 1
    
    db.commit()
    db.refresh(db_house)
    return db_house


@router.get("/houses/{house_id}", response_model=HouseResponse)
def get_house(house_id: int, db: Session = Depends(get_db)):
    """세대 상세 조회"""
    house = db.query(House).filter(House.house_id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    return house


@router.delete("/houses/{house_id}")
def delete_house(house_id: int, db: Session = Depends(get_db)):
    """세대 삭제"""
    house = db.query(House).filter(House.house_id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    # 프로젝트 세대 수 업데이트
    project = house.project
    if project:
        project.total_houses = max(0, project.total_houses - 1)
    
    db.delete(house)
    db.commit()
    return {"message": "House deleted successfully"}
