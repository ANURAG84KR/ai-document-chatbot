from ai.services.document_extractor import extract_text
from ai.services.chunker import chunk_text
from ai.services.embeddings import create_embeddings

from ai.services.vector_store import (
    create_faiss_index,
    get_faiss_index_path,
    save_faiss_index,
    delete_faiss_index,
)

from ai.services.prompt import create_rag_prompt
from ai.services.gemini import generate_answer

from documents.models import DocumentChunk
from ai.services.retriever import retrieve_document_chunks

def process_document(document):
    try:
        text = extract_text(document)

        chunks = chunk_text(text)

        DocumentChunk.objects.filter(document=document).delete()

        for index, chunk in enumerate(chunks):
            DocumentChunk.objects.create(
                document=document,
                chunk_index=index,
                text=chunk,
            )

        embeddings = create_embeddings(chunks)

        index = create_faiss_index(embeddings)

        file_path = get_faiss_index_path(document)

        save_faiss_index(index, file_path)

        return chunks

    except Exception:
        delete_faiss_index(document)
        raise


def answer_question(document, question, chat_history):
    relevant_chunks, distances = retrieve_document_chunks(
        document,
        question,
    )
    if not relevant_chunks:
         return "I couldn't find the answer in the document."

    prompt = create_rag_prompt(
        relevant_chunks,
        question,
        chat_history,
    )

    answer = generate_answer(prompt)

    return answer