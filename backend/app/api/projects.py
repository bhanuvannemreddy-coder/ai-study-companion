from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.project import Project
from app.models.space import Space
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse


router = APIRouter(
    tags=["Projects"]
)


@router.post(
    "/api/spaces/{space_id}/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def create_project(
    space_id: int,
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # First verify that the space belongs to the logged-in user.
    space = (
        db.query(Space)
        .filter(
            Space.id == space_id,
            Space.user_id == current_user.id
        )
        .first()
    )

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )

    new_project = Project(
        space_id=space.id,
        name=project_data.name,
        description=project_data.description,
        learning_goal=project_data.learning_goal
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@router.get(
    "/api/spaces/{space_id}/projects",
    response_model=list[ProjectResponse]
)
def get_projects(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify that the space belongs to the logged-in user.
    space = (
        db.query(Space)
        .filter(
            Space.id == space_id,
            Space.user_id == current_user.id
        )
        .first()
    )

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )

    projects = (
        db.query(Project)
        .filter(Project.space_id == space_id)
        .order_by(Project.created_at.desc())
        .all()
    )

    return projects


@router.get(
    "/api/projects/{project_id}",
    response_model=ProjectResponse
)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .join(Space, Project.space_id == Space.id)
        .filter(
            Project.id == project_id,
            Space.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project


@router.put(
    "/api/projects/{project_id}",
    response_model=ProjectResponse
)
def update_project(
    project_id: int,
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .join(Space, Project.space_id == Space.id)
        .filter(
            Project.id == project_id,
            Space.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project.name = project_data.name
    project.description = project_data.description
    project.learning_goal = project_data.learning_goal

    db.commit()
    db.refresh(project)

    return project


@router.delete(
    "/api/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .join(Space, Project.space_id == Space.id)
        .filter(
            Project.id == project_id,
            Space.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()