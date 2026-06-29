# AI-Powered Interview Simulation Platform - Backend Documentation

## Project Overview

**Technology Stack:** Flask 3.x + MongoDB + Google Gemini AI + Stripe/Razorpay  
**Purpose:** RESTful API backend for AI-powered interview platform with CV screening, subscription management, and payment processing.

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Core Technologies

- **Flask 3.x** - Web framework
- **MongoDB + PyMongo** - NoSQL database
- **Google Gemini 2.5 Flash** - AI engine
- **Flask-JWT-Extended** - Authentication
- **Stripe + Razorpay** - Payment gateways
- **PyPDF2 + python-docx** - Document processing
- **Google Drive API** - File storage
- **Gunicorn** - Production server

### 1.2 Project Structure

```
src/backend/
├── app.py                 # Flask app initialization
├── config.py              # Database & environment config
├── routes/                # API blueprints (12 modules)
├── services/              # Business logic (13 services)
├── payments/              # Razorpay integration (4 modules)
├── models/                # Data models
├── uploads/resumes/       # File storage
└── credentials/           # Service accounts
```

---

## 2. DATABASE SCHEMA (MongoDB)

### 2.1 Collections

**13 Collections:**
1. **organizations** - User accounts (candidates & orgs)
2. **candidate_credentials** - Interview login credentials
3. **scheduled_interviews** - Interview records
4. **interview_results** - Performance data
5. **screening_jobs** - Resume screening jobs
6. **screening_resumes** - Uploaded CVs with analysis
7. **subscriptions** - Subscription records
8. **pricing** - Plan definitions
9. **invoices** - Payment records
10. **prompts** - AI prompt templates
11. **interview_sessions** - Active sessions (TTL indexed)
12. **candidate_interview** - Practice interviews
13. **interviews** - Legacy collection

### 2.2 Key Document Schemas

**Organizations:**
```javascript
{
  email, password (hashed), role: "candidate"|"organization",
  // Org fields: organizationName, contactPersonName, industry, companySize
  // Usage: cvUsed, cvLimit, interviewUsed, interviewLimit
}
```

**Scheduled Interviews:**
```javascript
{
  organizationId, candidateName, candidateEmail, credentialId,
  position, interviewType, duration, schedulingType,
  scheduledDate, deadline, daysTimer, status, completed,
  // Candidate details: education, experience, skills
}
```

**Screening Resumes:**
```javascript
{
  jobId, userId, originalName, storedName, path, status,
  analysis: {
    candidateName, email, score, verdict, matchedSkills,
    missingSkills, experienceMatch, summary
  }
}
```

**Subscriptions:**
```javascript
{
  organizationId, tier, status, provider: "stripe"|"razorpay",
  stripeCustomerId, razorpaySubscriptionId,
  currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd
}
```

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Routes (`/auth`)

**POST `/auth/signup`**
- User registration (candidate/organization)
- Password hashing (PBKDF2-SHA256)
- Auto-assign Basic plan limits

**POST `/auth/login`**
- JWT token generation (24h expiry)
- Role-based authentication

**POST `/auth/candidate-login`**
- Credential-based login for interview access

**GET `/auth/me`**
- Get current user profile

### 3.2 Security

- JWT tokens with nonce
- Role-based access control
- Organization-scoped data access
- Secure password generation (10 chars)

---

## 4. ORGANIZATION API

### 4.1 Interview Scheduling (`/organization`)

**POST `/organization/schedule-interview`**
- **Subscription limit check** (interviews used vs limit)
- **Credential management:**
  - Reuse existing or generate new (username: name+4digits, password: 10 random chars)
- **Scheduling types:**
  - Specific: date + time
  - Timer: deadline = now + N days
- **Email notification** with credentials
- **Usage increment**

**PUT `/organization/interviews/:id`** - Update interview  
**DELETE `/organization/interviews/:id`** - Delete interview  
**GET `/organization/interviews`** - List all interviews

### 4.2 CV Parsing

**POST `/organization/parse-cv`**
- Upload CV (PDF/DOC/DOCX)
- Extract text with PyPDF2/python-docx
- **Gemini AI parsing** with job context
- Return structured JSON (name, email, education, experience, skills)

**POST `/organization/parse-cv-from-history`**
- Reuse CV from screening history
- Auto-parse without re-upload

### 4.3 Results Management

