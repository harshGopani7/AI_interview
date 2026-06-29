from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config import organizations_collection

job_master_bp = Blueprint("job_master", __name__)


# ===========================
# GET /api/job-master
# Get all job positions for the organization
# ===========================
@job_master_bp.route("/job-master", methods=["GET"])
@jwt_required()
def get_job_positions():
    """Get all job positions for the logged-in organization."""
    org_id = get_jwt_identity()
    
    org = organizations_collection.find_one({"_id": ObjectId(org_id)})
    if not org:
        return jsonify({"error": "Organization not found"}), 404
    
    job_master = org.get("job_master", [])
    
    # Convert ObjectId to string for each job
    for job in job_master:
        if "_id" in job:
            job["_id"] = str(job["_id"])
    
    return jsonify({"jobs": job_master}), 200


# ===========================
# POST /api/job-master
# Create a new job position
# ===========================
@job_master_bp.route("/job-master", methods=["POST"])
@jwt_required()
def create_job_position():
    """Create a new job position for the organization."""
    org_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ["jobTitle", "jobDescription", "minEducation", "educationField", "minExperience", "jobLocation"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
    
    # Create job object
    job = {
        "_id": ObjectId(),
        "jobTitle": data["jobTitle"],
        "jobDescription": data["jobDescription"],
        "minEducation": data["minEducation"],
        "educationField": data["educationField"],
        "minExperience": data["minExperience"],
        "otherRequirements": data.get("otherRequirements", ""),
        "jobLocation": data["jobLocation"],
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }
    
    # Add job to organization's job_master array
    result = organizations_collection.update_one(
        {"_id": ObjectId(org_id)},
        {"$push": {"job_master": job}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Failed to create job position"}), 500
    
    job["_id"] = str(job["_id"])
    return jsonify({"message": "Job position created successfully", "job": job}), 201


# ===========================
# PUT /api/job-master/<job_id>
# Update an existing job position
# ===========================
@job_master_bp.route("/job-master/<job_id>", methods=["PUT"])
@jwt_required()
def update_job_position(job_id):
    """Update an existing job position."""
    org_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ["jobTitle", "jobDescription", "minEducation", "educationField", "minExperience", "jobLocation"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
    
    # Update the specific job in the array
    result = organizations_collection.update_one(
        {"_id": ObjectId(org_id), "job_master._id": ObjectId(job_id)},
        {
            "$set": {
                "job_master.$.jobTitle": data["jobTitle"],
                "job_master.$.jobDescription": data["jobDescription"],
                "job_master.$.minEducation": data["minEducation"],
                "job_master.$.educationField": data["educationField"],
                "job_master.$.minExperience": data["minExperience"],
                "job_master.$.otherRequirements": data.get("otherRequirements", ""),
                "job_master.$.jobLocation": data["jobLocation"],
                "job_master.$.updatedAt": datetime.utcnow().isoformat(),
            }
        }
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Job position not found or no changes made"}), 404
    
    return jsonify({"message": "Job position updated successfully"}), 200


# ===========================
# DELETE /api/job-master/<job_id>
# Delete a job position
# ===========================
@job_master_bp.route("/job-master/<job_id>", methods=["DELETE"])
@jwt_required()
def delete_job_position(job_id):
    """Delete a job position."""
    org_id = get_jwt_identity()
    
    # Remove the job from the array
    result = organizations_collection.update_one(
        {"_id": ObjectId(org_id)},
        {"$pull": {"job_master": {"_id": ObjectId(job_id)}}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Job position not found"}), 404
    
    return jsonify({"message": "Job position deleted successfully"}), 200


# ===========================
# GET /api/job-master/check-first-time
# Check if organization has any job positions
# ===========================
@job_master_bp.route("/job-master/check-first-time", methods=["GET"])
@jwt_required()
def check_first_time():
    """Check if this is the first time the organization is creating a job position."""
    org_id = get_jwt_identity()
    
    org = organizations_collection.find_one({"_id": ObjectId(org_id)})
    if not org:
        return jsonify({"error": "Organization not found"}), 404
    
    job_master = org.get("job_master", [])
    is_first_time = len(job_master) == 0
    
    return jsonify({"isFirstTime": is_first_time}), 200
