from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.material import Material
from app.models.project import Project
from app.models.space import Space
from app.models.user import User
from app.schemas.material import MaterialResponse
from app.workers.material_tasks import process_material


router = APIRouter(
    tags=["Materials"]
)


UPLOAD_ROOT = Path("storage/materials")
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post(
    "/api/projects/{project_id}/materials",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_material(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Verify project ownership.
    project = (
        db.query(Project)
        .join(Space, Project.space_id == Space.id)
        .filter(
            Project.id == project_id,
            Space.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # 2. Validate filename.
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    # 3. Read file contents.
    contents = await file.read()

    # 4. Validate file size.
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size cannot exceed 20 MB",
        )

    # 5. Validate PDF signature.
    if not contents.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid PDF",
        )

    # 6. Generate safe internal filename.
    stored_filename = f"{uuid4().hex}.pdf"

    project_directory = UPLOAD_ROOT / str(project_id)
    project_directory.mkdir(parents=True, exist_ok=True)

    file_path = project_directory / stored_filename

    # 7. Save file.
    file_path.write_bytes(contents)

    # 8. Create database record.
    material = Material(
        project_id=project_id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=str(file_path),
        file_type="application/pdf",
        file_size_bytes=len(contents),
        status="queued",
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    # 9. Send processing job to Celery.
    process_material.delay(material.id)

    return material


@router.get(
    "/api/projects/{project_id}/materials",
    response_model=list[MaterialResponse],
)
def get_project_materials(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify that the project belongs to the logged-in user.
    project = (
        db.query(Project)
        .join(Space, Project.space_id == Space.id)
        .filter(
            Project.id == project_id,
            Space.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    materials = (
        db.query(Material)
        .filter(Material.project_id == project_id)
        .order_by(Material.created_at.desc())
        .all()
    )

    return materials


@router.get(
    "/api/materials/{material_id}",
    response_model=MaterialResponse,
)
def get_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = (
        db.query(Material)
        .join(Project, Material.project_id == Project.id)
        .join(Space, Project.space_id == Space.id)
        .filter(
            Material.id == material_id,
            Space.user_id == current_user.id,
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found",
        )

    return material