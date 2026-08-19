from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from pathlib import Path
from rest_framework.response import Response
from rest_framework import status
from .serializers import DocumentSerializer
from .models import Document
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import FileResponse
from ai.services.vector_store import delete_faiss_index
from ai.services.rag import process_document



class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        
        uploaded_files = request.FILES.getlist("files")

        if not uploaded_files:
            return Response(
                {"error": "No files were uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_documents = []
        created_documents = []

        try:
            with transaction.atomic():

                for uploaded_file in uploaded_files:

                    serializer = DocumentSerializer(
                        data={
                            "file": uploaded_file,
                        }
                    )

                    serializer.is_valid(raise_exception=True)

                    validated_file = serializer.validated_data["file"]

                    file_extension = Path(validated_file.name).suffix.lower()

                    document = serializer.save(
                        user=request.user,
                        original_name=validated_file.name,
                        file_type=file_extension.lstrip("."),
                        file_size=validated_file.size,
                    )

                    try:
                        process_document(document)
                    except Exception:
                        document.file.delete(save=False)
                        raise

                    created_documents.append(document)

                    uploaded_documents.append(serializer.data)

        except Exception:
            for document in created_documents:
                delete_faiss_index(document)
                document.file.delete(save=False)

            raise

        return Response(
            uploaded_documents,
            status=status.HTTP_201_CREATED,
        )

class DocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        documents = Document.objects.filter(user=request.user)

        serializer = DocumentSerializer(documents, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):
        document = get_object_or_404(
            Document,
            id=document_id,
            user=request.user,
        )

        serializer = DocumentSerializer(document)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    def delete(self, request, document_id):
        document = get_object_or_404(
        Document,
        id=document_id,
        user=request.user,
        )

        delete_faiss_index(document)

        document.file.delete(save=False)

        document.delete()

        
        

        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):

        document = get_object_or_404(
            Document,
            id=document_id,
            user=request.user,
        )

        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=document.original_name,
        )

