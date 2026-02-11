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
    ceiling_height = Column(Float)
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
