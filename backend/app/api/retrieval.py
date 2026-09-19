from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.project import Project
from app.models.space import Space
from app.models.user import User
from app.schemas.retrieval import (
    RetrievalRequest,
    RetrievalResponse,
    RetrievedChunk,
)
from app.services.rag.retriever import retrieve_chunks


router = APIRouter(
    prefix="/api",
    tags=["Retrieval"],
)


@router.post(
    "/projects/{project_id}/retrieve",
    response_model=RetrievalResponse,
)
def retrieve_project_context(
    project_id: int,
    request: RetrievalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .join(
            Space,
            Project.space_id == Space.id,
        )
        .filter(
            Project.id == project_id,
            Space.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    results = retrieve_chunks(
        db=db,
        project_id=project_id,
        query=request.query,
        top_k=request.top_k,
    )

    return RetrievalResponse(
        query=request.query,
        results=[
            RetrievedChunk(**result)
            for result in results
        ],
    )