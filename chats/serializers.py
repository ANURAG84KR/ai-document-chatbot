from rest_framework import serializers


class ChatSessionCreateSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()

class ChatMessageCreateSerializer(serializers.Serializer):
    question = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )

class ChatSessionListQuerySerializer(serializers.Serializer):
    document_id = serializers.IntegerField(required=True)