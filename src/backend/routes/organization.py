from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import organizations_collection, candidate_credentials_collection, scheduled_interviews_collection, interview_results_collection, subscriptions_col, screening_jobs_collection, screening_resumes_collection, pricing_col
from bson import ObjectId
from datetime import datetime, timedelta
import os
import secrets
import string
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from config import interviews_collection

organization_bp = Blueprint("organization", __name__)

UPLOAD_FOLDER = "uploads/resumes"
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_password(length=10):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def generate_username(name, email):
    base = name.lower().replace(" ", "")[:8]
    random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
    return f"{base}{random_suffix}"

@organization_bp.route("/schedule-interview", methods=["POST"])
@jwt_required()
def schedule_interview():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    # Check interview limit from org doc (source of truth)
    interview_used = user.get("interviewUsed", 0)
    interview_limit = user.get("interviewLimit", 0)

    sub_doc = subscriptions_col.find_one({"organizationId": ObjectId(user_id)}, sort=[("createdAt", -1)])
    tier = (sub_doc.get("tier", "basic") if sub_doc else "basic").lower()

    # Fall back to pricing collection if interviewLimit not set on org yet
    if interview_limit == 0:
        pricing_plan = pricing_col.find_one({"name": {"$regex": f"^{tier}$", "$options": "i"}})
        interview_limit = pricing_plan.get("interview_limit", 5) if pricing_plan else 5

    if interview_limit > 0 and interview_used >= interview_limit:
        return jsonify({"error": f"Interview limit reached ({interview_limit} interviews for {tier.capitalize()} plan). Please upgrade your plan.", "limitReached": True}), 403

    data = request.json
    
    required_fields = ["candidateName", "candidateEmail", "position", "schedulingType", "interviewType", "duration"]
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    
    candidate_name = data["candidateName"]
    candidate_email = data["candidateEmail"]
    
    # Scope credentials by organization - same candidate can have different credentials for different orgs
    existing_credential = candidate_credentials_collection.find_one({
        "email": candidate_email,
        "organizationId": user_id
    })
    
    if existing_credential:
        username = existing_credential["username"]
        password = existing_credential["plainPassword"]
        credential_id = str(existing_credential["_id"])
    else:
        username = generate_username(candidate_name, candidate_email)
        password = generate_password()
        
        credential_doc = {
            "name": candidate_name,
            "email": candidate_email,
            "username": username,
            "password": generate_password_hash(password),
            "plainPassword": password,
            "createdAt": datetime.now(),
            "organizationId": user_id
        }
        credential_result = candidate_credentials_collection.insert_one(credential_doc)
        credential_id = str(credential_result.inserted_id)
    
    scheduled_interview = {
        "organizationId": user_id,
        "organizationName": user.get("organizationName"),
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "credentialId": credential_id,
        "position": data["position"],
        "natureOfPosition": data.get("natureOfPosition", ""),
        "educationalQualification": data.get("educationalQualification", ""),
        "pastWorkExperienceYears": data.get("pastWorkExperienceYears", ""),
        "pastWorkExperienceField": data.get("pastWorkExperienceField", ""),
        "currentWorkExperienceYears": data.get("currentWorkExperienceYears", ""),
        "currentWorkExperienceField": data.get("currentWorkExperienceField", ""),
        "coreSkillSet": data.get("coreSkillSet", ""),
        "typeOfCompany": data.get("typeOfCompany", ""),
        "schedulingType": data["schedulingType"],
        "interviewType": data["interviewType"],
        "duration": data["duration"],
        "status": "scheduled",
        "completed": False,
        "createdAt": datetime.now()
    }
    
    if data["schedulingType"] == "specific":
        if not data.get("specificDate") or not data.get("specificTime"):
            return jsonify({"error": "Specific date and time required"}), 400
        scheduled_interview["scheduledDate"] = f"{data['specificDate']} {data['specificTime']}"
    elif data["schedulingType"] == "timer":
        if not data.get("daysTimer"):
            return jsonify({"error": "Days timer required"}), 400
        scheduled_interview["daysTimer"] = data["daysTimer"]
        scheduled_interview["deadline"] = datetime.now() + timedelta(days=int(data["daysTimer"]))
    
    result = scheduled_interviews_collection.insert_one(scheduled_interview)

    # Increment interviewUsed on org doc
    organizations_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"interviewUsed": 1}}
    )

    interviews_collection.insert_one({
        "organizationId":   user_id,
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "position": data["position"],
        "interviewType": data["interviewType"],
        "status": "scheduled",
        "createdAt": datetime.now()
    })

    #Email the credentials to the candidate
    from services.email_config import send_general_email
    from services.email_templates import get_interview_credentials_template
    # 2. Generate the HTML using the template
    schedule_info = "Specific Date and Time" if data["schedulingType"] == "specific" else f"{data['daysTimer']} days from now"
    login_url = "https://interview.onewebmart.com/login" # Change to your real URL
    html_body = get_interview_credentials_template(
        candidate_name=candidate_name,
        position=data["position"],
        username=username,
        password=password,
        login_url=login_url,
        schedule_info=schedule_info
    )

    # 3. Send the Email
    subject = f"Interview Credentials for {data['position']}"
    plain_text = f"Hello {candidate_name}, your interview is scheduled. Username: {username}, Password: {password}"
    
    send_general_email(
        subject=subject,
        recipient_email=candidate_email,
        body=plain_text,
        html_content=html_body
    )
    
    return jsonify({
        "message": "Interview scheduled successfully",
        "interviewId": str(result.inserted_id),
        "credentials": {
            "username": username,
            "password": password,
            "email": candidate_email
        }
    }), 201

