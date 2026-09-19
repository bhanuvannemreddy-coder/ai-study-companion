import sys

import faiss
import numpy as np

import app.main

from app.core.database import SessionLocal
from app.models.document_chunk import DocumentChunk
from app.models.material import Material
from app.services.rag.embeddings import embed_texts
from app.services.rag.vector_store import get_project_index_path


def rebuild_project_index(project_id: int):
    db = SessionLocal()

    try:
        chunks = (
            db.query(DocumentChunk)
            .join(
                Material,
                DocumentChunk.material_id == Material.id,
            )
            .filter(
                DocumentChunk.project_id == project_id,
                Material.status == "ready",
            )
            .order_by(
                DocumentChunk.id.asc()
            )
            .all()
        )

        print(f"PROJECT ID: {project_id}")
        print(f"CHUNKS FOUND: {len(chunks)}")

        if not chunks:
            print("No ready chunks found.")
            return

        texts = [
            chunk.content
            for chunk in chunks
        ]

        print("Creating embeddings...")

        embeddings = embed_texts(texts)

        embeddings = np.asarray(
            embeddings,
            dtype="float32",
        )

        print(
            "EMBEDDING SHAPE:",
            embeddings.shape,
        )

        dimension = embeddings.shape[1]

        base_index = faiss.IndexFlatIP(
            dimension
        )

        index = faiss.IndexIDMap2(
            base_index
        )

        chunk_ids = np.asarray(
            [chunk.id for chunk in chunks],
            dtype="int64",
        )

        index.add_with_ids(
            embeddings,
            chunk_ids,
        )

        index_path = get_project_index_path(
            project_id
        )

        faiss.write_index(
            index,
            str(index_path),
        )

        print()
        print("INDEX CREATED SUCCESSFULLY")
        print("INDEX PATH:", index_path.resolve())
        print("VECTORS:", index.ntotal)
        print(
            "CHUNK IDS:",
            chunk_ids.tolist(),
        )

    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(
            "Usage: python rebuild_project_index.py <project_id>"
        )
        sys.exit(1)

    project_id = int(sys.argv[1])

    rebuild_project_index(project_id)