from flask_jwt_extended import get_jwt_identity
from bson.objectid import ObjectId

def get_current_user(db):
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.users.find_one({"_id": ObjectId(user_id)})
