from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class BOM(Base):
    __tablename__ = "bom"

    bom_id = Column(Integer, primary_key=True, index=True)
    design_id = Column(Integer, ForeignKey('designs.design_id', ondelete='CASCADE'), unique=True)
    vibration_sensors = Column(Integer, default=9)
    speakers = Column(Integer, default=0)
    controller = Column(Integer, default=1)
    adapter = Column(Integer, default=1)
    sd_card = Column(Integer, default=1)
    cable_1_2m = Column(Integer, default=0)
    cable_7_0m = Column(Integer, default=0)
    total_cable_length = Column(Float)
    total_cost = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    design = relationship("Design", back_populates="bom")
