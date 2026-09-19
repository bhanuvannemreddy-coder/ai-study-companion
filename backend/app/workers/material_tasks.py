from datetime import datetime

import fitz
from celery import Task

from app.core.database import SessionLocal
from app.models.document_chunk import DocumentChunk
from app.models.material import Material
from app.services.rag.embeddings import embed_texts
from app.services.rag.vector_store import (
    add_embeddings,
    load_project_index,
    remove_chunk_ids,
    save_project_index,
)
from app.workers.celery_app import celery_app


class MaterialProcessingTask(Task):
    max_retries = 3


def create_chunks(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 150,
) -> list[str]:
    """
    Split text into overlapping chunks.

    Example:
        chunk 1 -> characters 0-1000
        chunk 2 -> characters 850-1850
        chunk 3 -> characters 1700-2700
    """

    text = text.strip()

    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(
            start + chunk_size,
            len(text),
        )

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = end - overlap

    return chunks


@celery_app.task(
    bind=True,
    base=MaterialProcessingTask,
)
def process_material(
    self,
    material_id: int,
):
    db = SessionLocal()

    try:
        # ---------------------------------------------------------
        # 1. Find material
        # ---------------------------------------------------------

        material = (
            db.query(Material)
            .filter(Material.id == material_id)
            .first()
        )

        if not material:
            return {
                "success": False,
                "message": "Material not found",
            }

        # ---------------------------------------------------------
        # 2. Idempotency
        # ---------------------------------------------------------
        # If this material has already completed successfully,
        # don't process it again unnecessarily.

        if material.status == "ready":
            return {
                "success": True,
                "message": "Material already processed",
            }

        # ---------------------------------------------------------
        # 3. Mark as processing
        # ---------------------------------------------------------

        material.status = "processing"
        material.error_message = None

        db.commit()

        try:
            # -----------------------------------------------------
            # 4. Find chunks from a previous processing attempt
            # -----------------------------------------------------
            # We keep their IDs so their old FAISS vectors can
            # also be removed.

            existing_chunks = (
                db.query(DocumentChunk)
                .filter(
                    DocumentChunk.material_id == material.id
                )
                .all()
            )

            existing_chunk_ids = [
                chunk.id
                for chunk in existing_chunks
            ]

            # -----------------------------------------------------
            # 5. Delete old PostgreSQL chunks
            # -----------------------------------------------------

            if existing_chunk_ids:
                (
                    db.query(DocumentChunk)
                    .filter(
                        DocumentChunk.material_id == material.id
                    )
                    .delete(
                        synchronize_session=False
                    )
                )

                db.commit()

            # -----------------------------------------------------
            # 6. Open PDF
            # -----------------------------------------------------

            document = fitz.open(
                material.file_path
            )

            page_count = document.page_count

            extracted_text_pages = 0
            total_chunks = 0

            # -----------------------------------------------------
            # 7. Extract text page by page
            # -----------------------------------------------------

            for page_index, page in enumerate(document):

                page_number = page_index + 1

                text = page.get_text(
                    "text"
                ).strip()

                # Skip pages with no extractable text.
                if not text:
                    continue

                extracted_text_pages += 1

                # -------------------------------------------------
                # 8. Split page text into chunks
                # -------------------------------------------------

                chunks = create_chunks(
                    text
                )

                for chunk_index, chunk_text in enumerate(
                    chunks
                ):

                    chunk = DocumentChunk(
                        material_id=material.id,
                        project_id=material.project_id,
                        page_number=page_number,
                        chunk_index=chunk_index,
                        content=chunk_text,
                        char_count=len(chunk_text),
                    )

                    db.add(chunk)

                    total_chunks += 1

            document.close()

            # -----------------------------------------------------
            # 9. Check whether we actually extracted anything
            # -----------------------------------------------------

            if total_chunks == 0:
                raise ValueError(
                    "No extractable text was found in the PDF."
                )

            # -----------------------------------------------------
            # 10. Flush so PostgreSQL assigns chunk IDs
            # -----------------------------------------------------

            db.flush()

            # -----------------------------------------------------
            # 11. Fetch the newly created chunks
            # -----------------------------------------------------

            new_chunks = (
                db.query(DocumentChunk)
                .filter(
                    DocumentChunk.material_id == material.id
                )
                .order_by(
                    DocumentChunk.id.asc()
                )
                .all()
            )

            if not new_chunks:
                raise ValueError(
                    "No document chunks were created."
                )

            # -----------------------------------------------------
            # 12. Commit chunks before building the vector index
            # -----------------------------------------------------
            # This makes the chunk records durable before we create
            # the corresponding FAISS vectors.

            db.commit()

            # -----------------------------------------------------
            # 13. Generate embeddings
            # -----------------------------------------------------

            texts = [
                chunk.content
                for chunk in new_chunks
            ]

            embeddings = embed_texts(
                texts
            )

            # -----------------------------------------------------
            # 14. Load project-specific FAISS index
            # -----------------------------------------------------

            dimension = embeddings.shape[1]

            index = load_project_index(
                material.project_id,
                dimension,
            )

            # -----------------------------------------------------
            # 15. Remove old vectors from this material
            # -----------------------------------------------------

            remove_chunk_ids(
                index,
                existing_chunk_ids,
            )

            # -----------------------------------------------------
            # 16. Get new chunk IDs
            # -----------------------------------------------------

            new_chunk_ids = [
                chunk.id
                for chunk in new_chunks
            ]

            # -----------------------------------------------------
            # 17. Add embeddings to FAISS
            # -----------------------------------------------------

            add_embeddings(
                index,
                embeddings,
                new_chunk_ids,
            )

            # -----------------------------------------------------
            # 18. Save project FAISS index
            # -----------------------------------------------------

            save_project_index(
                material.project_id,
                index,
            )

            # -----------------------------------------------------
            # 19. Mark material as ready
            # -----------------------------------------------------

            material.page_count = page_count
            material.status = "ready"
            material.processed_at = datetime.utcnow()
            material.error_message = None

            db.commit()

            # -----------------------------------------------------
            # 20. Return processing result
            # -----------------------------------------------------

            return {
                "success": True,
                "material_id": material.id,
                "project_id": material.project_id,
                "page_count": page_count,
                "extracted_text_pages": extracted_text_pages,
                "total_chunks": total_chunks,
                "embedding_dimension": dimension,
            }

        except Exception as exc:

            # -----------------------------------------------------
            # Processing failure
            # -----------------------------------------------------

            db.rollback()

            failed_material = (
                db.query(Material)
                .filter(
                    Material.id == material_id
                )
                .first()
            )

            if failed_material:

                failed_material.status = "failed"

                failed_material.error_message = str(
                    exc
                )[:2000]

                db.commit()

            raise

    finally:
        db.close()