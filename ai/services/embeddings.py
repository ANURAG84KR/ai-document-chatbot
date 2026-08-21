from sentence_transformers import SentenceTransformer


_model = None


def get_embedding_model():
    global _model

    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")

    return _model


def create_embeddings(chunks):
    model = get_embedding_model()

    embeddings = model.encode(chunks)

    return embeddings