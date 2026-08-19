from pypdf import PdfReader
from docx import Document as DocxDocument


def extract_text_from_pdf(document):
    with document.file.open("rb") as pdf_file:
        reader = PdfReader(pdf_file)

        extracted_text = []

        for page in reader.pages:
            text = page.extract_text()

            if text:
                extracted_text.append(text)

    return "\n".join(extracted_text)


def extract_text_from_docx(document):
    with document.file.open("rb") as docx_file:
        docx_document = DocxDocument(docx_file)

        extracted_text = []

        for paragraph in docx_document.paragraphs:
            if paragraph.text:
                extracted_text.append(paragraph.text)

    return "\n".join(extracted_text)


def extract_text(document):
    if document.file_type == "pdf":
        return extract_text_from_pdf(document)

    elif document.file_type == "docx":
        return extract_text_from_docx(document)

    else:
        raise ValueError("Unsupported document type.")