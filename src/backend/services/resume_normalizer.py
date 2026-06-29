"""
Resume Normalizer Module
========================
Converts raw resume plain text into a structured JSON object
using Gemini. One call per resume. Stateless. JSON-only response.

Output schema:
{
  "candidate_name": "",
  "education": "",
  "experience": "",
  "skills": "",
  "projects": ""
}
"""

import json
import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")

NORMALIZATION_PROMPT = """You are a resume data extractor.

Given the raw text of a single resume, extract and return ONLY a JSON object with these fields:

{
  "candidate_name": "Full name of the candidate",
  "education": "All educational qualifications, degrees, institutions, years",
  "experience": "All work experience entries with company, role, duration, responsibilities",
  "skills": "All technical and soft skills mentioned",
  "projects": "All projects mentioned with brief descriptions"
}

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no extra text.
- DO NOT EXPLAIN.
- DO NOT invent or assume data not present in the resume.
- If a field is not found, set it to an empty string "".
- Extract exactly what is written. Do not rephrase or summarize.

RESUME TEXT:
\"\"\"
{resume_text}
\"\"\"
"""

REQUIRED_FIELDS = ["candidate_name", "education", "experience", "skills", "projects"]


def _extract_tokens(response) -> dict:
    """Extract token usage from a Gemini response object."""
    usage = getattr(response, "usage_metadata", None)
    if usage:
        return {
            "prompt_tokens": getattr(usage, "prompt_token_count", 0) or 0,
            "completion_tokens": getattr(usage, "candidates_token_count", 0) or 0,
            "total_tokens": getattr(usage, "total_token_count", 0) or 0,
        }
    return {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}


def normalize_resume(resume_text: str) -> tuple:
    """
    Send resume text to Gemini for structured extraction.
    Returns a tuple: (validated_dict, token_usage_dict).
    Raises ValueError if Gemini returns invalid data.
    """
    prompt = NORMALIZATION_PROMPT.replace("{resume_text}", resume_text)

    response = _model.generate_content(prompt)
    tokens = _extract_tokens(response)

    raw_output = response.text.strip()
    # Strip markdown code fences if present
    if raw_output.startswith("```"):
        lines = raw_output.splitlines()
        # Remove first and last fence lines
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw_output = "\n".join(lines).strip()

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON during normalization: {e}\nRaw: {raw_output[:500]}")

    # Validate required fields exist
    for field in REQUIRED_FIELDS:
        if field not in data:
            data[field] = ""

    # Ensure all values are strings
    for field in REQUIRED_FIELDS:
        if not isinstance(data[field], str):
            data[field] = str(data[field])

    return data, tokens
