from sentence_transformers import SentenceTransformer


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

_model = None


def get_embedding_model() -> SentenceTransformer:
    global _model

    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)

    return _model


def embed_texts(texts: list[str]):
    model = get_embedding_model()

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )

    return embeddings


def embed_query(query: str):
    model = get_embedding_model()

    embedding = model.encode(
        [query],
        normalize_embeddings=True,
        convert_to_numpy=True,
    )

    return embedding