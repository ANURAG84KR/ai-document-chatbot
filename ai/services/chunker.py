def chunk_text(text, chunk_size=1000, chunk_overlap=200):
    chunks = []

    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size

        chunk = text[start:end]

        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break

        start += chunk_size - chunk_overlap

    return chunks