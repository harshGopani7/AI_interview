"""
Resume Analysis Orchestrator
=============================
Loops through all uploaded resumes for a job, one by one:
  1. Parse (PDF/DOC/DOCX → plain text)
  2. Normalize (plain text → structured JSON via Gemini)
  3. Evaluate (structured JSON + job criteria → score via Gemini)

Features:
- Per-resume error isolation (one failure does not stop others)
- Rate limiting between Gemini calls
- Progress tracking written to DB
- Raw resume text discarded after normalization
"""

import time
from datetime import datetime
from bson import ObjectId

from config import screening_jobs_collection, screening_resumes_collection
from services.resume_parser import parse_resume
from services.resume_normalizer import normalize_resume
from services.resume_evaluator import evaluate_resume

# Seconds to wait between consecutive Gemini calls (rate limiting)
GEMINI_CALL_DELAY = 1.0


def run_analysis(job_id: str, user_id: str) -> dict:
    """
    Main orchestration entry point.
    Processes all uploaded resumes for the given job sequentially.

    Returns:
        {
            "total": int,
            "completed": int,
            "failed": int,
            "results": [ ... per-resume result dicts ... ]
        }
    """
    job = screening_jobs_collection.find_one({
        "_id": ObjectId(job_id),
        "userId": user_id
    })
    if not job:
        raise ValueError("Job not found")

    scoring_scale = int(job.get("scoringScale", 10))

    # Build job criteria dict for the evaluator
    job_criteria = {
        "jobTitle": job.get("jobTitle", ""),
        "jobDescription": job.get("jobDescription", ""),
        "requiredExperience": job.get("requiredExperience", ""),
        "mandatorySkills": job.get("mandatorySkills", []),
        "industry": job.get("industry", ""),
        "seniorityLevel": job.get("seniorityLevel", ""),
    }

    resumes = list(screening_resumes_collection.find({
        "jobId": job_id,
        "userId": user_id,
        "status": "uploaded"
    }))

    if not resumes:
        raise ValueError("No uploaded resumes found for this job")

    total = len(resumes)
    completed = 0
    failed = 0
    results = []

    # Token tracking
    total_tokens = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    # Mark job as analyzing
    screening_jobs_collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": "analyzing",
            "progress": {"current": 0, "total": total},
            "analyzingStartedAt": datetime.utcnow().isoformat()
        }}
    )

    for idx, resume_doc in enumerate(resumes):
        resume_id = str(resume_doc["_id"])
        file_path = resume_doc.get("path", "")
        filename = resume_doc.get("originalName", "unknown")

        # Update progress in DB
        screening_jobs_collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress.current": idx}}
        )

        try:
            # ── Step 1: Parse ──
            raw_text = parse_resume(file_path)

            # ── Step 2: Normalize (Gemini call #1) ──
            normalized, norm_tokens = normalize_resume(raw_text)
            total_tokens["prompt_tokens"] += norm_tokens["prompt_tokens"]
            total_tokens["completion_tokens"] += norm_tokens["completion_tokens"]
            total_tokens["total_tokens"] += norm_tokens["total_tokens"]
            print(f"[Tokens] Resume {idx+1}/{total} ({filename}) — Normalize: prompt={norm_tokens['prompt_tokens']}, completion={norm_tokens['completion_tokens']}, total={norm_tokens['total_tokens']}")

            # Discard raw text immediately – only keep structured data
            raw_text = None

            time.sleep(GEMINI_CALL_DELAY)  # rate limit

            # ── Step 3: Evaluate (Gemini call #2) ──
            evaluation, eval_tokens = evaluate_resume(job_criteria, normalized, scoring_scale)
            total_tokens["prompt_tokens"] += eval_tokens["prompt_tokens"]
            total_tokens["completion_tokens"] += eval_tokens["completion_tokens"]
            total_tokens["total_tokens"] += eval_tokens["total_tokens"]
            print(f"[Tokens] Resume {idx+1}/{total} ({filename}) — Evaluate: prompt={eval_tokens['prompt_tokens']}, completion={eval_tokens['completion_tokens']}, total={eval_tokens['total_tokens']}")

            resume_total = norm_tokens["total_tokens"] + eval_tokens["total_tokens"]
            print(f"[Tokens] Resume {idx+1}/{total} ({filename}) — Resume Total: {resume_total} | Running Grand Total: {total_tokens['total_tokens']}")

            time.sleep(GEMINI_CALL_DELAY)  # rate limit

            # Build the analysis result
            analysis = {
                "candidateName": evaluation.get("candidate_name", normalized.get("candidate_name", filename)),
                "score": evaluation.get("final_score", 0),
                "experienceMatch": evaluation.get("experience_match", ""),
                "skillsMatchPercent": evaluation.get("skills_match_percent", 0),
                "roleFit": evaluation.get("role_fit", ""),
                "aiContentProbability": evaluation.get("ai_content_probability", ""),
                "verdict": evaluation.get("verdict", ""),
                "matchedSkills": _extract_matched_skills(
                    job_criteria.get("mandatorySkills", []),
                    normalized.get("skills", "")
                ),
                "missingSkills": _extract_missing_skills(
                    job_criteria.get("mandatorySkills", []),
                    normalized.get("skills", "")
                ),
                "summary": _build_summary(evaluation, normalized),
                "normalizedData": {
                    "education": normalized.get("education", ""),
                    "experience": normalized.get("experience", ""),
                    "skills": normalized.get("skills", ""),
                    "projects": normalized.get("projects", ""),
                },
                "status": "completed"
            }

            # Save to DB
            screening_resumes_collection.update_one(
                {"_id": resume_doc["_id"]},
                {"$set": {
                    "analysis": analysis,
                    "status": "analyzed",
                    "analyzedAt": datetime.utcnow().isoformat()
                }}
            )

            results.append({
                "resumeId": resume_id,
                "filename": filename,
                **analysis
            })
            completed += 1

        except Exception as e:
            error_entry = {
                "resumeId": resume_id,
                "filename": filename,
                "status": "failed",
                "error": str(e)
            }
            screening_resumes_collection.update_one(
                {"_id": resume_doc["_id"]},
                {"$set": {
                    "status": "failed",
                    "error": str(e),
                    "failedAt": datetime.utcnow().isoformat()
                }}
            )
            results.append(error_entry)
            failed += 1

    # ── Finalize job status ──
    print(f"[Tokens] ===== FINAL TOTAL for job {job_id} =====")
    print(f"[Tokens] Prompt: {total_tokens['prompt_tokens']} | Completion: {total_tokens['completion_tokens']} | Total: {total_tokens['total_tokens']}")

    final_status = "completed" if failed == 0 else ("partial" if completed > 0 else "failed")
    screening_jobs_collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": final_status,
            "progress": {"current": total, "total": total},
            "completedAt": datetime.utcnow().isoformat(),
            "analysisSummary": {
                "total": total,
                "completed": completed,
                "failed": failed
            },
            "tokens": total_tokens
        }}
    )

    return {
        "total": total,
        "completed": completed,
        "failed": failed,
        "results": results,
        "tokens": total_tokens
    }


