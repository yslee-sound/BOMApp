from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class House(Base):
    __tablename__ = "houses"

    house_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.project_id', ondelete='CASCADE'))
    house_number = Column(String(50), nullable=False)
    floor_plan_type = Column(String(50))
    survey_date = Column(Date)
    design_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="houses")
    survey = relationship("Survey", back_populates="house", uselist=False, cascade="all, delete-orphan")
    design = relationship("Design", back_populates="house", uselist=False, cascade="all, delete-orphan")
