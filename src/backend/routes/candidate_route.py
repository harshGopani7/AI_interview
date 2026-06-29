from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import scheduled_interviews_collection, candidate_credentials_collection, candidate_interview, interview_results_collection
from bson import ObjectId
from datetime import datetime

candidate_bp = Blueprint("candidate", __name__)

@candidate_bp.route("/scheduled-interviews", methods=["GET"])
@jwt_required()
def get_candidate_scheduled_interviews():
    credential_id = get_jwt_identity()

    scheduled_interviews = list(
        scheduled_interviews_collection.find({
            "credentialId": credential_id.strip(),
            "completed": False
        })
    )
    # print(scheduled_interviews)

    for interview in scheduled_interviews:
        interview["_id"] = str(interview["_id"])

        for field in ["createdAt", "deadline", "scheduledDate"]:
            if field in interview and isinstance(interview[field], datetime):
                interview[field] = interview[field].isoformat()

    return jsonify({"scheduledInterviews": scheduled_interviews}), 200

# BElow are All Interviews taken by Candidate
@candidate_bp.route("/all-interviews", methods=["GET"])
@jwt_required()
def get_candidate_all_interviews():
    credential_id = get_jwt_identity()

    scheduled_interviews = list(
        scheduled_interviews_collection.find({
            "credentialId": credential_id.strip()
        })
    )
    # print(scheduled_interviews)

    for interview in scheduled_interviews:
        interview["_id"] = str(interview["_id"])

        for field in ["createdAt", "deadline", "scheduledDate"]:
            if field in interview and isinstance(interview[field], datetime):
                interview[field] = interview[field].isoformat()

    return jsonify({"scheduledInterviews": scheduled_interviews}), 200

@candidate_bp.route("/interview-history", methods=["GET"])
@jwt_required()
def get_candidate_interview_history():
    """
    Get completed interviews for the authenticated candidate
    """
    credential_id = get_jwt_identity()
    
    completed_interviews = list(scheduled_interviews_collection.find({
        "credentialId": credential_id.strip(),
        "completed": True
    }))
    
    for interview in completed_interviews:
        interview["_id"] = str(interview["_id"])
        if "createdAt" in interview:
            interview["createdAt"] = interview["createdAt"].isoformat()
        if "completedAt" in interview:
            interview["completedAt"] = interview["completedAt"].isoformat()
    
    return jsonify({"completedInterviews": completed_interviews}), 200

@candidate_bp.route("/dashboard-stats", methods=["GET"])
@jwt_required()
def get_candidate_dashboard_stats():
    """
    Get dashboard statistics for the authenticated candidate
    """
    credential_id = get_jwt_identity()
    
    total_scheduled = scheduled_interviews_collection.count_documents({
        "credentialId": credential_id.strip()
    })
    
    completed_count = scheduled_interviews_collection.count_documents({
        "credentialId": credential_id.strip(),
        "completed": True
    })
    
    pending_count = scheduled_interviews_collection.count_documents({
        "credentialId": credential_id.strip(),
        "completed": False
    })
    
    completed_interviews = list(scheduled_interviews_collection.find({
        "credentialId": credential_id.strip(),
        "completed": True
    }))
    
    average_score = 0
    best_score = 0
    last_interview = None
    
    if completed_interviews:
        scores = [interview.get("score", 0) for interview in completed_interviews if "score" in interview]
        if scores:
            average_score = sum(scores) / len(scores)
            best_score = max(scores)
        
        sorted_interviews = sorted(
            completed_interviews,
            key=lambda x: x.get("completedAt", datetime.min),
            reverse=True
        )
        if sorted_interviews:
            last_interview = sorted_interviews[0].get("completedAt")
            if last_interview:
                last_interview = last_interview.isoformat()
    
    return jsonify({
        "stats": {
            "totalInterviews": total_scheduled,
            "completedInterviews": completed_count,
            "pendingInterviews": pending_count,
            "averageScore": round(average_score, 2),
            "bestScore": round(best_score, 2),
            "lastInterview": last_interview
        }
    }), 200

