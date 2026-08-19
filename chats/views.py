from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from ai.services.rag import answer_question

from documents.models import Document
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionCreateSerializer, ChatMessageCreateSerializer, ChatSessionListQuerySerializer


class ChatSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ChatSessionCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        document_id = serializer.validated_data["document_id"]

        document = get_object_or_404(
            Document,
            id=document_id,
            user=request.user,
        )

        chat_session = ChatSession.objects.create(
            user=request.user,
            document=document,
        )

        return Response(
            {
                "id": chat_session.id,
                "title": chat_session.title,
                "document_id": chat_session.document.id,
                "created_at": chat_session.created_at,
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        query_serializer = ChatSessionListQuerySerializer(
        data=request.query_params
        )
        query_serializer.is_valid(raise_exception=True)
        document_id = query_serializer.validated_data["document_id"]

        chat_sessions = ChatSession.objects.filter(
            user=request.user,
            document_id=document_id,
        ).order_by("-updated_at")

        return Response(
            [
            {
                "id": session.id,
                "title": session.title,
                "document_id": session.document.id,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
            }
            for session in chat_sessions
        ],
        status=status.HTTP_200_OK,
        )
       

class ChatSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        chat_session = get_object_or_404(
            ChatSession,
            id=session_id,
            user=request.user,
        )

        messages = chat_session.messages.order_by("created_at")

        return Response(
            {
                "id": chat_session.id,
                "title": chat_session.title,
                "document_id": chat_session.document.id,
                "created_at": chat_session.created_at,
                "updated_at": chat_session.updated_at,
                "messages": [
                    {
                        "id": message.id,
                        "question": message.question,
                        "answer": message.answer,
                        "created_at": message.created_at,
                    }
                    for message in messages
                ],
            },
            status=status.HTTP_200_OK,
        )

class ChatMessageCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        serializer = ChatMessageCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        question = serializer.validated_data["question"]

        chat_session = get_object_or_404(
            ChatSession,
            id=session_id,
            user=request.user,
        )

        document = chat_session.document

        previous_messages = chat_session.messages.order_by(
            "created_at"
        )

        chat_history = ""

        for message in previous_messages:
            chat_history += (
                f"User: {message.question}\n"
                f"Assistant: {message.answer}\n\n"
            )

        answer = answer_question(
            document,
            question,
            chat_history,
        )

        chat_message = ChatMessage.objects.create(
            session=chat_session,
            question=question,
            answer=answer,
        )

        chat_session.save(update_fields=["updated_at"])

        return Response(
            {
                "id": chat_message.id,
                "question": chat_message.question,
                "answer": chat_message.answer,
                "created_at": chat_message.created_at,
            },
            status=status.HTTP_201_CREATED,
        )