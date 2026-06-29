"""
Ranking & Reporting Module (NO AI)
===================================
Pure logic — no Gemini calls.
- Sort candidates by score
- Assign ranks
- Bucket into verdict categories
- Generate summary or detailed report structures
"""


def rank_candidates(candidates: list) -> list:
    """
    Sort candidates by score descending and assign ranks.
    Expects each candidate dict to have at least a "score" key.
    Returns the same list, mutated with "rank" added.
    """
    candidates.sort(key=lambda c: c.get("score", 0), reverse=True)
    for i, c in enumerate(candidates):
        c["rank"] = i + 1
    return candidates


def bucket_candidates(candidates: list) -> dict:
    """
    Group candidates into verdict buckets.
    Returns: { "Shortlist": [...], "Borderline": [...], "Reject": [...] }
    """
    buckets = {"Shortlist": [], "Borderline": [], "Reject": []}
    for c in candidates:
        verdict = c.get("verdict", "Reject")
        if verdict not in buckets:
            verdict = "Reject"
        buckets[verdict].append(c)
    return buckets


def generate_summary_report(job: dict, candidates: list) -> dict:
    """
    Build a SUMMARY report payload.
    Table-style: Name | Score | Rank | Verdict
    """
    ranked = rank_candidates(candidates)
    rows = []
    for c in ranked:
        rows.append({
            "rank": c.get("rank"),
            "candidateName": c.get("candidateName", "Unknown"),
            "score": c.get("score", 0),
            "verdict": c.get("verdict", ""),
            "status": c.get("status", ""),
            "resumeId": c.get("resumeId", ""),
            "filename": c.get("filename", ""),
        })

    return {
        "job": _serialize_job(job),
        "candidates": rows,
        "buckets": _bucket_summary(ranked),
    }


def generate_detailed_report(job: dict, candidates: list) -> dict:
    """
    Build a DETAILED report payload.
    Expandable cards per candidate with full analysis data.
    """
    ranked = rank_candidates(candidates)
    cards = []
    for c in ranked:
        cards.append({
            "rank": c.get("rank"),
            "candidateName": c.get("candidateName", "Unknown"),
            "score": c.get("score", 0),
            "verdict": c.get("verdict", ""),
            "experienceMatch": c.get("experienceMatch", ""),
            "skillsMatchPercent": c.get("skillsMatchPercent", 0),
            "roleFit": c.get("roleFit", ""),
            "aiContentProbability": c.get("aiContentProbability", ""),
            "matchedSkills": c.get("matchedSkills", []),
            "missingSkills": c.get("missingSkills", []),
            "summary": c.get("summary", ""),
            "status": c.get("status", ""),
            "resumeId": c.get("resumeId", ""),
            "filename": c.get("filename", ""),
        })

    return {
        "job": _serialize_job(job),
        "candidates": cards,
        "buckets": _bucket_summary(ranked),
    }


def generate_report(job: dict, candidates: list) -> dict:
    """
    Dispatch to summary or detailed based on job's reportType.
    """
    report_type = job.get("reportType", "SUMMARY")
    if report_type == "DETAILED":
        return generate_detailed_report(job, candidates)
    return generate_summary_report(job, candidates)


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _serialize_job(job: dict) -> dict:
    """Extract only the fields the frontend needs from the job document."""
    return {
        "jobId": str(job.get("_id", "")),
        "jobTitle": job.get("jobTitle", ""),
        "reportType": job.get("reportType", "SUMMARY"),
        "scoringScale": job.get("scoringScale", "10"),
        "status": job.get("status", ""),
        "seniorityLevel": job.get("seniorityLevel", ""),
        "industry": job.get("industry", ""),
    }


def _bucket_summary(ranked: list) -> dict:
    """Return counts per verdict bucket."""
    buckets = bucket_candidates(ranked)
    return {
        "shortlist": len(buckets.get("Shortlist", [])),
        "borderline": len(buckets.get("Borderline", [])),
        "reject": len(buckets.get("Reject", [])),
    }
