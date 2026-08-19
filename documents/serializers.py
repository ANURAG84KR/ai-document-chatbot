from rest_framework import serializers
from .models import Document
from pathlib import Path


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id",
            "file",
            "original_name",
            "file_type",
            "file_size",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "original_name",
            "file_type",
            "file_size",
            "uploaded_at",
        ]

    def validate_file(self, value):
        file_extension = Path(value.name).suffix.lower()

        allowed_extensions = [".pdf", ".docx"]

        if file_extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Only PDF and DOCX files are allowed."
            )

        return value



            