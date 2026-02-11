from sqlalchemy import Column, Integer, Boolean, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Design(Base):
    __tablename__ = "designs"

    design_id = Column(Integer, primary_key=True, index=True)
    house_id = Column(Integer, ForeignKey('houses.house_id', ondelete='CASCADE'), unique=True)
    vs_positions = Column(JSON, nullable=False)
    spk_positions = Column(JSON, nullable=False)
    controller_position = Column(JSON)
    speaker_gaps = Column(JSON)  # 각 변의 스피커 간격 정보
    cable_routing = Column(JSON)
    design_version = Column(Integer, default=1)
    is_approved = Column(Boolean, default=False)
    designer_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    house = relationship("House", back_populates="design")
    bom = relationship("BOM", back_populates="design", uselist=False, cascade="all, delete-orphan")
