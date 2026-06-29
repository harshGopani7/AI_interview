"""
Resume Evaluator Module (CORE)
==============================
Evaluates ONE normalized resume against job criteria using Gemini.
Stateless. No chat history. JSON-only response. Strict prompt.

Gemini output schema:
{
  "candidate_name": "",
  "experience_match": "Yes | No | Partial",
  "skills_match_percent": number,
  "role_fit": "High | Medium | Low",
  "ai_content_probability": "Low | Medium | High",
  "final_score": number,
  "verdict": "Shortlist | Borderline | Reject"
}
"""

import json
import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")

EVALUATION_PROMPT = """You are a strict, objective resume evaluator for HR screening.

You will receive:
1. JOB CRITERIA — the requirements for the role.
2. NORMALIZED RESUME — structured data extracted from a single candidate's resume.

Your task: Evaluate how well this candidate matches the job criteria.

Return ONLY a valid JSON object with this exact schema:

{{
  "candidate_name": "The candidate's full name from the resume",
  "experience_match": "Yes | No | Partial",
  "skills_match_percent": <number 0-100>,
  "role_fit": "High | Medium | Low",
  "ai_content_probability": "Low | Medium | High",
  "final_score": <number 0-{scoring_scale}>,
  "verdict": "Shortlist | Borderline | Reject"
}}

SCORING RULES:
- Scoring scale is 0 to {scoring_scale}.
- "final_score" must be an integer within that range.
- "skills_match_percent" is always 0-100 regardless of scoring scale.
- "experience_match": "Yes" if candidate meets or exceeds required experience, "Partial" if close, "No" if clearly insufficient.
- "role_fit": Based on overall alignment of skills + experience + education to the role.
- "ai_content_probability": Estimate likelihood the resume was AI-generated. "Low" = clearly human, "High" = likely AI-generated.
- "verdict": "Shortlist" if strong match, "Borderline" if uncertain, "Reject" if poor match.

RULES:
- DO NOT EXPLAIN. Return ONLY valid JSON.
- DO NOT rank this candidate against others.
- DO NOT invent data not present in the resume.
- DO NOT add any text outside the JSON object.
- Be objective and consistent.

---

JOB CRITERIA:
\"\"\"
Job Title: {job_title}
Job Description: {job_description}
Required Experience: {required_experience}
Mandatory Skills: {mandatory_skills}
Industry: {industry}
Seniority Level: {seniority_level}
\"\"\"

NORMALIZED RESUME:
\"\"\"
Candidate Name: {candidate_name}
Education: {education}
Experience: {experience}
Skills: {skills}
Projects: {projects}
Industry:{industry}
\"\"\"
"""

VALID_EXPERIENCE_MATCH = {"Yes", "No", "Partial"}
VALID_ROLE_FIT = {"High", "Medium", "Low"}
VALID_AI_PROB = {"Low", "Medium", "High"}
VALID_VERDICT = {"Shortlist", "Borderline", "Reject"}


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


def evaluate_resume(job_criteria: dict, normalized_resume: dict, scoring_scale: int = 10) -> tuple:
    """
    Evaluate a single normalized resume against job criteria using Gemini.
    Returns a tuple: (validated_evaluation_dict, token_usage_dict).
    Raises ValueError if Gemini returns invalid or unparseable data.
    """
    mandatory_skills_str = ", ".join(job_criteria.get("mandatorySkills", []))

    prompt = EVALUATION_PROMPT.format(
        scoring_scale=scoring_scale,
        job_title=job_criteria.get("jobTitle", ""),
        job_description=job_criteria.get("jobDescription", ""),
        required_experience=job_criteria.get("requiredExperience", ""),
        mandatory_skills=mandatory_skills_str,
        industry=job_criteria.get("industry", ""),
        seniority_level=job_criteria.get("seniorityLevel", ""),
        candidate_name=normalized_resume.get("candidate_name", ""),
        education=normalized_resume.get("education", ""),
        experience=normalized_resume.get("experience", ""),
        skills=normalized_resume.get("skills", ""),
        projects=normalized_resume.get("projects", ""),
    )

    response = _model.generate_content(prompt)
    tokens = _extract_tokens(response)
    raw_output = response.text.strip()

    # Strip markdown code fences if present
    if raw_output.startswith("```"):
        lines = raw_output.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw_output = "\n".join(lines).strip()

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON during evaluation: {e}\nRaw: {raw_output[:500]}")

    # ── Validate & coerce fields ──
    data = _validate_evaluation(data, scoring_scale)

    return data, tokens


def _validate_evaluation(data: dict, scoring_scale: int) -> dict:
    """Validate and sanitize the Gemini evaluation response."""

    # candidate_name
    if not isinstance(data.get("candidate_name"), str) or not data["candidate_name"].strip():
        data["candidate_name"] = "Unknown"

    # experience_match
    if data.get("experience_match") not in VALID_EXPERIENCE_MATCH:
        data["experience_match"] = "Partial"

    # skills_match_percent
    try:
        val = int(data.get("skills_match_percent", 0))
        data["skills_match_percent"] = max(0, min(100, val))
    except (TypeError, ValueError):
        data["skills_match_percent"] = 0

    # role_fit
    if data.get("role_fit") not in VALID_ROLE_FIT:
        data["role_fit"] = "Low"

    # ai_content_probability
    if data.get("ai_content_probability") not in VALID_AI_PROB:
        data["ai_content_probability"] = "Low"

    # final_score
    try:
        val = int(data.get("final_score", 0))
        data["final_score"] = max(0, min(scoring_scale, val))
    except (TypeError, ValueError):
        data["final_score"] = 0

    # verdict
    if data.get("verdict") not in VALID_VERDICT:
        data["verdict"] = "Reject"

    return data
