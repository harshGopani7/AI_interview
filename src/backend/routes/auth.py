from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from config import organizations_collection, candidate_credentials_collection, scheduled_interviews_collection, subscriptions_col
from models.user_model import (
    create_user,
    find_user_by_email,
    find_user_by_email_and_role,
    verify_password,
)
from bson import ObjectId
from werkzeug.security import check_password_hash
import uuid

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    print(user_id)
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }
    
    if user["role"] == "organization":
        user_data["organizationName"] = user.get("organizationName")
        user_data["contactPersonName"] = user.get("contactPersonName")
        user_data["phone"] = user.get("phone")
        user_data["industry"] = user.get("industry")
        user_data["companySize"] = user.get("companySize")
        user_data["website"] = user.get("website")
    else:
        user_data["name"] = user.get("name")
        user_data["email"] = user.get("email")
        user_data["phone"] = user.get("phone")
    
    return jsonify(user_data)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "candidate")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if role == "organization":
        required_fields = ["organizationName", "contactPersonName", "phone", "industry", "companySize"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    else:
        if not data.get("name"):
            return jsonify({"error": "Name is required"}), 400

    existing_user = find_user_by_email_and_role(organizations_collection, email, role)
    if existing_user:
        return jsonify({"error": f"Email already registered as {role}"}), 409

    create_user(organizations_collection, data)

    return jsonify({"message": "User created successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "candidate")
    print(data)

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = find_user_by_email_and_role(organizations_collection, email, role)

    if not user or not verify_password(password, user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    user_id = str(user["_id"])
    nonce = str(uuid.uuid4())
    print(f"\n[LOGIN] User logging in: {user.get('email')} (ID: {user_id})")
    
    token = create_access_token(
        identity=user_id,
        additional_claims={"nonce": nonce}
    )
    print(f"[LOGIN] Generated token (first 50 chars): {token[:50]}...")
    print(f"[LOGIN] Token contains user_id: {user_id}\n")

    user_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }
    
    if user["role"] == "organization":
        user_data["organizationName"] = user.get("organizationName")
        user_data["contactPersonName"] = user.get("contactPersonName")
        
        # Read subscription data from subscriptions collection
        import time as _time
        sub = subscriptions_col.find_one(
            {"organizationId": user["_id"]},
            sort=[("createdAt", -1)],
        )
        is_active = False
        if sub:
            is_active = sub.get("status") == "active"
            if not is_active:
                access_until = sub.get("accessUntil")
                if access_until:
                    is_active = _time.time() < access_until
        
        user_data["isActive"] = is_active
        user_data["subscriptionTier"] = sub.get("tier") if sub else None
        user_data["willCancelAtPeriodEnd"] = sub.get("cancelAtPeriodEnd", False) if sub else False
        user_data["accessUntil"] = sub.get("accessUntil") if sub else None
    else:
        user_data["name"] = user.get("name")

    return jsonify({
        "token": token,
        "user": user_data
    })

@auth_bp.route("/unified-login", methods=["POST"])
def unified_login():
    data = request.json
    identifier = (data.get("identifier") or "").strip()
    password = (data.get("password") or "").strip()

    if not identifier or not password:
        return jsonify({"error": "Credentials are required"}), 400

    # ── 1. Try scheduled-candidate login (username match) ──
    credential = candidate_credentials_collection.find_one({"username": identifier})
    if credential and check_password_hash(credential["password"], password):
        token = create_access_token(
            identity=str(credential["_id"]),
            additional_claims={"nonce": str(uuid.uuid4())}
        )
        return jsonify({
            "token": token,
            "user": {
                "id": str(credential["_id"]),
                "name": credential.get("name"),
                "email": credential.get("email"),
                "username": credential.get("username"),
                "role": "scheduled_candidate",
            }
        }), 200

    # ── 2. Try organization login (email match) ──
    org_user = find_user_by_email_and_role(organizations_collection, identifier, "organization")
    if org_user and verify_password(password, org_user["password"]):
        user_id = str(org_user["_id"])
        token = create_access_token(
            identity=user_id,
            additional_claims={"nonce": str(uuid.uuid4())}
        )

        import time as _time
        sub = subscriptions_col.find_one(
            {"organizationId": org_user["_id"]},
            sort=[("createdAt", -1)],
        )
        is_active = False
        if sub:
            is_active = sub.get("status") == "active"
            if not is_active:
                access_until = sub.get("accessUntil")
                if access_until:
                    is_active = _time.time() < access_until

        return jsonify({
            "token": token,
            "user": {
                "id": user_id,
                "email": org_user["email"],
                "role": "organization",
                "organizationName": org_user.get("organizationName"),
                "contactPersonName": org_user.get("contactPersonName"),
                "isActive": is_active,
                "subscriptionTier": sub.get("tier") if sub else None,
                "willCancelAtPeriodEnd": sub.get("cancelAtPeriodEnd", False) if sub else False,
                "accessUntil": sub.get("accessUntil") if sub else None,
                "payment_status": org_user.get("payment_status", "unpaid"),
                "serviceType": org_user.get("serviceType", ""),
            }
        }), 200

    # ── 3. Try candidate/student login (email match) ──
    candidate_user = find_user_by_email_and_role(organizations_collection, identifier, "candidate")
    if candidate_user and verify_password(password, candidate_user["password"]):
        user_id = str(candidate_user["_id"])
        token = create_access_token(
            identity=user_id,
            additional_claims={"nonce": str(uuid.uuid4())}
        )
        return jsonify({
            "token": token,
            "user": {
                "id": user_id,
                "email": candidate_user["email"],
                "name": candidate_user.get("name"),
                "role": "candidate",
            }
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401


@auth_bp.route("/candidate-login", methods=["POST"])
def candidate_login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    credential = candidate_credentials_collection.find_one({"username": username})
    
    if not credential or not check_password_hash(credential["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = create_access_token(
        identity=str(credential["_id"]),
        additional_claims={"nonce": str(uuid.uuid4())}
    )
    
    return jsonify({
        "token": token,
        "candidate": {
            "id": str(credential["_id"]),
            "name": credential.get("name"),
            "email": credential.get("email"),
            "username": credential.get("username")
        }
    }), 200

@auth_bp.route("/candidate/scheduled-interviews", methods=["GET"])
@jwt_required()
def get_candidate_scheduled_interviews():
    credential_id = get_jwt_identity()
    print(credential_id)
    
    scheduled_interviews = list(scheduled_interviews_collection.find({
        "credentialId": credential_id.strip(),
        "completed": False
    }))
    
    for interview in scheduled_interviews:
        interview["_id"] = str(interview["_id"])
        if "createdAt" in interview:
            interview["createdAt"] = interview["createdAt"].isoformat()
        if "deadline" in interview:
            interview["deadline"] = interview["deadline"].isoformat()
    
    return jsonify({"scheduledInterviews": scheduled_interviews}), 200

# BElow are All Interviews taken by Candidate
@auth_bp.route("/candidate/all-interview", methods=["GET"])
@jwt_required()
def get_candidate_all_interviews():
    credential_id = get_jwt_identity()
    print(credential_id)
    
    scheduled_interviews = list(scheduled_interviews_collection.find({
        "credentialId": credential_id.strip(),
    }))
    
    for interview in scheduled_interviews:
        interview["_id"] = str(interview["_id"])
        if "createdAt" in interview:
            interview["createdAt"] = interview["createdAt"].isoformat()
        if "deadline" in interview:
            interview["deadline"] = interview["deadline"].isoformat()
    
    return jsonify({"scheduledInterviews": scheduled_interviews}), 200
