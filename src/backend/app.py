from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import RequestEntityTooLarge
from datetime import timedelta
from config import JWT_SECRET_KEY
from routes.auth import auth_bp
from routes.interview import interview_bp
from routes.organization import organization_bp
from routes.mock_interview import mock_interview_bp
from routes.candidate_route import candidate_bp
from routes.pricing_routes import pricing_bp
from routes.admin import admin_bp
from routes.prompts_routes import prompts_bp
from routes.resume_screening import resume_screening_bp
from routes.subscription import subscription_bp
from routes.job_master import job_master_bp
from payments.razorpay_routes import razorpay_bp

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 MB max upload size

CORS(
    app,
    resources={r"/*": {"origins": [
        "https://interview.onewebmart.com",
        "https://interview.onewebmart.cloud",
        "http://localhost:5173",
        "http://localhost:5174",
    ]}},
    supports_credentials=True
)

jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized_callback(reason):
    return {"error": "Missing or invalid token"}, 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {"error": "Token expired"}, 401

@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({"error": "File too large. Maximum upload size is 500MB."}), 413

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(interview_bp, url_prefix="/interview")
app.register_blueprint(organization_bp, url_prefix="/organization")
app.register_blueprint(mock_interview_bp, url_prefix="/mock-interview")
app.register_blueprint(candidate_bp, url_prefix="/candidate")
app.register_blueprint(pricing_bp, url_prefix="/pricing-api")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(prompts_bp, url_prefix="/prompts-api")
app.register_blueprint(resume_screening_bp, url_prefix="/api")
app.register_blueprint(subscription_bp, url_prefix="/subscription")
app.register_blueprint(job_master_bp, url_prefix="/api")
app.register_blueprint(razorpay_bp, url_prefix="/razorpay")

if __name__ == "__main__":
    app.run(debug=True, port=5003, threaded=True)