# ─── Helper functions (NO AI) ────────────────────────────────────────────────

def _extract_matched_skills(mandatory_skills: list, skills_text: str) -> list:
    """Find which mandatory skills appear in the resume's skills text."""
    skills_lower = skills_text.lower()
    return [s for s in mandatory_skills if s.lower() in skills_lower]


def _extract_missing_skills(mandatory_skills: list, skills_text: str) -> list:
    """Find which mandatory skills are absent from the resume's skills text."""
    skills_lower = skills_text.lower()
    return [s for s in mandatory_skills if s.lower() not in skills_lower]


def _build_summary(evaluation: dict, normalized: dict) -> str:
    """Build a short human-readable summary from the evaluation."""
    parts = []
    name = evaluation.get("candidate_name", "Candidate")
    verdict = evaluation.get("verdict", "Unknown")
    fit = evaluation.get("role_fit", "Unknown")
    exp = evaluation.get("experience_match", "Unknown")
    skills_pct = evaluation.get("skills_match_percent", 0)

    parts.append(f"{name}: {verdict}.")
    parts.append(f"Role fit: {fit}. Experience match: {exp}. Skills match: {skills_pct}%.")

    if normalized.get("education"):
        edu_short = normalized["education"][:120]
        parts.append(f"Education: {edu_short}.")

    return " ".join(parts)
