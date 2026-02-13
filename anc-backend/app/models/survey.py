from sqlalchemy import Column, Integer, Float, Boolean, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Survey(Base):
    __tablename__ = "surveys"

    survey_id = Column(Integer, primary_key=True, index=True)
    house_id = Column(Integer, ForeignKey('houses.house_id', ondelete='CASCADE'), unique=True)
    living_room_width = Column(Float, nullable=False)
    living_room_depth = Column(Float, nullable=False)
    ceiling_width = Column(Float)  # 우물천장 가로 (mm)
    ceiling_depth = Column(Float)  # 우물천장 세로 (mm)
    ceiling_start_x = Column(Float)  # 우물천장 시작 X 좌표 (mm)
    ceiling_start_y = Column(Float)  # 우물천장 시작 Y 좌표 (mm)
    ceiling_height = Column(Float)
    speaker_length = Column(Float, default=600.0)  # 스피커 길이 (mm)
    speaker_width = Column(Float, default=130.0)   # 스피커 폭 (mm)
    speaker_height = Column(Float, default=130.0)  # 스피커 높이 (mm)
    has_molding = Column(Boolean, default=False)
    molding_width = Column(Float)
    has_air_conditioner = Column(Boolean, default=False)
    ac_positions = Column(JSON)
    lighting_positions = Column(JSON)
    photo_urls = Column(JSON)
    notes = Column(Text)
    surveyor_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    house = relationship("House", back_populates="survey")
