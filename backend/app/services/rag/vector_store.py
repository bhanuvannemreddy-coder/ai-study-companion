from pathlib import Path

import faiss
import numpy as np


VECTOR_ROOT = Path("storage/vector_indexes")


def get_project_index_path(project_id: int) -> Path:
    project_dir = VECTOR_ROOT / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)

    return project_dir / "index.faiss"


def load_project_index(
    project_id: int,
    dimension: int,
):
    index_path = get_project_index_path(project_id)

    if index_path.exists():
        return faiss.read_index(str(index_path))

    base_index = faiss.IndexFlatIP(dimension)

    return faiss.IndexIDMap2(base_index)


def save_project_index(
    project_id: int,
    index,
):
    index_path = get_project_index_path(project_id)

    faiss.write_index(
        index,
        str(index_path),
    )


def add_embeddings(
    index,
    embeddings,
    chunk_ids,
):
    vectors = np.asarray(
        embeddings,
        dtype="float32",
    )

    ids = np.asarray(
        chunk_ids,
        dtype="int64",
    )

    index.add_with_ids(
        vectors,
        ids,
    )


def remove_chunk_ids(index, chunk_ids):
    if not chunk_ids:
        return

    ids = np.asarray(
        chunk_ids,
        dtype="int64",
    )

    index.remove_ids(ids)