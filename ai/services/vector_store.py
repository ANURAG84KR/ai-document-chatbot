import faiss
import numpy as np
from django.conf import settings
import os


def create_faiss_index(embeddings):
    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)

    vectors = np.asarray(embeddings, dtype="float32")

    index.add(vectors)

    return index



def save_faiss_index(index, file_path):
    faiss.write_index(index, file_path)

def get_faiss_index_path(document):
    directory = os.path.join(
        settings.MEDIA_ROOT,
        "faiss",
        f"document_{document.id}",
    )

    os.makedirs(directory, exist_ok=True)

    return os.path.join(directory, "index.faiss")

def load_faiss_index(document):
    file_path = get_faiss_index_path(document)

    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"FAISS index not found for document {document.id}"
        )

    return faiss.read_index(file_path)

def search_faiss(index, query_embedding, top_k=3):
    query_vector = np.asarray(
        query_embedding,
        dtype="float32"
    )

    top_k = min(top_k, index.ntotal)

    distances, indices = index.search(
        query_vector,
        top_k
    )

    return distances, indices

def delete_faiss_index(document):
    file_path = get_faiss_index_path(document)

    if os.path.exists(file_path):
        os.remove(file_path)