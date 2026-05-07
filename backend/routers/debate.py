"""
Debate Router
Handles debate-related API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, AsyncIterator, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import logging
import json
import asyncio
from datetime import timezone

from database import get_db
from models.debate import Debate
from orchestrator import get_orchestrator

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


def format_sse_event(event: Dict[str, Any]) -> str:
    """Format a JSON-serializable event for Server-Sent Events."""
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def validate_debate_topic(raw_topic: str) -> str:
    """Validate and normalize a debate topic."""
    topic = raw_topic.strip()
    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Topic cannot be empty"
        )

    if len(topic) < 10:
        raise HTTPException(
            status_code=400,
            detail="Topic must be at least 10 characters long"
        )

    return topic


class DebateStartRequest(BaseModel):
    """Request model for starting a debate"""
    topic: str = Field(..., min_length=1, max_length=500, description="The debate topic")
    debate_id: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional client-generated debate ID for streaming routes"
    )


class ArgumentResponse(BaseModel):
    """Response model for an argument"""
    agent_name: str
    agent_role: str
    content: str
    round_number: int
    timestamp: Optional[str] = None


class ConsensusResponse(BaseModel):
    """Response model for consensus"""
    content: str
    key_points: List[str]


class DebateResponse(BaseModel):
    """Response model for debate results"""
    debate_id: str
    topic: str
    status: str
    arguments: List[ArgumentResponse]
    consensus: Optional[ConsensusResponse] = None
    total_rounds: int
    total_arguments: int
    created_at: str
    completed_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.post("/start", response_model=DebateResponse)
async def start_debate(
    request: DebateStartRequest,
    db: AsyncSession = Depends(get_db)
) -> DebateResponse:
    """
    Start a new debate session.
    
    This endpoint initiates a multi-agent debate on the provided topic.
    The debate runs up to 7 rounds with 4 agents, then generates a consensus.
    
    Args:
        request: Debate configuration with topic
        db: Database session dependency
        
    Returns:
        DebateResponse with complete debate data including all arguments and consensus
        
    Raises:
        HTTPException: 400 for invalid input, 500 for orchestration errors
    """
    topic = validate_debate_topic(request.topic)
    
    logger.info(f"Starting debate with topic: {topic[:100]}...")
    
    try:
        # Get orchestrator and run debate
        orchestrator = get_orchestrator()
        debate_state = await orchestrator.run_debate(
            topic=topic,
            db_session=db
        )
        
        # Check if debate completed successfully
        if debate_state["status"] == "failed":
            error_msg = debate_state.get("error", "Unknown error occurred during debate")
            logger.error(f"Debate failed: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=f"Debate execution failed: {error_msg}"
            )
        
        # Convert state to response format
        arguments = [
            ArgumentResponse(
                agent_name=arg["agent_name"],
                agent_role=arg["agent_role"],
                content=arg["content"],
                round_number=arg["round_number"],
                timestamp=arg.get("timestamp")
            )
            for arg in debate_state["arguments"]
        ]
        total_rounds = max((arg.round_number for arg in arguments), default=0)
        
        consensus = None
        if debate_state.get("consensus"):
            consensus_data = debate_state["consensus"]
            consensus = ConsensusResponse(
                content=consensus_data["content"],
                key_points=consensus_data["key_points"]
            )
        
        logger.info(f"Debate completed successfully: {debate_state['debate_id']}")
        
        return DebateResponse(
            debate_id=debate_state["debate_id"],
            topic=debate_state["topic"],
            status=debate_state["status"],
            arguments=arguments,
            consensus=consensus,
            total_rounds=total_rounds,
            total_arguments=len(arguments),
            created_at=debate_state.get("created_at", ""),
            completed_at=debate_state.get("completed_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running debate: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/start/stream")
async def start_debate_stream(
    request: DebateStartRequest
) -> StreamingResponse:
    """
    Start a new debate session and stream progress events via SSE.

    The stream emits a JSON event after each round boundary, argument,
    consensus generation, and completion.
    """
    topic = validate_debate_topic(request.topic)
    logger.info(f"Starting streamed debate with topic: {topic[:100]}...")

    async def event_generator() -> AsyncIterator[str]:
        try:
            orchestrator = get_orchestrator()
            async for event in orchestrator.run_debate_stream(
                topic=topic,
                debate_id=request.debate_id,
            ):
                yield format_sse_event(event)
        except asyncio.CancelledError:
            logger.info(f"Stream cancelled by client for debate: {request.debate_id}")
            # Do not yield further, simply return to end the generator cleanly
            return
        except Exception as e:
            logger.error(f"Error streaming debate: {str(e)}", exc_info=True)
            yield format_sse_event({
                "type": "error",
                "message": str(e),
            })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{debate_id}", response_model=DebateResponse)
async def get_debate(
    debate_id: str,
    db: AsyncSession = Depends(get_db)
) -> DebateResponse:
    """
    Get debate status and results by ID.
    
    Retrieves a complete debate record including all arguments and consensus.
    
    Args:
        debate_id: Unique debate identifier
        db: Database session dependency
        
    Returns:
        DebateResponse with current debate state
        
    Raises:
        HTTPException: 404 if debate not found, 500 for database errors
    """
    logger.info(f"Retrieving debate: {debate_id}")
    
    try:
        # Query debate with eager loading of arguments
        stmt = select(Debate).where(Debate.id == debate_id)
        result = await db.execute(stmt)
        debate = result.scalar_one_or_none()
        
        if not debate:
            logger.warning(f"Debate not found: {debate_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Debate with ID {debate_id} not found"
            )
        
        # Convert arguments from JSON to response format
        arguments = []
        if debate.arguments:
            arguments = [
                ArgumentResponse(
                    agent_name=arg["agent_name"],
                    agent_role=arg["agent_role"],
                    content=arg["content"],
                    round_number=arg["round_number"],
                    timestamp=arg.get("timestamp")
                )
                for arg in debate.arguments
            ]
        
        # Convert consensus from JSON to response format
        consensus = None
        if debate.consensus:
            consensus = ConsensusResponse(
                content=debate.consensus["content"],
                key_points=debate.consensus["key_points"]
            )
        
        logger.info(f"Successfully retrieved debate: {debate_id}")
        
        return DebateResponse(
            debate_id=debate.id,
            topic=debate.topic,
            status=debate.status.value,
            arguments=arguments,
            consensus=consensus,
            total_rounds=debate.total_rounds,
            total_arguments=debate.total_arguments,
            created_at=debate.created_at.replace(tzinfo=timezone.utc).isoformat() if debate.created_at else "",
            completed_at=debate.completed_at.replace(tzinfo=timezone.utc).isoformat() if debate.completed_at else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving debate {debate_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/", response_model=List[DebateResponse])
async def list_debates(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=1000, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db)
) -> List[DebateResponse]:
    """
    List all debates with pagination.
    
    Returns debates ordered by creation date (newest first).
    
    Args:
        skip: Number of records to skip (default: 0)
        limit: Maximum number of records to return (default: 10, max: 100)
        db: Database session dependency
        
    Returns:
        List of DebateResponse objects
        
    Raises:
        HTTPException: 500 for database errors
    """
    logger.info(f"Listing debates: skip={skip}, limit={limit}")
    
    try:
        # Query debates ordered by created_at descending
        stmt = (
            select(Debate)
            .order_by(desc(Debate.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        debates = result.scalars().all()
        
        # Convert to response format
        response_list = []
        for debate in debates:
            # Convert arguments from JSON
            arguments = []
            if debate.arguments:
                arguments = [
                    ArgumentResponse(
                        agent_name=arg["agent_name"],
                        agent_role=arg["agent_role"],
                        content=arg["content"],
                        round_number=arg["round_number"],
                        timestamp=arg.get("timestamp")
                    )
                    for arg in debate.arguments
                ]
            
            # Convert consensus from JSON
            consensus = None
            if debate.consensus:
                consensus = ConsensusResponse(
                    content=debate.consensus["content"],
                    key_points=debate.consensus["key_points"]
                )
            
            response_list.append(
                DebateResponse(
                    debate_id=debate.id,
                    topic=debate.topic,
                    status=debate.status.value,
                    arguments=arguments,
                    consensus=consensus,
                    total_rounds=debate.total_rounds,
                    total_arguments=debate.total_arguments,
                    created_at=debate.created_at.replace(tzinfo=timezone.utc).isoformat() if debate.created_at else "",
                    completed_at=debate.completed_at.replace(tzinfo=timezone.utc).isoformat() if debate.completed_at else None
                )
            )
        
        logger.info(f"Successfully retrieved {len(response_list)} debates")
        return response_list
        
    except Exception as e:
        logger.error(f"Error listing debates: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Made with Bob