**GET `/organization/interview-results/:id`** - Get detailed results  
**PUT `/organization/publish-results/:id`** - Make results visible to candidate  
**GET `/organization/candidates`** - List all candidates

---

## 5. CANDIDATE API (`/candidate`)

**GET `/candidate/scheduled-interviews`** - Upcoming interviews  
**GET `/candidate/all-interviews`** - All interviews  
**GET `/candidate/interview-history`** - Completed only  
**GET `/candidate/dashboard-stats`** - Statistics  
**GET `/candidate/interview-results`** - Published results

---

## 6. AI INTERVIEW ENGINE

### 6.1 Core Service (`services/ai_engine.py`)

**Session Management:**
- In-memory storage: `SESSIONS = {}`
- Gemini 2.5 Flash model
- System prompt with interview rules

**create_session(config):**
```python
- Generate UUID session ID
- Initialize Gemini chat with system prompt
- Send greeting request
- Track tokens in database
- Return {sessionId, firstQuestion}
```

**send_answer(session_id, answer):**
```python
- Send answer to Gemini
- Get next question
- Store Q&A pair
- Check completion
- Return {nextQuestion, isComplete}
```

**end_interview(session_id):**
```python
- Evaluate all Q&A pairs
- Generate score, grade, feedback
- Store in interview_results
- Update interview status
- Clean up session
```

### 6.2 Interview API (`/interview`)

**POST `/interview/start-interview`** - Initialize session  
**POST `/interview/next-question`** - Submit answer, get next  
**POST `/interview/end-interview`** - Complete & evaluate  
**POST `/interview/upload-recording`** - Upload to Google Drive

---

## 7. RESUME SCREENING SYSTEM

### 7.1 Multi-Service Pipeline

**4-Step Process:**
1. **Resume Parser** - Extract text (PyPDF2/python-docx)
2. **Resume Normalizer** - Structure with Gemini AI
3. **Resume Evaluator** - Score against job criteria
4. **Resume Ranker** - Generate ranked report

### 7.2 API Endpoints (`/api`)

**POST `/api/job/create`**
- Create screening job
- Config: scoringScale (10/100), reportType (SUMMARY/DETAILED)

**POST `/api/resumes/upload`**
- Bulk upload (multiple files)
- Save to `uploads/resumes/`
- Generate UUID filenames

**POST `/api/resumes/analyze`**
- **Orchestrated pipeline** (`resume_orchestrator.py`):
  - For each resume:
    1. Parse text
    2. Normalize with Gemini (extract structured data)
    3. Evaluate with Gemini (score, verdict, matched/missing skills)
    4. Update database
  - Rate limiting: 1 sec between API calls
  - Error isolation per resume
  - Token tracking

**GET `/api/report/:jobId`**
- Ranked candidate list
- Buckets: Shortlist/Borderline/Reject
- Detailed analysis per candidate

**GET `/api/history/jobs`** - Past screening jobs  
**GET `/api/resume/:resumeId/data`** - Get parsed data for scheduling  
**GET `/api/cv-usage`** - Usage statistics

---

## 8. JOB MASTER API (`/api`)

**GET `/api/job-master`** - List positions  
**POST `/api/job-master`** - Create position  
**PUT `/api/job-master/:id`** - Update position  
**DELETE `/api/job-master/:id`** - Delete position  
**GET `/api/job-master/check-first-time`** - First job check

---

## 9. SUBSCRIPTION & PAYMENTS

### 9.1 Stripe (`/subscription`)

**GET `/subscription/plans`** - Available plans  
**POST `/subscription/create-checkout-session`** - Create Stripe session  
**POST `/subscription/webhook`** - Handle events:
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Update status
- `invoice.payment_succeeded` - Record payment

### 9.2 Razorpay (`/razorpay`)

**GET `/razorpay/key`** - Public key  
**POST `/razorpay/create-subscription`**:
- Create/get customer
- Create plan (if needed)
- Create subscription
- Return payment link

**POST `/razorpay/verify-payment`** - HMAC-SHA256 verification  
**POST `/razorpay/webhook`** - Handle events  
**POST `/razorpay/cancel-subscription`** - Cancel sub

**Services:**
- `razorpay_service.py` - API client wrapper
- `razorpay_utils.py` - Proration calculator, tier hierarchy
- `razorpay_webhooks.py` - Signature verification

---

## 10. SUPPORTING SERVICES

### 10.1 Email Service (`services/email_config.py`)

- SMTP configuration (Gmail)
- Templates: credentials, subscription confirmation
- HTML email generation