@candidate_bp.route("/interview/<interview_id>", methods=["GET"])
@jwt_required()
def get_interview_details(interview_id):
    """
    Get details of a specific interview
    """
    credential_id = get_jwt_identity()
    
    try:
        interview = scheduled_interviews_collection.find_one({
            "_id": ObjectId(interview_id),
            "credentialId": credential_id.strip()
        })
        
        if not interview:
            return jsonify({"error": "Interview not found"}), 404
        
        interview["_id"] = str(interview["_id"])
        if "createdAt" in interview:
            interview["createdAt"] = interview["createdAt"].isoformat()
        if "deadline" in interview:
            interview["deadline"] = interview["deadline"].isoformat()
        if "scheduledDate" in interview:
            interview["scheduledDate"] = interview["scheduledDate"].isoformat()
        if "completedAt" in interview:
            interview["completedAt"] = interview["completedAt"].isoformat()
        
        return jsonify({"interview": interview}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@candidate_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_candidate_profile():
    """
    Get candidate profile information
    """
    credential_id = get_jwt_identity()
    
    try:
        credential = candidate_credentials_collection.find_one({
            "_id": ObjectId(credential_id.strip())
        })
        
        if not credential:
            return jsonify({"error": "Profile not found"}), 404
        
        profile = {
            "name": credential.get("name"),
            "email": credential.get("email"),
            "username": credential.get("username"),
            "createdAt": credential.get("createdAt").isoformat() if "createdAt" in credential else None
        }
        
        return jsonify({"profile": profile}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@candidate_bp.route("/full-interview-details/<credential_id>", methods=["GET"])
@jwt_required()
def get_full_interview_details(credential_id):
    """
    Get full interview details from candidate_interview collection
    """
    auth_credential_id = get_jwt_identity()
    
    if auth_credential_id.strip() != credential_id.strip():
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        interview_details = candidate_interview.find_one({
            "_id": ObjectId(credential_id.strip())
        })
        
        if not interview_details:
            return jsonify({"error": "Interview details not found"}), 404
        
        interview_details["_id"] = str(interview_details["_id"])
        
        if "createdAt" in interview_details:
            if isinstance(interview_details["createdAt"], datetime):
                interview_details["createdAt"] = interview_details["createdAt"].isoformat()
            else:
                interview_details["createdAt"] = str(interview_details["createdAt"])
        
        if "updatedAt" in interview_details:
            if isinstance(interview_details["updatedAt"], datetime):
                interview_details["updatedAt"] = interview_details["updatedAt"].isoformat()
            else:
                interview_details["updatedAt"] = str(interview_details["updatedAt"])
        
        return jsonify({"interviewDetails": interview_details}), 200
    except Exception as e:
        print(f"Error fetching interview details: {str(e)}")
        return jsonify({"error": str(e)}), 400

@candidate_bp.route("/interview-results", methods=["GET"])
@jwt_required()
def get_candidate_results():
    """
    Get all published interview results for the authenticated candidate
    """
    credential_id = get_jwt_identity()
    print(credential_id)
    try:
        # Find all published results for this candidate
        results = list(interview_results_collection.find({
            "credentialId": credential_id.strip(),
            "published": True
        }))
        
        results_list = []
        if not results:
            print("No results found")
        
        for result in results:
            print(result)
            # Get interview details
            scheduled_interview = scheduled_interviews_collection.find_one({
                "_id": ObjectId(result.get("scheduledInterviewId"))
            }) if result.get("scheduledInterviewId") else None
            
            result_data = {
                "_id": str(result["_id"]),
                "position": scheduled_interview.get("position") if scheduled_interview else "Unknown",
                "interviewType": scheduled_interview.get("interviewType") if scheduled_interview else "Unknown",
                "score": result.get("score", 0),
                "strengths": result.get("strengths", []),
                "improvements": result.get("improvements", []),
                "communication": result.get("communication", "Average"),
                "technical_depth": result.get("technical_depth", "Average"),
                "qa_pairs": result.get("qa_pairs", []),
                "completed_at": result.get("completed_at").isoformat() if result.get("completed_at") else None,
                "published_at": result.get("publishedAt").isoformat() if result.get("publishedAt") else None
            }
            results_list.append(result_data)
        
        return jsonify({"results": results_list}), 200
    except Exception as e:
        print(f"Error fetching candidate results: {e}")
        return jsonify({"error": str(e)}), 500
