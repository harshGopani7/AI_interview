import werkzeug
from datetime import datetime
from config import pricing_col

def create_user(db, data):
    hashed = werkzeug.security.generate_password_hash(data["password"])
    
    role = data.get("role", "candidate")
    
    if role == "organization":
        # Fetch Basic plan limits from pricing collection so new orgs start with correct limits
        basic_plan = pricing_col.find_one({"name": {"$regex": "^basic$", "$options": "i"}})
        cv_limit = basic_plan.get("cv_limit", 0) if basic_plan else 0
        interview_limit = basic_plan.get("interview_limit", 0) if basic_plan else 0

        user = {
            "organizationName": data.get("organizationName"),
            "contactPersonName": data.get("contactPersonName"),
            "email": data["email"].lower(),
            "password": hashed,
            "phone": data.get("phone"),
            "industry": data.get("industry"),
            "companySize": data.get("companySize"),
            "website": data.get("website", ""),
            "role": "organization",
            "serviceType": data.get("serviceType", ""),
            "payment_status": "unpaid",
            "cvUsed": 0,
            "cvLimit": cv_limit,
            "interviewUsed": 0,
            "interviewLimit": interview_limit,
            "created_at": datetime.now()
        }
    else:
        user = {
            "name": data.get("name"),
            "email": data["email"].lower(),
            "password": hashed,
            "phone": data.get("phone", ""),
            "role": "candidate",
            "created_at": datetime.now()
        }

    return db.insert_one(user)

def find_user_by_email(db, email):
    return db.find_one({"email": email.lower()})

def find_user_by_email_and_role(db, email, role):
    return db.find_one({"email": email.lower(), "role": role})

def verify_password(password, hashed):
    return werkzeug.security.check_password_hash(hashed, password)
