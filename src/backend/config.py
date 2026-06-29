import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# Environment Variables
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Razorpay config (isolated — does not affect Stripe)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
DB_NAME = os.getenv("DB_NAME", "ai_interview")

# Google Drive config
GDRIVE_FOLDER_ID = os.getenv("GDRIVE_FOLDER_ID", "1nFxJ-q7nHfP8caOCce0WUovs3ORzBpk5")
GDRIVE_CREDENTIALS_PATH = os.getenv("GDRIVE_CREDENTIALS_PATH", "credentials/gdrive-service-account.json")

# MongoDB connection
client = MongoClient(MONGO_URI)
print("MongoDB URI: ", MONGO_URI)

db = client[DB_NAME]
# print(db)

organizations_collection = db["organizations"]
interviews_collection = db["interviews"]
candidate_interview = db["candidate_interview"]
candidate_credentials_collection = db["candidate_credentials"]
scheduled_interviews_collection = db["scheduled_interviews"]
interview_results_collection = db["interview_results"]
prompts_collection = db["prompts"]
interview_sessions_collection = db["interview_sessions"]

# Resume Screening collections
screening_jobs_collection = db["screening_jobs"]
screening_resumes_collection = db["screening_resumes"]
subscriptions_col = db["subscriptions"]
pricing_col = db["pricing"]
invoices_col = db["invoices"]

# Create TTL index to auto-delete expired sessions
try:
    interview_sessions_collection.create_index("expires_at", expireAfterSeconds=0)
    print("TTL index created for interview_sessions collection")
except Exception as e:
    print(f"TTL index already exists or error: {e}")

# If any critical variable is not loaded, print an error message and exit
if not DB_NAME or not MONGO_URI or not JWT_SECRET_KEY or not GEMINI_API_KEY or not STRIPE_SECRET_KEY or not STRIPE_WEBHOOK_SECRET or not FRONTEND_URL:
    print("Error: Critical environment variables not loaded.")
    exit(1)
else:
    print("All critical environment variables loaded successfully.")

