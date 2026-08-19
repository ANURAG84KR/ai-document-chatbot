from django.urls import path
from .views import ChatSessionView, ChatSessionDetailView, ChatMessageCreateView


urlpatterns = [
    path(
        "sessions/",
        ChatSessionView.as_view(),
        name="chat-sessions",
    ),
    path(
        "sessions/<int:session_id>/",
        ChatSessionDetailView.as_view(),
        name="chat-session-detail",
    ),
    path(
        "sessions/<int:session_id>/messages/",
        ChatMessageCreateView.as_view(),
        name="chat-message-create",
    ),


]