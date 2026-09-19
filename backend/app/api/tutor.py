from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.project import Project
from app.models.space import Space
from app.models.user import User

from app.schemas.tutor import (
    TutorRequest,
    TutorResponse,
)

from app.services.ai.provider import (
    AIProviderError,
)

from app.services.ai.tutor import (
    answer_question,
)

from app.services.analytics.events import (
    record_event,
)


router = APIRouter(
    prefix="/api",
    tags=["Tutor"],
)


@router.post(
    "/projects/{project_id}/tutor",
    response_model=TutorResponse,
)
def ask_tutor(
    project_id: int,
    request: TutorRequest,
    current_user: User = Depends(
        get_current_user
    ),
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

    try:

        response = answer_question(
            db=db,
            user_id=current_user.id,
            project_id=project_id,
            question=request.question,
            top_k=request.top_k,
        )

        record_event(
            db=db,
            user_id=current_user.id,
            project_id=project_id,
            space_id=project.space_id,
            event_type="tutor_interaction",
            title="Tutor interaction",
            description=(
                "Student asked the AI Tutor "
                "a question."
            ),
            event_metadata={
                "grounded": response.grounded,
                "source_count": len(
                    response.sources
                ),
            },
        )

        db.commit()

        return response

    except AIProviderError as exc:

        db.rollback()

        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Tutor failed to generate "
                "an answer."
            ),
        ) from exc