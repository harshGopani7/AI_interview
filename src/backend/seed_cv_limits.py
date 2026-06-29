"""
One-time seed script to add cv_limit field to existing pricing plans.
Run: python seed_cv_limits.py
"""
from config import db

pricing_col = db["pricing"]

CV_LIMITS = {
    "basic": 0,       # Basic plan: CV upload not available
    "gold": 60,
    "platinum": 200,
}

for plan_name, limit in CV_LIMITS.items():
    result = pricing_col.update_one(
        {"name": {"$regex": f"^{plan_name}$", "$options": "i"}},
        {"$set": {"cv_limit": limit}},
    )
    if result.matched_count:
        print(f"[OK] {plan_name} → cv_limit = {limit}")
    else:
        print(f"[SKIP] Plan '{plan_name}' not found in DB")

print("\nDone. cv_limit field added to pricing plans.")
