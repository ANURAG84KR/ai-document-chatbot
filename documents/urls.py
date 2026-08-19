from django.urls import path

from .views import DocumentUploadView, DocumentListView, DocumentDetailView,  DocumentDownloadView


urlpatterns = [
    path("upload/", DocumentUploadView.as_view(), name="document-upload"),
    path("", DocumentListView.as_view(), name="document-list"),
    path( "<int:document_id>/", DocumentDetailView.as_view(), name="document-detail"),
    path(
     "<int:document_id>/download/",
      DocumentDownloadView.as_view(),
      name="document-download",
    ),
    
]