import os
import tempfile

import boto3
import faiss
import numpy as np
from django.conf import settings


def create_faiss_index(embeddings):
    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)

    vectors = np.asarray(
        embeddings,
        dtype="float32",
    )

    index.add(vectors)

    return index


def get_faiss_s3_key(document):
    return f"faiss/document_{document.id}/index.faiss"


def get_faiss_index_path(document):
    directory = os.path.join(
        settings.MEDIA_ROOT,
        "faiss",
        f"document_{document.id}",
    )

    os.makedirs(directory, exist_ok=True)

    return os.path.join(
        directory,
        "index.faiss",
    )


def save_faiss_index(index, document):
    if settings.USE_S3:
        s3_client = boto3.client("s3")
        s3_key = get_faiss_s3_key(document)

        with tempfile.NamedTemporaryFile(
            suffix=".faiss",
            delete=False,
        ) as temporary_file:
            temporary_path = temporary_file.name

        try:
            faiss.write_index(
                index,
                temporary_path,
            )

            s3_client.upload_file(
                temporary_path,
                settings.AWS_STORAGE_BUCKET_NAME,
                s3_key,
            )

        finally:
            if os.path.exists(temporary_path):
                os.remove(temporary_path)

    else:
        file_path = get_faiss_index_path(document)

        faiss.write_index(
            index,
            file_path,
        )


def load_faiss_index(document):
    if settings.USE_S3:
        s3_client = boto3.client("s3")
        s3_key = get_faiss_s3_key(document)

        with tempfile.NamedTemporaryFile(
            suffix=".faiss",
            delete=False,
        ) as temporary_file:
            temporary_path = temporary_file.name

        try:
            s3_client.download_file(
                settings.AWS_STORAGE_BUCKET_NAME,
                s3_key,
                temporary_path,
            )

            return faiss.read_index(
                temporary_path,
            )

        finally:
            if os.path.exists(temporary_path):
                os.remove(temporary_path)

    else:
        file_path = get_faiss_index_path(document)

        if not os.path.exists(file_path):
            raise FileNotFoundError(
                f"FAISS index not found for document {document.id}"
            )

        return faiss.read_index(file_path)


def search_faiss(index, query_embedding, top_k=3):
    query_vector = np.asarray(
        query_embedding,
        dtype="float32",
    )

    top_k = min(
        top_k,
        index.ntotal,
    )

    distances, indices = index.search(
        query_vector,
        top_k,
    )

    return distances, indices


def delete_faiss_index(document):
    if settings.USE_S3:
        s3_client = boto3.client("s3")
        s3_key = get_faiss_s3_key(document)

        s3_client.delete_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=s3_key,
        )

    else:
        file_path = get_faiss_index_path(document)

        if os.path.exists(file_path):
            os.remove(file_path)