### 10.2 Google Drive (`services/gdrive_uploader.py`)

- Service account authentication
- Upload interview recordings
- Generate shareable links
- Public access permission

### 10.3 Prompt Management (`services/prompt_service.py`)

- Centralized AI prompt storage
- Dynamic variable substitution
- Version control

---

## 11. ADMIN API (`/admin`)

**POST `/admin/login`** - Admin auth  
**GET `/admin/dashboard-stats`** - Platform metrics  
**GET `/admin/organizations`** - All orgs  
**GET `/admin/subscriptions`** - All subs  
**PUT `/admin/pricing/:id`** - Update pricing

---

## 12. SECURITY MEASURES

**Authentication:**
- JWT with 24h expiry
- Password hashing (PBKDF2-SHA256)
- Nonce for session tracking

**Authorization:**
- Role-based access control
- Organization-scoped queries
- Credential ownership verification

**Payment Security:**
- Webhook signature verification (Stripe & Razorpay)
- HTTPS-only communication
- Secure key storage

**File Upload:**
- Extension validation (PDF, DOC, DOCX)
- UUID filename generation
- Isolated storage directory

**API Security:**
- CORS whitelist
- Input validation
- Error handling

---

## 13. PERFORMANCE OPTIMIZATIONS

**Database:**
- Indexes on frequently queried fields
- TTL index for session cleanup
- Query projection

**AI:**
- Token usage tracking
- Rate limiting (1 sec delay)
- Prompt length limits (4000 chars)

**Caching:**
- In-memory session storage
- Pricing plan caching

---

## 14. DEPLOYMENT

### 14.1 Environment Variables

```env
MONGO_URI, DB_NAME, JWT_SECRET_KEY, GEMINI_API_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
SENDER_EMAIL, SENDER_PASSWORD
GDRIVE_FOLDER_ID, GDRIVE_CREDENTIALS_PATH
FRONTEND_URL
```

### 14.2 Gunicorn Config

```python
bind = "0.0.0.0:5003"
workers = 4
timeout = 120
```

### 14.3 Docker

- Dockerfile with Python 3.11
- docker-compose.yml for orchestration
- Volume mounts for uploads

---

## 15. API ENDPOINT SUMMARY

**Total: 50+ endpoints across 10 blueprints**

- `/auth` (4) - Authentication
- `/organization` (10+) - Interview & CV management
- `/candidate` (6) - Candidate operations
- `/interview` (4) - Interview execution
- `/api` (12) - Resume screening & job master
- `/subscription` (3) - Stripe payments
- `/razorpay` (6) - Razorpay payments
- `/admin` (5) - Admin panel
- `/mock-interview` (5) - Practice mode
- `/prompts-api` (3) - Prompt management

---

## 16. KEY WORKFLOWS

**Interview Scheduling:**
1. Org creates/selects job position
2. Uploads CV → AI parses → auto-fills form
3. Configures interview settings
4. System generates credentials
5. Sends email to candidate
6. Increments usage counter

**Resume Screening:**
1. Create screening job with criteria
2. Upload multiple CVs
3. Trigger AI analysis:
   - Parse → Normalize → Evaluate → Rank
4. Generate report with scores & verdicts
5. Schedule interviews from report

**Interview Execution:**
1. Candidate logs in with credentials
2. Hardware setup wizard
3. Start interview → create AI session
4. Q&A loop with Gemini
5. End interview → AI evaluation
6. Store results → upload recording
7. Org reviews → publishes results

**Subscription Flow:**
1. Select plan (Stripe/Razorpay)
2. Create checkout/subscription
3. Payment verification
4. Webhook updates database
5. Update org limits
6. Send confirmation email

---

## 17. ERROR HANDLING

**Standard Response:**
```json
{
  "error": "Error message",
  "details": "Additional info"
}
```

**HTTP Codes:** 200, 201, 400, 401, 403, 404, 409, 500

**Logging:** Console logs for debugging, token tracking

---

## 18. CONCLUSION

This Flask backend provides a comprehensive API for:
- **AI-powered interviews** with Gemini integration
- **Bulk resume screening** with automated ranking
- **Dual payment gateways** (Stripe + Razorpay)
- **Subscription management** with usage tracking
- **Secure authentication** and role-based access
- **Email notifications** and file storage
- **Scalable architecture** with modular design

**Document Version:** 1.0  
**Prepared For:** Internship Project Report
