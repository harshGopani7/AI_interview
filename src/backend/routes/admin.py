import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from config import organizations_collection, candidate_credentials_collection, scheduled_interviews_collection, screening_jobs_collection, screening_resumes_collection, subscriptions_col, pricing_col
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime

admin_bp = Blueprint("admin", __name__)

ADMIN_COLLECTION_NAME = "admin_users"

def get_admin_collection():
    from config import db
    return db[ADMIN_COLLECTION_NAME]

@admin_bp.route("/signup", methods=["POST"])
def admin_signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        return jsonify({"error": "Name, email and password are required"}), 400
    
    admin_collection = get_admin_collection()
    existing_admin = admin_collection.find_one({"email": email})
    
    if existing_admin:
        return jsonify({"error": "Admin email already registered"}), 409
    
    hashed_password = generate_password_hash(password)
    
    admin_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    
    result = admin_collection.insert_one(admin_user)
    
    return jsonify({"message": "Admin account created successfully"}), 201

@admin_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"email": email})
    
    if not admin or not check_password_hash(admin["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = create_access_token(identity=str(admin["_id"]))
    
    admin_data = {
        "id": str(admin["_id"]),
        "name": admin.get("name"),
        "email": admin["email"],
        "role": "admin"
    }
    
    return jsonify({"token": token, "user": admin_data}), 200

@admin_bp.route("/me", methods=["GET"])
@jwt_required()
def get_admin_me():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    
    admin_data = {
        "id": str(admin["_id"]),
        "name": admin.get("name"),
        "email": admin["email"],
        "role": "admin"
    }
    
    return jsonify(admin_data), 200

@admin_bp.route("/organizations", methods=["GET"])
@jwt_required()
def get_all_organizations():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    organizations = list(organizations_collection.find({"role": "organization"}))
    
    org_list = []
    for org in organizations:
        created_at = org.get("created_at")
        created_at_str = None
        if created_at:
            if hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = str(created_at)
        
        org_data = {
            "id": str(org["_id"]),
            "organizationName": org.get("organizationName"),
            "contactPersonName": org.get("contactPersonName"),
            "email": org.get("email"),
            "phone": org.get("phone"),
            "industry": org.get("industry"),
            "companySize": org.get("companySize"),
            "website": org.get("website"),
            "created_at": created_at_str
        }
        
        candidate_count = candidate_credentials_collection.count_documents({
            "organizationId": str(org["_id"])
        })
        org_data["candidateCount"] = candidate_count
        
        interview_count = scheduled_interviews_collection.count_documents({
            "organizationId": str(org["_id"])
        })
        org_data["interviewCount"] = interview_count
        
        org_list.append(org_data)
    
    return jsonify({"organizations": org_list}), 200

@admin_bp.route("/candidates", methods=["GET"])
@jwt_required()
def get_all_candidates():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    candidates = list(candidate_credentials_collection.find({}))
    
    candidate_list = []
    for candidate in candidates:
        org_id = candidate.get("organizationId")
        org_name = "Unknown"
        
        if org_id:
            org = organizations_collection.find_one({"_id": ObjectId(org_id)})
            if org:
                org_name = org.get("organizationName", "Unknown")
        
        created_at = candidate.get("createdAt")
        created_at_str = None
        if created_at:
            if hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = str(created_at)
        
        candidate_data = {
            "id": str(candidate["_id"]),
            "name": candidate.get("name"),
            "email": candidate.get("email"),
            "username": candidate.get("username"),
            "organizationId": str(org_id) if org_id else None,
            "organizationName": org_name,
            "createdAt": created_at_str
        }
        
        interview_count = scheduled_interviews_collection.count_documents({
            "credentialId": str(candidate["_id"])
        })
        candidate_data["interviewCount"] = interview_count
        
        candidate_list.append(candidate_data)
    
    return jsonify({"candidates": candidate_list}), 200

@admin_bp.route("/interviews", methods=["GET"])
@jwt_required()
def get_all_interviews():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    interviews = list(scheduled_interviews_collection.find({}))
    
    interview_list = []
    for interview in interviews:
        created_at = interview.get("createdAt")
        created_at_str = None
        if created_at:
            if hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = str(created_at)
        
        deadline = interview.get("deadline")
        deadline_str = None
        if deadline:
            if hasattr(deadline, 'isoformat'):
                deadline_str = deadline.isoformat()
            else:
                deadline_str = str(deadline)
        
        interview_data = {
            "id": str(interview["_id"]),
            "organizationId": interview.get("organizationId"),
            "organizationName": interview.get("organizationName"),
            "candidateName": interview.get("candidateName"),
            "candidateEmail": interview.get("candidateEmail"),
            "position": interview.get("position"),
            "schedulingType": interview.get("schedulingType"),
            "interviewType": interview.get("interviewType"),
            "duration": interview.get("duration"),
            "status": interview.get("status"),
            "completed": interview.get("completed"),
            "createdAt": created_at_str,
            "deadline": deadline_str,
            "tokens": interview.get("tokens"),
            "screenRecordingUrl": interview.get("screenRecordingUrl"),
            "cameraRecordingUrl": interview.get("cameraRecordingUrl")
        }
        interview_list.append(interview_data)
    
    return jsonify({"interviews": interview_list}), 200

@admin_bp.route("/cv-analysis", methods=["GET"])
@jwt_required()
def get_all_cv_analysis():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403

    jobs = list(screening_jobs_collection.find({}).sort("createdAt", -1))
    result = []
    for job in jobs:
        job_id = str(job["_id"])
        user_id = job.get("userId", "")

        org_name = "Unknown"
        if user_id:
            org = organizations_collection.find_one({"_id": ObjectId(user_id)})
            if org:
                org_name = org.get("organizationName", "Unknown")

        resume_count = screening_resumes_collection.count_documents({"jobId": job_id})
        analyzed_count = screening_resumes_collection.count_documents({"jobId": job_id, "status": "analyzed"})

        tokens = job.get("tokens", {})

        result.append({
            "jobId": job_id,
            "organizationName": org_name,
            "organizationId": user_id,
            "jobTitle": job.get("jobTitle", ""),
            "industry": job.get("industry", ""),
            "seniorityLevel": job.get("seniorityLevel", ""),
            "scoringScale": job.get("scoringScale", "10"),
            "reportType": job.get("reportType", "SUMMARY"),
            "status": job.get("status", ""),
            "totalResumes": resume_count,
            "analyzedResumes": analyzed_count,
            "totalTokens": tokens.get("total_tokens", 0),
            "promptTokens": tokens.get("prompt_tokens", 0),
            "completionTokens": tokens.get("completion_tokens", 0),
            "createdAt": job.get("createdAt", ""),
            "completedAt": job.get("completedAt", ""),
        })

    return jsonify({"jobs": result}), 200


@admin_bp.route("/cv-analysis/<job_id>", methods=["GET"])
@jwt_required()
def get_cv_analysis_detail(job_id):
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403

    job = screening_jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        return jsonify({"error": "Job not found"}), 404

    user_id = job.get("userId", "")
    org_name = "Unknown"
    if user_id:
        org = organizations_collection.find_one({"_id": ObjectId(user_id)})
        if org:
            org_name = org.get("organizationName", "Unknown")

    resumes = list(screening_resumes_collection.find({"jobId": job_id}))
    resume_list = []
    for r in resumes:
        analysis = r.get("analysis", {})
        resume_list.append({
            "resumeId": str(r["_id"]),
            "originalName": r.get("originalName", ""),
            "status": r.get("status", ""),
            "uploadedAt": r.get("uploadedAt", ""),
            "analyzedAt": r.get("analyzedAt", ""),
            "candidateName": analysis.get("candidateName", r.get("originalName", "Unknown")),
            "score": analysis.get("score", 0),
            "experienceMatch": analysis.get("experienceMatch", ""),
            "skillsMatchPercent": analysis.get("skillsMatchPercent", 0),
            "roleFit": analysis.get("roleFit", ""),
            "aiContentProbability": analysis.get("aiContentProbability", ""),
            "verdict": analysis.get("verdict", ""),
            "matchedSkills": analysis.get("matchedSkills", []),
            "missingSkills": analysis.get("missingSkills", []),
            "summary": analysis.get("summary", ""),
            "normalizedData": analysis.get("normalizedData", {}),
        })

    tokens = job.get("tokens", {})

    return jsonify({
        "job": {
            "jobId": job_id,
            "jobTitle": job.get("jobTitle", ""),
            "jobDescription": job.get("jobDescription", ""),
            "industry": job.get("industry", ""),
            "seniorityLevel": job.get("seniorityLevel", ""),
            "requiredExperience": job.get("requiredExperience", ""),
            "mandatorySkills": job.get("mandatorySkills", []),
            "scoringScale": job.get("scoringScale", "10"),
            "reportType": job.get("reportType", "SUMMARY"),
            "status": job.get("status", ""),
            "organizationName": org_name,
            "totalTokens": tokens.get("total_tokens", 0),
            "createdAt": job.get("createdAt", ""),
            "completedAt": job.get("completedAt", ""),
        },
        "resumes": resume_list,
    }), 200


@admin_bp.route("/cv-analysis/resume/<resume_id>/download", methods=["GET"])
@jwt_required()
def download_resume(resume_id):
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403

    resume = screening_resumes_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    file_path = resume.get("path", "")
    if not file_path or not os.path.isfile(file_path):
        return jsonify({"error": "File not found on disk"}), 404

    return send_file(
        file_path,
        as_attachment=True,
        download_name=resume.get("originalName", "resume")
    )


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_admin_stats():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    total_organizations = organizations_collection.count_documents({"role": "organization"})
    total_candidates = candidate_credentials_collection.count_documents({})
    total_interviews = scheduled_interviews_collection.count_documents({})
    completed_interviews = scheduled_interviews_collection.count_documents({"completed": True})
    scheduled_interviews = scheduled_interviews_collection.count_documents({"status": "scheduled"})
    
    stats = {
        "totalOrganizations": total_organizations,
        "totalCandidates": total_candidates,
        "totalInterviews": total_interviews,
        "completedInterviews": completed_interviews,
        "scheduledInterviews": scheduled_interviews
    }
    
    return jsonify(stats), 200


# ---------------------------------------------------------------------------
# GET /admin/subscriptions
# Returns all org subscriptions with usage stats for admin management.
# ---------------------------------------------------------------------------
@admin_bp.route("/subscriptions", methods=["GET"])
@jwt_required()
def get_all_subscriptions():
    try:
        admin_id = get_jwt_identity()
        admin_collection = get_admin_collection()
        if not admin_collection.find_one({"_id": ObjectId(admin_id)}):
            return jsonify({"error": "Unauthorized"}), 403

        orgs = list(organizations_collection.find({"role": "organization"}))
        result = []

        for org in orgs:
            org_id = org["_id"]
            try:
                sub = subscriptions_col.find_one(
                    {"organizationId": ObjectId(org_id), "status": {"$in": ["active", "created", "authenticated"]}},
                    sort=[("createdAt", -1)],
                )
                if not sub:
                    sub = subscriptions_col.find_one(
                        {"organizationId": ObjectId(org_id)},
                        sort=[("createdAt", -1)],
                    )
            except Exception as e:
                print(f"Error finding subscription for org {org_id}: {e}")
                sub = None

            tier = sub.get("tier") if sub else None
            plan = None
            if tier:
                plan = pricing_col.find_one({"name": {"$regex": f"^{tier}$", "$options": "i"}})

            result.append({
                "orgId": str(org_id),
                "organizationName": org.get("organizationName", ""),
                "email": org.get("email", ""),
                "phone": org.get("phone", ""),
                "serviceType": org.get("serviceType", ""),
                "cvUsed": org.get("cvUsed", 0),
                "cvLimit": org.get("cvLimit", plan.get("cv_limit", 0) if plan else 0),
                "interviewUsed": org.get("interviewUsed", 0),
                "interviewLimit": org.get("interviewLimit", plan.get("interview_limit", 0) if plan else 0),
                "subscription": {
                    "tier": tier,
                    "status": sub.get("status") if sub else None,
                    "provider": sub.get("provider") if sub else None,
                    "currentPeriodEnd": sub.get("currentPeriodEnd") if sub else None,
                    "cancelAtPeriodEnd": sub.get("cancelAtPeriodEnd", False) if sub else False,
                    "razorpaySubscriptionId": sub.get("razorpaySubscriptionId") if sub else None,
                    "stripeSubscriptionId": sub.get("stripeSubscriptionId") if sub else None,
                } if sub else None,
                "planName": plan.get("name", "") if plan else "",
                "planPrice": plan.get("price", 0) if plan else 0,
            })

        return jsonify({"subscriptions": result}), 200
    except Exception as e:
        print(f"Error in get_all_subscriptions: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /admin/subscriptions/<org_id>/cv-limit
# Body: { "cvLimit": 100 }
# Manually override the cv_limit for an organization.
# ---------------------------------------------------------------------------
@admin_bp.route("/subscriptions/<org_id>/cv-limit", methods=["POST"])
@jwt_required()
def update_cv_limit(org_id):
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    if not admin_collection.find_one({"_id": ObjectId(admin_id)}):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json or {}
    new_limit = data.get("cvLimit")
    if new_limit is None or not isinstance(new_limit, (int, float)) or int(new_limit) < 0:
        return jsonify({"error": "cvLimit must be a non-negative integer"}), 400

    result = organizations_collection.update_one(
        {"_id": ObjectId(org_id)},
        {"$set": {"cvLimit": int(new_limit)}},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Organization not found"}), 404

    return jsonify({"message": f"CV limit updated to {int(new_limit)}"}), 200


# ---------------------------------------------------------------------------
# POST /admin/subscriptions/<org_id>/interview-limit
# Body: { "interviewLimit": 30 }
# Manually override the interview_limit for an organization.
# ---------------------------------------------------------------------------
@admin_bp.route("/subscriptions/<org_id>/interview-limit", methods=["POST"])
@jwt_required()
def update_interview_limit(org_id):
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    if not admin_collection.find_one({"_id": ObjectId(admin_id)}):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json or {}
    new_limit = data.get("interviewLimit")
    if new_limit is None or not isinstance(new_limit, (int, float)) or int(new_limit) < 0:
        return jsonify({"error": "interviewLimit must be a non-negative integer"}), 400

    result = organizations_collection.update_one(
        {"_id": ObjectId(org_id)},
        {"$set": {"interviewLimit": int(new_limit)}},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Organization not found"}), 404

    return jsonify({"message": f"Interview limit updated to {int(new_limit)}"}), 200


# ---------------------------------------------------------------------------
# POST /admin/subscriptions/<org_id>/reset-usage
# Resets cvUsed and interviewUsed counters to 0 for an org.
# ---------------------------------------------------------------------------
@admin_bp.route("/subscriptions/<org_id>/reset-usage", methods=["POST"])
@jwt_required()
def reset_usage(org_id):
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    if not admin_collection.find_one({"_id": ObjectId(admin_id)}):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json or {}
    fields = {}
    if data.get("resetCv", True):
        fields["cvUsed"] = 0
    if data.get("resetInterview", False):
        fields["interviewUsed"] = 0

    if not fields:
        return jsonify({"error": "Nothing to reset"}), 400

    organizations_collection.update_one({"_id": ObjectId(org_id)}, {"$set": fields})
    return jsonify({"message": "Usage reset successfully"}), 200