@organization_bp.route("/schedule-interview-resume", methods=["POST"])
@jwt_required()
def schedule_interview_resume():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    # Check interview limit based on subscription plan
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    interview_count = scheduled_interviews_collection.count_documents({
        "organizationId": user_id,
        "createdAt": {"$gte": start_of_month}
    })
    subscription = user.get("subscription", {})
    tier = subscription.get("tier", "basic").lower() if subscription else "basic"
    
    # Fetch interview limit from pricing collection
    pricing_plan = pricing_col.find_one({"name": {"$regex": f"^{tier}$", "$options": "i"}})
    max_allowed = pricing_plan.get("interview_limit", 5) if pricing_plan else 5
    
    if interview_count >= max_allowed:
        return jsonify({"error": f"Interview limit reached ({max_allowed} interviews for {tier.capitalize()} plan). Please upgrade your plan.", "limitReached": True}), 403
    
    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400
    
    file = request.files["resume"]
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PDF, DOC, DOCX allowed"}), 400
    
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    data = request.form
    candidate_name = data.get("candidateName", "Resume Candidate")
    candidate_email = data.get("candidateEmail", "")
    
    if not candidate_email:
        return jsonify({"error": "Candidate email is required"}), 400
    
    # Scope credentials by organization - same candidate can have different credentials for different orgs
    existing_credential = candidate_credentials_collection.find_one({
        "email": candidate_email,
        "organizationId": user_id
    })
    
    if existing_credential:
        username = existing_credential["username"]
        password = existing_credential["plainPassword"]
        credential_id = str(existing_credential["_id"])
    else:
        username = generate_username(candidate_name, candidate_email)
        password = generate_password()
        
        credential_doc = {
            "name": candidate_name,
            "email": candidate_email,
            "username": username,
            "password": generate_password_hash(password),
            "plainPassword": password,
            "createdAt": datetime.now(),
            "organizationId": user_id
        }
        credential_result = candidate_credentials_collection.insert_one(credential_doc)
        credential_id = str(credential_result.inserted_id)
    
    scheduled_interview = {
        "organizationId": user_id,
        "organizationName": user.get("organizationName"),
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "credentialId": credential_id,
        "resumePath": filepath,
        "position": data.get("position"),
        "natureOfPosition": data.get("natureOfPosition", ""),
        "educationalQualification": data.get("educationalQualification", ""),
        "pastWorkExperienceYears": data.get("pastWorkExperienceYears", ""),
        "pastWorkExperienceField": data.get("pastWorkExperienceField", ""),
        "currentWorkExperienceYears": data.get("currentWorkExperienceYears", ""),
        "currentWorkExperienceField": data.get("currentWorkExperienceField", ""),
        "coreSkillSet": data.get("coreSkillSet", ""),
        "typeOfCompany": data.get("typeOfCompany", ""),
        "schedulingType": data.get("schedulingType"),
        "interviewType": data.get("interviewType"),
        "duration": int(data.get("duration", 30)),
        "status": "scheduled",
        "completed": False,
        "createdAt": datetime.now()
    }
    
    if data.get("schedulingType") == "specific":
        scheduled_interview["scheduledDate"] = f"{data.get('specificDate')} {data.get('specificTime')}"
    elif data.get("schedulingType") == "timer":
        scheduled_interview["daysTimer"] = int(data.get("daysTimer", 2))
        scheduled_interview["deadline"] = datetime.now() + timedelta(days=int(data.get("daysTimer", 2)))
    
    result = scheduled_interviews_collection.insert_one(scheduled_interview)
    
    # Print all scheduled interview details
    print("\n" + "="*80)
    print("SCHEDULED INTERVIEW DETAILS (RESUME UPLOAD)")
    print("="*80)
    print(f"Interview ID: {result.inserted_id}")
    print(f"Organization: {user.get('organizationName')}")
    print(f"Candidate Name: {candidate_name}")
    print(f"Candidate Email: {candidate_email}")
    print(f"Resume Path: {filepath}")
    print(f"Position: {data.get('position')}")
    print(f"Nature of Position: {data.get('natureOfPosition', 'N/A')}")
    print(f"Educational Qualification: {data.get('educationalQualification', 'N/A')}")
    print(f"Past Work Experience: {data.get('pastWorkExperienceYears', 'N/A')} years in {data.get('pastWorkExperienceField', 'N/A')}")
    print(f"Current Work Experience: {data.get('currentWorkExperienceYears', 'N/A')} years in {data.get('currentWorkExperienceField', 'N/A')}")
    print(f"Core Skill Set: {data.get('coreSkillSet', 'N/A')}")
    print(f"Type of Company: {data.get('typeOfCompany', 'N/A')}")
    print(f"Interview Type: {data.get('interviewType')}")
    print(f"Duration: {data.get('duration', 30)} minutes")
    print(f"Scheduling Type: {data.get('schedulingType')}")
    if data.get('schedulingType') == 'specific':
        print(f"Scheduled Date & Time: {data.get('specificDate')} {data.get('specificTime')}")
    else:
        print(f"Days Timer: {data.get('daysTimer')} days")
    print(f"Credentials - Username: {username}, Password: {password}")
    print(f"Created At: {datetime.now()}")
    print("="*80 + "\n")
    
    interviews_collection.insert_one({
        "organizationId": user_id,
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "position": data.get("position"),
        "interviewType": data.get("interviewType"),
        "status": "scheduled",
        "createdAt": datetime.now()
    })
    
    return jsonify({
        "message": "Interview scheduled successfully with resume",
        "interviewId": str(result.inserted_id),
        "credentials": {
            "username": username,
            "password": password,
            "email": candidate_email
        }
    }), 201

