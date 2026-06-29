"""
Resume Parser Module
====================
Accepts PDF / DOC / DOCX files and converts them to plain text.
Cleans and normalizes the extracted text.
"""

import os
import re


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyPDF2."""
    import PyPDF2

    text_parts = []
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    import docx

    doc = docx.Document(file_path)
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())


def extract_text_from_doc(file_path: str) -> str:
    """
    Extract text from a legacy .doc file.
    Falls back to reading raw bytes if antiword is unavailable.
    """
    try:
        import subprocess
        result = subprocess.run(
            ["antiword", file_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return result.stdout
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # Fallback: read raw bytes and extract printable text
    with open(file_path, "rb") as f:
        raw = f.read()
    text = raw.decode("utf-8", errors="ignore")
    # Keep only printable ASCII + common whitespace
    text = re.sub(r"[^\x20-\x7E\n\r\t]", " ", text)
    return text


def clean_text(raw_text: str) -> str:
    """Normalize whitespace, remove excessive blank lines, trim."""
    text = re.sub(r"\r\n", "\n", raw_text)
    text = re.sub(r"[ \t]+", " ", text)           # collapse horizontal whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)         # max 2 consecutive newlines
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()


def parse_resume(file_path: str) -> str:
    """
    Main entry point.
    Accepts a file path, detects format, extracts text, cleans it.
    Returns cleaned plain text.
    Raises ValueError for unsupported formats or empty extractions.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        raw = extract_text_from_pdf(file_path)
    elif ext == ".docx":
        raw = extract_text_from_docx(file_path)
    elif ext == ".doc":
        raw = extract_text_from_doc(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    cleaned = clean_text(raw)
    # print(cleaned)

    if not cleaned or len(cleaned) < 30:
        raise ValueError("Could not extract meaningful text from resume")

    return cleaned
