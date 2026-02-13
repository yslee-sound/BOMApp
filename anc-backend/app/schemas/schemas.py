from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


# Project Schemas
class ProjectBase(BaseModel):
    project_name: str
    location: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    project_id: int
    total_houses: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# House Schemas
class HouseBase(BaseModel):
    house_number: str
    floor_plan_type: Optional[str] = None


class HouseCreate(HouseBase):
    pass


class HouseResponse(HouseBase):
    house_id: int
    project_id: int
    survey_date: Optional[date] = None
    design_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Survey Schemas
class SurveyBase(BaseModel):
    living_room_width: float
    living_room_depth: float
    ceiling_width: Optional[float] = None  # 우물천장 가로 (mm)
    ceiling_depth: Optional[float] = None  # 우물천장 세로 (mm)
    ceiling_start_x: Optional[float] = None  # 우물천장 시작 X 좌표 (mm)
    ceiling_start_y: Optional[float] = None  # 우물천장 시작 Y 좌표 (mm)
    ceiling_height: Optional[float] = None
    speaker_length: Optional[float] = 600.0  # 스피커 길이 (mm)
    speaker_width: Optional[float] = 130.0   # 스피커 폭 (mm)
    speaker_height: Optional[float] = 130.0  # 스피커 높이 (mm)
    has_molding: bool = False
    molding_width: Optional[float] = None
    has_air_conditioner: bool = False
    ac_positions: Optional[List[dict]] = None
    lighting_positions: Optional[List[dict]] = None
    notes: Optional[str] = None
    surveyor_name: Optional[str] = None


class SurveyCreate(SurveyBase):
    pass


class SurveyResponse(SurveyBase):
    survey_id: int
    house_id: int
    photo_urls: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Design Schemas
class DevicePosition(BaseModel):
    id: int
    x: float
    y: float
    type: str
    adjusted: Optional[bool] = False


class DesignBase(BaseModel):
    vs_positions: List[dict]
    spk_positions: List[dict]
    controller_position: Optional[dict] = None
    speaker_gaps: Optional[dict] = None  # 각 변의 스피커 간격 정보


class DesignCreate(DesignBase):
    pass


class DesignResponse(DesignBase):
    design_id: int
    house_id: int
    design_version: int
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# BOM Schemas
class MaterialItem(BaseModel):
    code: str
    name: str
    qty: int
    unit: str
    unit_price: float
    total: float


class BOMResponse(BaseModel):
    bom_id: int
    design_id: int
    vibration_sensors: int
    speakers: int
    controller: int
    adapter: int
    sd_card: int
    cable_1_2m: int
    cable_7_0m: int
    total_cable_length: float
    total_cost: float
    materials: Optional[List[MaterialItem]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Auto Design Request
class AutoDesignRequest(BaseModel):
    obstacles: Optional[List[dict]] = None
    offset: Optional[float] = 300
    min_gap: Optional[float] = 100.0  # 최소 스피커 간격 (mm)
    max_gap: Optional[float] = 600.0  # 최대 스피커 간격 (mm)
    horizontal_count: Optional[int] = None  # 가로 스피커 개수 (None이면 자동 계산)
    vertical_count: Optional[int] = None  # 세로 스피커 개수 (None이면 자동 계산)