@organization_bp.route("/interviews", methods=["GET"])
@jwt_required()
def get_interviews():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403

    scheduled_interviews = list(scheduled_interviews_collection.find({ "organizationId": user_id }))
    
    interviews_with_credentials = []
    for interview in scheduled_interviews:
        credential = candidate_credentials_collection.find_one({"_id": ObjectId(interview.get("credentialId"))})
        
        interview_data = {
            "_id": str(interview["_id"]),
            "candidateName": interview.get("candidateName"),
            "candidateEmail": interview.get("candidateEmail"),
            "position": interview.get("position"),
            "natureOfPosition": interview.get("natureOfPosition"),
            "educationalQualification": interview.get("educationalQualification"),
            "pastWorkExperienceYears": interview.get("pastWorkExperienceYears"),
            "pastWorkExperienceField": interview.get("pastWorkExperienceField"),
            "currentWorkExperienceYears": interview.get("currentWorkExperienceYears"),
            "currentWorkExperienceField": interview.get("currentWorkExperienceField"),
            "coreSkillSet": interview.get("coreSkillSet"),
            "typeOfCompany": interview.get("typeOfCompany"),
            "interviewType": interview.get("interviewType"),
            "duration": interview.get("duration"),
            "status": "completed" if interview.get("completed") else "scheduled",
            "daysTimer": interview.get("daysTimer"),
            "scheduledDate": interview.get("scheduledDate"),
            "completed": interview.get("completed")
        }
        
        if credential:
            interview_data["username"] = credential.get("username")
            interview_data["password"] = credential.get("plainPassword")
        
        if "createdAt" in interview:
            interview_data["createdAt"] = interview["createdAt"].isoformat()
        if "deadline" in interview:
            interview_data["deadline"] = interview["deadline"].isoformat()
        
        interviews_with_credentials.append(interview_data)
    
    return jsonify({"interviews": interviews_with_credentials}), 200

