from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.project import Project
from app.models.space import Space
from app.models.user import User

from app.schemas.space import (
    SpaceCreate,
    SpaceResponse,
    SpaceWithProjectsResponse,
)


router = APIRouter(
    prefix="/api/spaces",
    tags=["Spaces"],
)


# ==========================================================
# CREATE SPACE
# ==========================================================


@router.post(
    "",
    response_model=SpaceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_space(
    space_data: SpaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_space = Space(
        user_id=current_user.id,
        name=space_data.name,
        description=space_data.description,
    )

    db.add(new_space)
    db.commit()
    db.refresh(new_space)

    return new_space


# ==========================================================
# GET ALL USER SPACES + PROJECTS
# ==========================================================


@router.get(
    "",
    response_model=list[SpaceWithProjectsResponse],
)
def get_spaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ------------------------------------------------------
    # 1. Get ALL spaces belonging to the current user
    # ------------------------------------------------------

    spaces = (
        db.query(Space)
        .filter(
            Space.user_id == current_user.id
        )
        .order_by(
            Space.created_at.desc()
        )
        .all()
    )

    if not spaces:
        return []


    # ------------------------------------------------------
    # 2. Get ALL projects belonging to those spaces
    #    in ONE query
    # ------------------------------------------------------

    space_ids = [
        space.id
        for space in spaces
    ]


    projects = (
        db.query(Project)
        .filter(
            Project.space_id.in_(
                space_ids
            )
        )
        .order_by(
            Project.created_at.desc()
        )
        .all()
    )


    # ------------------------------------------------------
    # 3. Group projects by space_id
    # ------------------------------------------------------

    projects_by_space = {
        space_id: []
        for space_id in space_ids
    }


    for project in projects:
        projects_by_space[
            project.space_id
        ].append(
            project
        )


    # ------------------------------------------------------
    # 4. Build nested response
    # ------------------------------------------------------

    response = []

    for space in spaces:
        response.append(
            SpaceWithProjectsResponse(
                id=space.id,
                name=space.name,
                description=space.description,
                created_at=space.created_at,
                updated_at=space.updated_at,
                projects=[
                    project
                    for project in projects_by_space.get(
                        space.id,
                        [],
                    )
                ],
            )
        )


    return response


# ==========================================================
# GET SINGLE SPACE
# ==========================================================


@router.get(
    "/{space_id}",
    response_model=SpaceResponse,
)
def get_space(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    space = (
        db.query(Space)
        .filter(
            Space.id == space_id,
            Space.user_id == current_user.id,
        )
        .first()
    )


    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found",
        )


    return space


# ==========================================================
# UPDATE SPACE
# ==========================================================


@router.put(
    "/{space_id}",
    response_model=SpaceResponse,
)
def update_space(
    space_id: int,
    space_data: SpaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    space = (
        db.query(Space)
        .filter(
            Space.id == space_id,
            Space.user_id == current_user.id,
        )
        .first()
    )


    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found",
        )


    space.name = space_data.name
    space.description = space_data.description

    db.commit()
    db.refresh(space)

    return space


# ==========================================================
# DELETE SPACE
# ==========================================================


@router.delete(
    "/{space_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_space(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    space = (
        db.query(Space)
        .filter(
            Space.id == space_id,
            Space.user_id == current_user.id,
        )
        .first()
    )


    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found",
        )


    db.delete(space)
    db.commit()