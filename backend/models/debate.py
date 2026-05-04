"""
SQLAlchemy models for debate data
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from database import Base


class DebateStatus(str, enum.Enum):
    """Debate status enum"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Debate(Base):
    """
    Debate model - stores debate metadata and results
    """
    __tablename__ = "debates"

    id = Column(String(36), primary_key=True, index=True)
    topic = Column(Text, nullable=False)
    status = Column(SQLEnum(DebateStatus), default=DebateStatus.PENDING, nullable=False)
    user_id = Column(String(100), nullable=True, index=True)
    
    # Debate results
    arguments = Column(JSON, nullable=True)  # List of all arguments
    consensus = Column(JSON, nullable=True)  # Final consensus
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Statistics
    total_rounds = Column(Integer, default=3)
    total_arguments = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<Debate(id={self.id}, topic={self.topic[:50]}, status={self.status})>"


class Argument(Base):
    """
    Argument model - stores individual arguments from agents
    """
    __tablename__ = "arguments"

    id = Column(String(36), primary_key=True, index=True)
    debate_id = Column(String(36), nullable=False, index=True)
    
    # Agent info
    agent_name = Column(String(50), nullable=False)  # devils_advocate, optimist, etc.
    agent_role = Column(String(100), nullable=False)
    
    # Argument content
    content = Column(Text, nullable=False)
    round_number = Column(Integer, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Argument(id={self.id}, agent={self.agent_name}, round={self.round_number})>"

# Made with Bob