@organization_bp.route("/interviews/<interview_id>", methods=["PUT"])
@jwt_required()
def update_interview(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    
    try:
        # Build update document
        update_fields = {
            "candidateName": data.get("candidateName"),
            "candidateEmail": data.get("candidateEmail"),
            "position": data.get("position"),
            "natureOfPosition": data.get("natureOfPosition", ""),
            "educationalQualification": data.get("educationalQualification", ""),
            "pastWorkExperienceYears": data.get("pastWorkExperienceYears", ""),
            "pastWorkExperienceField": data.get("pastWorkExperienceField", ""),
            "currentWorkExperienceYears": data.get("currentWorkExperienceYears", ""),
            "currentWorkExperienceField": data.get("currentWorkExperienceField", ""),
            "coreSkillSet": data.get("coreSkillSet", ""),
            "typeOfCompany": data.get("typeOfCompany", ""),
            "interviewType": data.get("interviewType"),
            "duration": data.get("duration"),
            "schedulingType": data.get("schedulingType")
        }
        
        # Handle scheduling type specific fields
        if data.get("schedulingType") == "specific":
            if data.get("specificDate") and data.get("specificTime"):
                update_fields["scheduledDate"] = f"{data['specificDate']} {data['specificTime']}"
            update_fields["daysTimer"] = None
            if "deadline" in scheduled_interviews_collection.find_one({"_id": ObjectId(interview_id)}) or {}:
                update_fields["deadline"] = None
        elif data.get("schedulingType") == "timer":
            if data.get("daysTimer"):
                update_fields["daysTimer"] = int(data["daysTimer"])
                update_fields["deadline"] = datetime.now() + timedelta(days=int(data["daysTimer"]))
            update_fields["scheduledDate"] = None
        
        # Update the interview
        result = scheduled_interviews_collection.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return jsonify({"message": "Interview updated successfully"}), 200
        else:
            return jsonify({"error": "Interview not found"}), 404
    except Exception as e:
        print(f"Error updating interview: {e}")
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/interviews/<interview_id>", methods=["DELETE"])
@jwt_required()
def delete_interview(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        result = scheduled_interviews_collection.delete_one({"_id": ObjectId(interview_id)})
        
        if result.deleted_count > 0:
            interviews_collection.delete_many({"candidateEmail": {"$exists": True}})
            return jsonify({"message": "Interview deleted successfully"}), 200
        else:
            return jsonify({"error": "Interview not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/candidates", methods=["GET"])
@jwt_required()
def get_candidates():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    from config import db
    interviews_collection = db["interviews"]
    
    interviews = list(interviews_collection.find({"organizationId": user_id}))
    
    candidates_dict = {}
    for interview in interviews:
        email = interview.get("candidateEmail")
        if email:
            if email not in candidates_dict:
                candidates_dict[email] = {
                    "name": interview.get("candidateName"),
                    "email": email,
                    "position": interview.get("position"),
                    "interviewCount": 0,
                    "status": "active"
                }
            candidates_dict[email]["interviewCount"] += 1
    
    candidates = list(candidates_dict.values())
    
    return jsonify({"candidates": candidates}), 200

@organization_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    
    update_fields = {}
    allowed_fields = ["organizationName", "contactPersonName", "phone", "industry", "companySize", "website"]
    
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]
    
    if update_fields:
        organizations_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )
    
    return jsonify({"message": "Profile updated successfully"}), 200

@organization_bp.route("/candidates-list", methods=["GET"])
@jwt_required()
def get_candidates_list():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    candidates = list(candidate_credentials_collection.find({"organizationId": user_id }))
    # print(candidates)
    candidates_list = []
    for candidate in candidates:
        credential_id = str(candidate["_id"])
        
        # Count interviews for this candidate
        interview_count = scheduled_interviews_collection.count_documents({"credentialId": credential_id})
        
        # Get latest interview position
        latest_interview = scheduled_interviews_collection.find_one(
            {"credentialId": credential_id},
            sort=[("createdAt", -1)]
        )
        
        candidates_list.append({
            "_id": credential_id,
            "name": candidate.get("name"),
            "email": candidate.get("email"),
            "phone": candidate.get("phone", ""),
            "interviewCount": interview_count,
            "position": latest_interview.get("position") if latest_interview else None,
            "status": "active"
        })
        
    return jsonify({"candidates": candidates_list}), 200

@organization_bp.route("/candidate-details/<credential_id>", methods=["GET"])
@jwt_required()
def get_candidate_details(credential_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        # Get candidate credentials
        candidate = candidate_credentials_collection.find_one({"_id": ObjectId(credential_id)})
        
        if not candidate or candidate.get("organizationId") != user_id:
            return jsonify({"error": "Candidate not found"}), 404
        
        # Get all scheduled interviews for this candidate
        interviews = list(scheduled_interviews_collection.find({"credentialId": credential_id}))
        
        interviews_data = []
        for interview in interviews:
            interview_id = str(interview["_id"])
            
            # Get interview results if available
            result = interview_results_collection.find_one({"scheduledInterviewId": interview_id})
            
            # Helper function to safely convert datetime to isoformat
            def safe_isoformat(value):
                if value is None:
                    return None
                if isinstance(value, str):
                    return value  # Already a string, return as-is
                if hasattr(value, 'isoformat'):
                    return value.isoformat()  # datetime object
                return str(value)  # Fallback to string conversion
            
            interview_info = {
                "_id": interview_id,
                "position": interview.get("position"),
                "interviewType": interview.get("interviewType"),
                "schedulingType": interview.get("schedulingType"),
                "duration": interview.get("duration"),
                "status": interview.get("status"),
                "completed": interview.get("completed", False),
                "createdAt": safe_isoformat(interview.get("createdAt")),
                "deadline": safe_isoformat(interview.get("deadline")),
                "scheduledDate": safe_isoformat(interview.get("scheduledDate")),
                "notes": interview.get("notes"),
                "hasResults": result is not None,
                "score": result.get("score") if result else None,
                "published": result.get("published", False) if result else False,
                "screenRecordingUrl": interview.get("screenRecordingUrl"),
                "cameraRecordingUrl": interview.get("cameraRecordingUrl")
            }
            interviews_data.append(interview_info)
        
        candidate_details = {
            "_id": str(candidate["_id"]),
            "name": candidate.get("name"),
            "email": candidate.get("email"),
            "phone": candidate.get("phone", ""),
            "username": candidate.get("username"),
            "plainPassword": candidate.get("plainPassword"),
            "createdAt": candidate.get("createdAt").isoformat() if candidate.get("createdAt") else None,
            "totalInterviews": len(interviews_data),
            "interviews": interviews_data
        }
        
        return jsonify(candidate_details), 200
    except Exception as e:
        print(f"Error fetching candidate details: {e}")
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/add-candidate", methods=["POST"])
@jwt_required()
def add_candidate():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    
    required_fields = ["name", "email"]
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    
    candidate_name = data["name"]
    candidate_email = data["email"]
    
    existing_credential = candidate_credentials_collection.find_one({"email": candidate_email, "organizationId": user_id})
    if existing_credential:
        return jsonify({"error": "Candidate with this email already exists"}), 409
    
    username = generate_username(candidate_name, candidate_email)
    password = generate_password()
    
    candidate_phone = data.get("phone", "")
    
    credential_doc = {
        "name": candidate_name,
        "email": candidate_email,
        "phone": candidate_phone,
        "username": username,
        "password": generate_password_hash(password),
        "plainPassword": password,
        "organizationId": user_id,
        "createdAt": datetime.now()
    }
    
    result = candidate_credentials_collection.insert_one(credential_doc)
    
    return jsonify({
        "message": "Candidate added successfully",
        "candidate": {
            "_id": str(result.inserted_id),
            "name": candidate_name,
            "email": candidate_email,
            "phone": candidate_phone
        }
    }), 201

@organization_bp.route("/edit-candidate/<credential_id>", methods=["PUT"])
@jwt_required()
def edit_candidate(credential_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        candidate = candidate_credentials_collection.find_one({"_id": ObjectId(credential_id)})
        
        if not candidate or candidate.get("organizationId") != user_id:
            return jsonify({"error": "Candidate not found"}), 404
        
        data = request.json
        
        if not data.get("name") or not data.get("email"):
            return jsonify({"error": "Name and email are required"}), 400
        
        if data["email"] != candidate["email"]:
            # Check if email exists for this organization only
            existing = candidate_credentials_collection.find_one({
                "email": data["email"],
                "organizationId": user_id,
                "_id": {"$ne": ObjectId(credential_id)}
            })
            if existing:
                return jsonify({"error": "Email already exists for this organization"}), 409
        
        update_data = {
            "name": data["name"],
            "email": data["email"],
            "phone": data.get("phone", "")
        }
        
        candidate_credentials_collection.update_one(
            {"_id": ObjectId(credential_id)},
            {"$set": update_data}
        )
        
        scheduled_interviews_collection.update_many(
            {"credentialId": credential_id},
            {"$set": {
                "candidateName": data["name"],
                "candidateEmail": data["email"]
            }}
        )
        
        return jsonify({"message": "Candidate updated successfully"}), 200
    except Exception as e:
        print(f"Error updating candidate: {e}")
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/delete-candidate/<credential_id>", methods=["DELETE"])
@jwt_required()
def delete_candidate(credential_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        candidate = candidate_credentials_collection.find_one({"_id": ObjectId(credential_id)})
        
        if not candidate or candidate.get("organizationId") != user_id:
            return jsonify({"error": "Candidate not found"}), 404
        
        candidate_credentials_collection.delete_one({"_id": ObjectId(credential_id)})
        
        scheduled_interviews_collection.delete_many({"credentialId": credential_id})
        
        interview_results_collection.delete_many({"credentialId": credential_id})
        
        return jsonify({"message": "Candidate deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting candidate: {e}")
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/interview-results/<interview_id>", methods=["GET"])
@jwt_required()
def get_interview_results(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        # Find the interview result by scheduled interview ID
        result = interview_results_collection.find_one({"scheduledInterviewId": interview_id})
        
        if not result:
            return jsonify({"error": "Interview results not found"}), 404
        
        # Get candidate details
        scheduled_interview = scheduled_interviews_collection.find_one({"_id": ObjectId(interview_id)})
        
        result_data = {
            "_id": str(result["_id"]),
            "candidateName": scheduled_interview.get("candidateName") if scheduled_interview else "Unknown",
            "candidateEmail": scheduled_interview.get("candidateEmail") if scheduled_interview else "Unknown",
            "position": scheduled_interview.get("position") if scheduled_interview else "Unknown",
            "score": result.get("score", 0),
            "strengths": result.get("strengths", []),
            "improvements": result.get("improvements", []),
            "improvement_guide": result.get("improvement_guide", "Average"),
            "interview_verdict": result.get("interview_verdict", "Average"),
            "qa_pairs": result.get("qa_pairs", []),
            "completed_at": result.get("completed_at").isoformat() if result.get("completed_at") else None,
            "published": result.get("published", False)
        }
        
        return jsonify(result_data), 200
    except Exception as e:
        print(f"Error fetching interview results: {e}")
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/interview-usage", methods=["GET"])
@jwt_required()
def get_interview_usage():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})

    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403

    interview_used = user.get("interviewUsed", 0)
    interview_limit = user.get("interviewLimit", 0)

    sub_doc = subscriptions_col.find_one({"organizationId": ObjectId(user_id)}, sort=[("createdAt", -1)])
    tier = (sub_doc.get("tier", "basic") if sub_doc else "basic").lower()

    # Fall back to pricing collection if interviewLimit not set on org yet
    if interview_limit == 0:
        pricing_plan = pricing_col.find_one({"name": {"$regex": f"^{tier}$", "$options": "i"}})
        interview_limit = pricing_plan.get("interview_limit", 5) if pricing_plan else 5

    return jsonify({
        "interviewUsed": interview_used,
        "interviewLimit": interview_limit,
        "tier": tier,
        "canSchedule": interview_used < interview_limit
    }), 200

@organization_bp.route("/interview-results/<interview_id>/publish", methods=["POST"])
@jwt_required()
def publish_interview_results(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        # Update the published status
        result = interview_results_collection.update_one(
            {"scheduledInterviewId": interview_id},
            {"$set": {"published": True, "publishedAt": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            return jsonify({"message": "Results published successfully"}), 200
        else:
            return jsonify({"error": "Interview result not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/parse-cv-from-history", methods=["POST"])
@jwt_required()
def parse_cv_from_history():
    """Parse CV using existing file from resume screening history"""
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        data = request.json
        resume_id = data.get('resumeId')
        job_title = data.get('jobTitle', '')
        job_description = data.get('jobDescription', '')
        
        if not resume_id:
            return jsonify({"error": "resumeId is required"}), 400
        
        # Fetch resume from screening_resumes_collection
        from config import screening_resumes_collection
        resume = screening_resumes_collection.find_one({
            "_id": ObjectId(resume_id),
            "userId": user_id
        })
        
        if not resume:
            return jsonify({"error": "Resume not found"}), 404
        
        # Get file path
        file_path = resume.get("path")
        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": "Resume file not found on server"}), 404
        
        try:
            # Extract text from CV
            from services.resume_parser import parse_resume
            cv_text = parse_resume(file_path)
            
            if not cv_text or len(cv_text.strip()) < 50:
                return jsonify({"error": "Could not extract text from CV. Please ensure the file is readable."}), 400
            
            # Use Gemini API to parse CV
            import google.generativeai as genai
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            prompt = f"""You are an expert HR assistant. Analyze the following CV and extract candidate information in a structured format.

Job Context:
- Position: {job_title}
- Job Description: {job_description}

CV Content:
{cv_text[:4000]}

Extract the following information and respond with ONLY a valid JSON object (no markdown, no code blocks):
{{
    "candidateName": "<full name of candidate>",
    "candidateEmail": "<email address>",
    "educationalQualification": "<highest degree and field, e.g., Bachelor's in Computer Science>",
    "pastWorkExperienceYears": "<total years of past work experience as a number, e.g., 3>",
    "pastWorkExperienceField": "<field/domain of past work, e.g., Software Development>",
    "currentWorkExperienceYears": "<years in current role as a number, e.g., 2>",
    "currentWorkExperienceField": "<field/domain of current work, e.g., Full Stack Development>",
    "coreSkillSet": "<comma-separated list of key technical skills>",
    "typeOfCompany": "<type of companies worked at, e.g., Product-based, Service-based, Startup>",
    "natureOfPosition": "<suggested level: Junior, Mid-Level, Senior, Lead, Manager based on experience>"
}}

Guidelines:
- Extract exact information from the CV
- If information is not found, use empty string ""
- For experience years, provide only numbers
- Be precise and professional
- Match the candidate's profile to the job context"""

            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean response text
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            # Parse JSON response
            import json
            parsed_data = json.loads(response_text)
            
            # Validate required fields
            if "candidateName" not in parsed_data or "candidateEmail" not in parsed_data:
                return jsonify({"error": "Could not extract essential candidate information"}), 400
            
            return jsonify(parsed_data), 200
            
        except Exception as e:
            print(f"Error parsing CV: {e}")
            return jsonify({"error": "Failed to parse CV. Please try again."}), 500
    
    except Exception as e:
        print(f"Error in parse_cv_from_history: {e}")
        return jsonify({"error": str(e)}), 500


@organization_bp.route("/parse-cv", methods=["POST"])
@jwt_required()
def parse_cv():
    """Parse CV using Gemini API to extract candidate information"""
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        # Check if file is present
        if 'cv' not in request.files:
            return jsonify({"error": "No CV file uploaded"}), 400
        
        cv_file = request.files['cv']
        if cv_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Get job details
        job_title = request.form.get('jobTitle', '')
        job_description = request.form.get('jobDescription', '')
        
        # Save file temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(cv_file.filename)[1]) as temp_file:
            cv_file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Extract text from CV
            from services.resume_parser import parse_resume
            cv_text = parse_resume(temp_path)
            
            if not cv_text or len(cv_text.strip()) < 50:
                return jsonify({"error": "Could not extract text from CV. Please ensure the file is readable."}), 400
            
            # Use Gemini API to parse CV
            import google.generativeai as genai
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            prompt = f"""You are an expert HR assistant. Analyze the following CV and extract candidate information in a structured format.

Job Context:
- Position: {job_title}
- Job Description: {job_description}

CV Content:
{cv_text[:4000]}

Extract the following information and respond with ONLY a valid JSON object (no markdown, no code blocks):
{{
    "candidateName": "<full name of candidate>",
    "candidateEmail": "<email address>",
    "educationalQualification": "<highest degree and field, e.g., Bachelor's in Computer Science>",
    "pastWorkExperienceYears": "<total years of past work experience as a number, e.g., 3>",
    "pastWorkExperienceField": "<field/domain of past work, e.g., Software Development>",
    "currentWorkExperienceYears": "<years in current role as a number, e.g., 2>",
    "currentWorkExperienceField": "<field/domain of current work, e.g., Full Stack Development>",
    "coreSkillSet": "<comma-separated list of key technical skills>",
    "typeOfCompany": "<type of companies worked at, e.g., Product-based, Service-based, Startup>",
    "natureOfPosition": "<suggested level: Junior, Mid-Level, Senior, Lead, Manager based on experience>"
}}

Guidelines:
- Extract exact information from the CV
- If information is not found, use empty string ""
- For experience years, provide only numbers
- Be precise and professional
- Match the candidate's profile to the job context"""

            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean response text
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            # Parse JSON response
            import json
            parsed_data = json.loads(response_text)
            
            # Validate required fields
            if "candidateName" not in parsed_data or "candidateEmail" not in parsed_data:
                return jsonify({"error": "Could not extract essential candidate information"}), 400
            
            return jsonify(parsed_data), 200
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        print(f"Error parsing CV: {e}")
        return jsonify({"error": "Failed to parse CV. Please try again."}), 500

@organization_bp.route("/job-history/<job_id>", methods=["GET"])
@jwt_required()
def get_job_history(job_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        org = organizations_collection.find_one({"_id": ObjectId(user_id)})
        if not org:
            return jsonify({"error": "Organization not found"}), 404
        
        job_master = org.get("job_master", [])
        target_job = None
        for job in job_master:
            if str(job.get("_id")) == job_id:
                target_job = job
                break
        
        if not target_job:
            return jsonify({"error": "Job not found"}), 404
        
        job_title = target_job.get("jobTitle", "")

        matched_screening_jobs = list(screening_jobs_collection.find({
            "userId": user_id,
            "jobTitle": job_title
        }))

        matching_resumes = []
        unique_candidates = set()
        total_score = 0
        score_count = 0

        for sj in matched_screening_jobs:
            sj_id = str(sj["_id"])
            resumes = list(screening_resumes_collection.find({
                "jobId": sj_id,
                "userId": user_id
            }))
            for resume in resumes:
                analysis = resume.get("analysis", {})
                candidate_name = analysis.get("candidateName") or resume.get("originalName", "Unknown")
                raw_score = analysis.get("score", 0) or 0
                scoring_scale = int(sj.get("scoringScale", 10))
                match_score_pct = round((raw_score / scoring_scale) * 100) if scoring_scale else 0
                resume_status = analysis.get("status") or resume.get("status", "Unknown")
                matching_resumes.append({
                    "resumeId": str(resume["_id"]),
                    "storedName": resume.get("storedName", ""),
                    "candidateName": candidate_name,
                    "fileName": resume.get("originalName", "Unknown"),
                    "matchScore": match_score_pct,
                    "analyzedAt": resume.get("analyzedAt"),
                    "status": resume_status,
                    "verdict": analysis.get("verdict", ""),
                    "skillsMatchPercent": analysis.get("skillsMatchPercent", 0),
                    "roleFit": analysis.get("roleFit", ""),
                })
                if candidate_name and candidate_name != "Unknown":
                    unique_candidates.add(candidate_name)
                if resume.get("status") == "analyzed":
                    total_score += match_score_pct
                    score_count += 1

        # Interviews for this job title
        def _safe_iso(v):
            if v is None: return None
            if isinstance(v, str): return v
            if hasattr(v, "isoformat"): return v.isoformat()
            return str(v)

        raw_interviews = list(scheduled_interviews_collection.find({
            "organizationId": user_id,
            "position": job_title
        }).sort("createdAt", -1))

        interviews_list = []
        for iv in raw_interviews:
            interviews_list.append({
                "_id": str(iv["_id"]),
                "candidateName": iv.get("candidateName", ""),
                "candidateEmail": iv.get("candidateEmail", ""),
                "interviewType": iv.get("interviewType", ""),
                "schedulingType": iv.get("schedulingType", ""),
                "duration": iv.get("duration", ""),
                "status": iv.get("status", "scheduled"),
                "completed": iv.get("completed", False),
                "natureOfPosition": iv.get("natureOfPosition", ""),
                "educationalQualification": iv.get("educationalQualification", ""),
                "coreSkillSet": iv.get("coreSkillSet", ""),
                "createdAt": _safe_iso(iv.get("createdAt")),
                "scheduledDate": _safe_iso(iv.get("scheduledDate")),
                "deadline": _safe_iso(iv.get("deadline")),
                "completedAt": _safe_iso(iv.get("completedAt")),
                "daysTimer": iv.get("daysTimer"),
            })

        matching_resumes.sort(key=lambda r: r.get("analyzedAt") or "", reverse=True)
        average_score = f"{(total_score / score_count):.1f}%" if score_count > 0 else "N/A"

        return jsonify({
            "jobId": job_id,
            "jobTitle": job_title,
            "totalCVsAnalyzed": len(matching_resumes),
            "uniqueCandidates": len(unique_candidates),
            "interviewsScheduled": len(interviews_list),
            "averageScore": average_score,
            "recentAnalyses": matching_resumes,
            "interviews": interviews_list,
        }), 200
        
    except Exception as e:
        print(f"Error fetching job history: {e}")
        return jsonify({"error": "Failed to fetch job history"}), 500


# ===========================
# GET /organization/job-history-all
# Aggregate history across ALL job_master entries (header History button)
# ===========================
@organization_bp.route("/job-history-all", methods=["GET"])
@jwt_required()
def get_job_history_all():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403

    try:
        org = organizations_collection.find_one({"_id": ObjectId(user_id)})
        if not org:
            return jsonify({"error": "Organization not found"}), 404

        job_master = org.get("job_master", [])
        jobs_summary = []
        total_cvs_all = 0
        total_interviews_all = 0

        def _safe_iso(v):
            if v is None: return None
            if isinstance(v, str): return v
            if hasattr(v, "isoformat"): return v.isoformat()
            return str(v)

        for job in job_master:
            job_id = str(job.get("_id", ""))
            job_title = job.get("jobTitle", "")

            matched_sjs = list(screening_jobs_collection.find({
                "userId": user_id,
                "jobTitle": job_title
            }))

            cv_list = []
            unique_candidates = set()
            total_score = 0
            score_count = 0

            for sj in matched_sjs:
                sj_id = str(sj["_id"])
                resumes = list(screening_resumes_collection.find({
                    "jobId": sj_id,
                    "userId": user_id
                }))
                for resume in resumes:
                    analysis = resume.get("analysis", {})
                    candidate_name = analysis.get("candidateName") or resume.get("originalName", "Unknown")
                    raw_score = analysis.get("score", 0) or 0
                    scoring_scale = int(sj.get("scoringScale", 10))
                    match_score_pct = round((raw_score / scoring_scale) * 100) if scoring_scale else 0
                    resume_status = analysis.get("status") or resume.get("status", "Unknown")
                    cv_list.append({
                        "resumeId": str(resume["_id"]),
                        "storedName": resume.get("storedName", ""),
                        "candidateName": candidate_name,
                        "fileName": resume.get("originalName", "Unknown"),
                        "matchScore": match_score_pct,
                        "analyzedAt": resume.get("analyzedAt"),
                        "status": resume_status,
                        "verdict": analysis.get("verdict", ""),
                        "roleFit": analysis.get("roleFit", ""),
                    })
                    if candidate_name and candidate_name != "Unknown":
                        unique_candidates.add(candidate_name)
                    if resume.get("status") == "analyzed":
                        total_score += match_score_pct
                        score_count += 1

            cv_list.sort(key=lambda r: r.get("analyzedAt") or "", reverse=True)
            average_score = f"{(total_score / score_count):.1f}%" if score_count > 0 else "N/A"

            raw_interviews = list(scheduled_interviews_collection.find({
                "organizationId": user_id,
                "position": job_title
            }).sort("createdAt", -1))

            interviews_list = []
            for iv in raw_interviews:
                interviews_list.append({
                    "_id": str(iv["_id"]),
                    "candidateName": iv.get("candidateName", ""),
                    "candidateEmail": iv.get("candidateEmail", ""),
                    "interviewType": iv.get("interviewType", ""),
                    "schedulingType": iv.get("schedulingType", ""),
                    "duration": iv.get("duration", ""),
                    "status": iv.get("status", "scheduled"),
                    "completed": iv.get("completed", False),
                    "natureOfPosition": iv.get("natureOfPosition", ""),
                    "createdAt": _safe_iso(iv.get("createdAt")),
                    "scheduledDate": _safe_iso(iv.get("scheduledDate")),
                    "deadline": _safe_iso(iv.get("deadline")),
                    "completedAt": _safe_iso(iv.get("completedAt")),
                    "daysTimer": iv.get("daysTimer"),
                })

            total_cvs_all += len(cv_list)
            total_interviews_all += len(interviews_list)

            jobs_summary.append({
                "jobId": job_id,
                "jobTitle": job_title,
                "jobLocation": job.get("jobLocation", ""),
                "minEducation": job.get("minEducation", ""),
                "minExperience": job.get("minExperience", ""),
                "createdAt": job.get("createdAt", ""),
                "totalCVsAnalyzed": len(cv_list),
                "uniqueCandidates": len(unique_candidates),
                "interviewsScheduled": len(interviews_list),
                "averageScore": average_score,
                "recentAnalyses": cv_list,
                "interviews": interviews_list,
            })

        return jsonify({
            "totalJobs": len(job_master),
            "totalCVsAnalyzed": total_cvs_all,
            "totalInterviewsScheduled": total_interviews_all,
            "jobs": jobs_summary,
        }), 200

    except Exception as e:
        print(f"Error fetching all job history: {e}")
        return jsonify({"error": "Failed to fetch job history"}), 500


# ===========================
# GET /organization/resume-view/<resume_id>
# Serve the uploaded CV file inline for preview
# ===========================
@organization_bp.route("/resume-view/<resume_id>", methods=["GET"])
@jwt_required()
def view_resume(resume_id):
    """Return the raw CV file (PDF/DOC/DOCX) for inline browser preview."""
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403

    try:
        resume = screening_resumes_collection.find_one({
            "_id": ObjectId(resume_id),
            "userId": user_id
        })
        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        file_path = resume.get("path", "")
        if not file_path or not os.path.isfile(file_path):
            return jsonify({"error": "File not found on server"}), 404

        original_name = resume.get("originalName", "resume")
        ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "pdf"

        mime_map = {
            "pdf":  "application/pdf",
            "doc":  "application/msword",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        mimetype = mime_map.get(ext, "application/octet-stream")

        return send_file(
            file_path,
            mimetype=mimetype,
            as_attachment=False,         # inline preview
            download_name=original_name
        )

    except Exception as e:
        print(f"Error serving resume: {e}")
        return jsonify({"error": "Failed to serve resume"}), 500
