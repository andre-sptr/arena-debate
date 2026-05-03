"""
History Router
Handles debate history and analytics endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, delete
import logging

from database import get_db
from models.debate import Debate, Argument, DebateStatus

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


class DebateSummary(BaseModel):
    """Summary model for debate history"""
    debate_id: str
    topic: str
    created_at: datetime
    status: str
    num_rounds: int
    consensus_reached: bool


class HistoryResponse(BaseModel):
    """Response model for history listing"""
    debates: List[DebateSummary]
    total: int
    page: int
    page_size: int


class HistoryItemResponse(BaseModel):
    """Simplified debate info for history listing"""
    id: str
    topic: str
    status: str
    created_at: str
    total_arguments: int


class StatsResponse(BaseModel):
    """Response model for statistics"""
    total_debates: int
    total_arguments: int
    debates_by_status: Dict[str, int]
    avg_arguments_per_debate: float


@router.get("/", response_model=List[HistoryItemResponse])
async def get_history(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=1000, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db)
) -> List[HistoryItemResponse]:
    """
    List all debates with pagination.
    
    Returns debates ordered by creation date (newest first).
    
    Args:
        skip: Number of records to skip (default: 0)
        limit: Maximum number of records to return (default: 10, max: 100)
        db: Database session dependency
        
    Returns:
        List of HistoryItemResponse with simplified debate info
        
    Raises:
        HTTPException: 500 for database errors
    """
    logger.info(f"Listing debate history: skip={skip}, limit={limit}")
    
    try:
        # Query debates ordered by created_at descending (newest first)
        stmt = (
            select(Debate)
            .order_by(desc(Debate.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        debates = result.scalars().all()
        
        # Convert to response format
        response_list = [
            HistoryItemResponse(
                id=debate.id,
                topic=debate.topic,
                status=debate.status.value,
                created_at=debate.created_at.isoformat() if debate.created_at else "",
                total_arguments=debate.total_arguments
            )
            for debate in debates
        ]
        
        logger.info(f"Successfully retrieved {len(response_list)} debates from history")
        return response_list
        
    except Exception as e:
        logger.error(f"Error listing debate history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete("/{debate_id}")
async def delete_debate(
    debate_id: str,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    Delete a debate and all its arguments from the database.
    
    Uses cascade delete to remove all related arguments.
    
    Args:
        debate_id: Unique debate identifier
        db: Database session dependency
        
    Returns:
        Success message with deleted debate ID
        
    Raises:
        HTTPException: 404 if debate not found, 500 for database errors
    """
    logger.info(f"Attempting to delete debate: {debate_id}")
    
    try:
        # Check if debate exists
        stmt = select(Debate).where(Debate.id == debate_id)
        result = await db.execute(stmt)
        debate = result.scalar_one_or_none()
        
        if not debate:
            logger.warning(f"Debate not found for deletion: {debate_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Debate with ID {debate_id} not found"
            )
        
        # Delete all arguments associated with this debate
        delete_args_stmt = delete(Argument).where(Argument.debate_id == debate_id)
        await db.execute(delete_args_stmt)
        logger.info(f"Deleted arguments for debate: {debate_id}")
        
        # Delete the debate
        await db.delete(debate)
        await db.commit()
        
        logger.info(f"Successfully deleted debate: {debate_id}")
        return {
            "message": "Debate deleted successfully",
            "debate_id": debate_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting debate {debate_id}: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/stats", response_model=StatsResponse)
async def get_statistics(
    db: AsyncSession = Depends(get_db)
) -> StatsResponse:
    """
    Get statistics about all debates.
    
    Calculates:
    - Total number of debates
    - Total number of arguments across all debates
    - Count of debates by status
    - Average arguments per debate
    
    Args:
        db: Database session dependency
        
    Returns:
        StatsResponse with comprehensive debate statistics
        
    Raises:
        HTTPException: 500 for database errors
    """
    logger.info("Calculating debate statistics")
    
    try:
        # Get total debates count
        total_debates_stmt = select(func.count(Debate.id))
        total_debates_result = await db.execute(total_debates_stmt)
        total_debates = total_debates_result.scalar() or 0
        
        # Get total arguments count
        total_args_stmt = select(func.count(Argument.id))
        total_args_result = await db.execute(total_args_stmt)
        total_arguments = total_args_result.scalar() or 0
        
        # Get debates by status
        debates_by_status = {}
        for status in DebateStatus:
            status_stmt = select(func.count(Debate.id)).where(Debate.status == status)
            status_result = await db.execute(status_stmt)
            count = status_result.scalar() or 0
            debates_by_status[status.value] = count
        
        # Calculate average arguments per debate
        avg_arguments_per_debate = 0.0
        if total_debates > 0:
            avg_arguments_per_debate = round(total_arguments / total_debates, 2)
        
        logger.info(
            f"Statistics calculated: {total_debates} debates, "
            f"{total_arguments} arguments, avg {avg_arguments_per_debate}"
        )
        
        return StatsResponse(
            total_debates=total_debates,
            total_arguments=total_arguments,
            debates_by_status=debates_by_status,
            avg_arguments_per_debate=avg_arguments_per_debate
        )
        
    except Exception as e:
        logger.error(f"Error calculating statistics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Made with Bob
