from sqlalchemy.orm import Session
import faiss

from app.models.document_chunk import DocumentChunk
from app.models.material import Material
from app.services.rag.embeddings import embed_query
from app.services.rag.vector_store import get_project_index_path


def retrieve_chunks(
    db: Session,
    project_id: int,
    query: str,
    top_k: int = 5,
) -> list[dict]:
    query = query.strip()

    if not query:
        return []

    index_path = get_project_index_path(project_id)

    if not index_path.exists():
        return []

    index = faiss.read_index(str(index_path))

    if index.ntotal == 0:
        return []

    effective_top_k = min(top_k, index.ntotal)

    query_embedding = embed_query(query)

    scores, ids = index.search(
        query_embedding.astype("float32"),
        effective_top_k,
    )

    chunk_ids = [
        int(chunk_id)
        for chunk_id in ids[0]
        if chunk_id != -1
    ]

    if not chunk_ids:
        return []

    chunks = (
        db.query(DocumentChunk)
        .join(
            Material,
            DocumentChunk.material_id == Material.id,
        )
        .filter(
            DocumentChunk.project_id == project_id,
            DocumentChunk.id.in_(chunk_ids),
            Material.status == "ready",
        )
        .all()
    )

    chunk_map = {
        chunk.id: chunk
        for chunk in chunks
    }

    results = []

    for score, chunk_id in zip(scores[0], ids[0]):
        if chunk_id == -1:
            continue

        chunk = chunk_map.get(int(chunk_id))

        if not chunk:
            continue

        results.append(
            {
                "chunk_id": chunk.id,
                "material_id": chunk.material_id,
                "source": chunk.material.original_filename,
                "page_number": chunk.page_number,
                "content": chunk.content,
                "score": float(score),
            }
        )

    return results