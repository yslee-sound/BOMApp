from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.core.database import get_db
from app.models.house import House
from app.models.survey import Survey
from app.models.design import Design
from app.models.bom import BOM
from app.schemas.schemas import DesignResponse, AutoDesignRequest, BOMResponse
from app.services.layout_service import LayoutService
from app.services.bom_service import BOMService

router = APIRouter()
layout_service = LayoutService()
bom_service = BOMService()


@router.post("/houses/{house_id}/design/auto", response_model=DesignResponse)
def auto_design(house_id: int, request: AutoDesignRequest, db: Session = Depends(get_db)):
    """자동 설계 생성"""
    # 세대 및 실사 데이터 확인
    house = db.query(House).filter(House.house_id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    survey = db.query(Survey).filter(Survey.house_id == house_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey data not found. Please complete survey first.")
    
    # 자동 배치 생성
    design_result = layout_service.auto_design(
        width=survey.living_room_width,
        depth=survey.living_room_depth,
        obstacles=request.obstacles,
        offset=request.offset,
        speaker_width=survey.speaker_width or 130.0,
        speaker_length=survey.speaker_length or 600.0,
        min_gap=request.min_gap or 100.0,  # 요청에서 받은 최소 스피커 간격 사용
        max_gap=request.max_gap or 600.0,  # 최대 스피커 간격
        horizontal_count=request.horizontal_count,  # 가로 스피커 개수 (None이면 자동)
        vertical_count=request.vertical_count,  # 세로 스피커 개수 (None이면 자동)
        ceiling_width=survey.ceiling_width,  # 실사에서 입력한 우물천장 가로
        ceiling_depth=survey.ceiling_depth,  # 실사에서 입력한 우물천장 세로
        ceiling_start_x=survey.ceiling_start_x,  # 우물천장 시작 X 좌표
        ceiling_start_y=survey.ceiling_start_y  # 우물천장 시작 Y 좌표
    )
    
    # 기존 설계 확인
    existing_design = db.query(Design).filter(Design.house_id == house_id).first()
    
    if existing_design:
        # 업데이트
        existing_design.vs_positions = design_result["vs_positions"]
        existing_design.spk_positions = design_result["spk_positions"]
        existing_design.controller_position = design_result["controller_position"]
        existing_design.speaker_gaps = design_result["speaker_gaps"]
        existing_design.design_version += 1
        db.commit()
        db.refresh(existing_design)
        
        # BOM 재계산
        update_bom(existing_design.design_id, db)
        
        # 명시적으로 응답 생성
        return DesignResponse(
            design_id=existing_design.design_id,
            house_id=existing_design.house_id,
            vs_positions=existing_design.vs_positions,
            spk_positions=existing_design.spk_positions,
            controller_position=existing_design.controller_position,
            design_version=existing_design.design_version,
            is_approved=existing_design.is_approved,
            created_at=existing_design.created_at,
            speaker_gaps=design_result["speaker_gaps"]
        )
    else:
        # 생성
        db_design = Design(
            house_id=house_id,
            vs_positions=design_result["vs_positions"],
            spk_positions=design_result["spk_positions"],
            controller_position=design_result["controller_position"],
            speaker_gaps=design_result["speaker_gaps"]
        )
        db.add(db_design)
        
        # 세대 설계 날짜 업데이트
        house.design_date = date.today()
        
        db.commit()
        db.refresh(db_design)
        
        # BOM 생성
        create_bom(db_design.design_id, db)
        
        # 명시적으로 응답 생성
        return DesignResponse(
            design_id=db_design.design_id,
            house_id=db_design.house_id,
            vs_positions=db_design.vs_positions,
            spk_positions=db_design.spk_positions,
            controller_position=db_design.controller_position,
            design_version=db_design.design_version,
            is_approved=db_design.is_approved,
            created_at=db_design.created_at,
            speaker_gaps=design_result["speaker_gaps"]
        )


@router.get("/houses/{house_id}/design", response_model=DesignResponse)
def get_design(house_id: int, db: Session = Depends(get_db)):
    """설계 조회"""
    design = db.query(Design).filter(Design.house_id == house_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Survey 정보를 가져와서 speaker_gaps 계산
    survey = db.query(Survey).filter(Survey.house_id == house_id).first()
    speaker_gaps = {}
    if survey:
        design_result = layout_service.auto_design(
            width=survey.living_room_width,
            depth=survey.living_room_depth,
            speaker_width=survey.speaker_width or 130.0,
            speaker_length=survey.speaker_length or 600.0,
            min_gap=100.0,
            ceiling_width=survey.ceiling_width,
            ceiling_depth=survey.ceiling_depth
        )
        speaker_gaps = design_result.get("speaker_gaps", {})
    
    return DesignResponse(
        design_id=design.design_id,
        house_id=design.house_id,
        vs_positions=design.vs_positions,
        spk_positions=design.spk_positions,
        controller_position=design.controller_position,
        design_version=design.design_version,
        is_approved=design.is_approved,
        created_at=design.created_at,
        speaker_gaps=speaker_gaps
    )


@router.put("/houses/{house_id}/design", response_model=DesignResponse)
def update_design(house_id: int, design_data: dict, db: Session = Depends(get_db)):
    """설계 수동 수정"""
    design = db.query(Design).filter(Design.house_id == house_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # 위치 정보 업데이트
    if "vs_positions" in design_data:
        design.vs_positions = design_data["vs_positions"]
    if "spk_positions" in design_data:
        design.spk_positions = design_data["spk_positions"]
    if "controller_position" in design_data:
        design.controller_position = design_data["controller_position"]
    
    design.design_version += 1
    db.commit()
    db.refresh(design)
    
    # BOM 재계산
    update_bom(design.design_id, db)
    
    # Survey 정보를 가져와서 speaker_gaps 계산
    survey = db.query(Survey).filter(Survey.house_id == house_id).first()
    speaker_gaps = {}
    if survey:
        design_result = layout_service.auto_design(
            width=survey.living_room_width,
            depth=survey.living_room_depth,
            speaker_width=survey.speaker_width or 130.0,
            speaker_length=survey.speaker_length or 600.0,
            min_gap=200.0
        )
        speaker_gaps = design_result.get("speaker_gaps", {})
    
    return DesignResponse(
        design_id=design.design_id,
        house_id=design.house_id,
        vs_positions=design.vs_positions,
        spk_positions=design.spk_positions,
        controller_position=design.controller_position,
        design_version=design.design_version,
        is_approved=design.is_approved,
        created_at=design.created_at,
        speaker_gaps=speaker_gaps
    )


@router.get("/designs/{design_id}/bom", response_model=BOMResponse)
def get_bom(design_id: int, db: Session = Depends(get_db)):
    """BOM 조회"""
    design = db.query(Design).filter(Design.design_id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    bom = db.query(BOM).filter(BOM.design_id == design_id).first()
    if not bom:
        # BOM이 없으면 생성
        bom = create_bom(design_id, db)
    
    # Materials 정보 추가
    bom_dict = {
        "bom_id": bom.bom_id,
        "design_id": bom.design_id,
        "vibration_sensors": bom.vibration_sensors,
        "speakers": bom.speakers,
        "controller": bom.controller,
        "adapter": bom.adapter,
        "sd_card": bom.sd_card,
        "cable_1_2m": bom.cable_1_2m,
        "cable_7_0m": bom.cable_7_0m,
        "total_cable_length": bom.total_cable_length,
        "total_cost": bom.total_cost,
        "created_at": bom.created_at
    }
    
    # Materials 계산
    bom_result = bom_service.calculate_bom(
        design.vs_positions,
        design.spk_positions,
        design.controller_position or {"x": 0, "y": 0}
    )
    bom_dict["materials"] = bom_result["materials"]
    
    return bom_dict


def create_bom(design_id: int, db: Session) -> BOM:
    """BOM 생성"""
    design = db.query(Design).filter(Design.design_id == design_id).first()
    
    bom_result = bom_service.calculate_bom(
        design.vs_positions,
        design.spk_positions,
        design.controller_position or {"x": 0, "y": 0}
    )
    
    db_bom = BOM(
        design_id=design_id,
        vibration_sensors=bom_result["vibration_sensors"],
        speakers=bom_result["speakers"],
        controller=bom_result["controller"],
        adapter=bom_result["adapter"],
        sd_card=bom_result["sd_card"],
        cable_1_2m=bom_result["cable_1_2m"],
        cable_7_0m=bom_result["cable_7_0m"],
        total_cable_length=bom_result["total_cable_length"],
        total_cost=bom_result["total_cost"]
    )
    db.add(db_bom)
    db.commit()
    db.refresh(db_bom)
    return db_bom


def update_bom(design_id: int, db: Session):
    """BOM 업데이트"""
    design = db.query(Design).filter(Design.design_id == design_id).first()
    bom = db.query(BOM).filter(BOM.design_id == design_id).first()
    
    bom_result = bom_service.calculate_bom(
        design.vs_positions,
        design.spk_positions,
        design.controller_position or {"x": 0, "y": 0}
    )
    
    if bom:
        for key, value in bom_result.items():
            if key != "materials":
                setattr(bom, key, value)
        db.commit()
