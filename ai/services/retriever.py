from ai.services.embeddings import create_embeddings
from ai.services.vector_store import load_faiss_index, search_faiss
from documents.models import DocumentChunk


DISTANCE_THRESHOLD = 2.0


def retrieve_document_chunks(document, question, top_k=3):
    index = load_faiss_index(document)

    question_embedding = create_embeddings([question])

    actual_k = min(top_k, index.ntotal)

    distances, indices = search_faiss(
        index,
        question_embedding,
        actual_k,
    )


    chunks = []

    for position, chunk_index in enumerate(indices[0]):
        if distances[0][position] > DISTANCE_THRESHOLD:
            continue
        
        chunk = DocumentChunk.objects.get(
            document=document,
            chunk_index=int(chunk_index),
        )

        chunks.append(chunk.text)

    return chunks, distances