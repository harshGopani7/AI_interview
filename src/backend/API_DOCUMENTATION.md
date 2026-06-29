# Backend API Documentation

## Overview
This document provides comprehensive documentation for all backend APIs in the Interview Simulation Platform. The backend is built with Flask and uses JWT authentication for most endpoints.

**Base URL**: `http://localhost:5003` (development) / `https://interview.onewebmart.cloud` (production)

**Authentication**: Most endpoints require JWT token in Authorization header: `Bearer <token>`

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Interview APIs](#interview-apis)
3. [Organization APIs](#organization-apis)
4. [Candidate APIs](#candidate-apis)
5. [Mock Interview APIs](#mock-interview-apis)
6. [Resume Screening APIs](#resume-screening-apis)
7. [Job Master APIs](#job-master-apis)
8. [Subscription APIs (Stripe)](#subscription-apis-stripe)
9. [Razorpay Payment APIs](#razorpay-payment-apis)
10. [Admin APIs](#admin-apis)
11. [Pricing APIs](#pricing-apis)
12. [Prompts APIs](#prompts-apis)

---

## Authentication APIs
**Blueprint Prefix**: `/auth`

### 1. GET /auth/me
**Description**: Get current authenticated user's profile  
**Authentication**: Required  
**Used In**: User profile pages, dashboard initialization  
**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "organization|candidate",
  "organizationName": "Company Name",
  "contactPersonName": "John Doe"
}
```

### 2. POST /auth/signup
**Description**: Register a new user (organization or candidate)  
**Authentication**: Not required  
**Used In**: Signup page  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "organization|candidate",
  "organizationName": "Company Name",
  "contactPersonName": "John Doe",
  "phone": "1234567890",
  "industry": "IT",
  "companySize": "50-100"
}
```
**Response**: `201 Created` with success message

### 3. POST /auth/login
**Description**: Login for organization or candidate users  
**Authentication**: Not required  
**Used In**: Login page  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "organization|candidate"
}
```
**Response**:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "organization",
    "isActive": true,
    "subscriptionTier": "gold"
  }
}
```

### 4. POST /auth/unified-login
**Description**: Unified login supporting scheduled candidates, organizations, and regular candidates  
**Authentication**: Not required  
**Used In**: Unified login page  
**Request Body**:
```json
{
  "identifier": "email or username",
  "password": "password123"
}
```
**Response**: Same as login endpoint

### 5. POST /auth/candidate-login
**Description**: Login specifically for scheduled candidates using username  
**Authentication**: Not required  
**Used In**: Candidate interview login page  
**Request Body**:
```json
{
  "username": "candidate_username",
  "password": "password123"
}
```

### 6. GET /auth/candidate/scheduled-interviews
**Description**: Get all scheduled (incomplete) interviews for authenticated candidate  
**Authentication**: Required  
**Used In**: Candidate dashboard, scheduled interviews page  
**Response**:
```json
{
  "scheduledInterviews": [
    {
      "_id": "interview_id",
      "position": "Software Engineer",
      "organizationName": "Tech Corp",
      "interviewType": "technical",
      "deadline": "2026-03-01T10:00:00",
      "completed": false
    }
  ]
}
```

### 7. GET /auth/candidate/all-interview
**Description**: Get all interviews (completed and incomplete) for authenticated candidate  
**Authentication**: Required  
**Used In**: Candidate interview history page  

---

## Interview APIs
**Blueprint Prefix**: `/interview`

### 1. POST /interview/start-interview
**Description**: Initialize a new interview session with AI engine  
**Authentication**: Required  
**Used In**: Interview start page  
**Request Body**:
```json
{
  "position": "Software Engineer",
  "interviewType": "technical",
  "duration": "30",
  "scheduledInterviewId": "interview_id"
}
```
**Response**:
```json
{
  "session_id": "session_uuid",
  "question": "First interview question"
}
```

### 2. POST /interview/next-question
**Description**: Submit answer and get next question during interview  
**Authentication**: Required  
**Used In**: Interview page (during active interview)  
**Request Body**:
```json
{
  "session_id": "session_uuid",
  "answer": "Candidate's answer",
  "timeRemaining": 1200,
  "scheduledInterviewId": "interview_id"
}
```
**Response**:
```json
{
  "question": "Next interview question"
}
```

### 3. POST /interview/end-interview
**Description**: End interview session and get AI-generated feedback  
**Authentication**: Required  
**Used In**: Interview completion page  
**Request Body**:
```json
{
  "session_id": "session_uuid",
  "scheduledInterviewId": "interview_id",
  "credentialId": "credential_id"
}
```
**Response**:
```json
{
  "score": 85,
  "strengths": ["Good communication", "Technical knowledge"],
  "improvements": ["Time management"],
  "interview_verdict": "Strong Hire",
  "improvement_guide": "Focus on system design",
  "qa_pairs": [{"question": "...", "answer": "..."}]
}
```

### 4. POST /interview/upload-recording
**Description**: Upload interview recording (screen or camera) - non-blocking with background upload to Google Drive  
**Authentication**: Required  
**Used In**: Interview completion page  
**Request**: Multipart form data
- `scheduledInterviewId`: Interview ID
- `type`: "screen" or "camera"
- `file`: Video file (webm format)

**Response**: `202 Accepted` - Upload continues in background

---

## Organization APIs
**Blueprint Prefix**: `/organization`

### 1. POST /organization/schedule-interview
**Description**: Schedule a new interview for a candidate  
**Authentication**: Required (Organization only)  
**Used In**: Interview scheduling page  
**Request Body**:
```json
{
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "position": "Software Engineer",
  "schedulingType": "timer|scheduled",
  "interviewType": "technical|hr",
  "duration": "30",
  "daysTimer": "3",
  "natureOfPosition": "Junior",
  "educationalQualification": "B.Tech CS",
  "coreSkillSet": "Python, React",
  "currentWorkExperienceYears": "2",
  "pastWorkExperienceField": "Web Development"
}
```
**Response**:
```json
{
  "message": "Interview scheduled successfully",
  "credentials": {
    "username": "johndoe1234",
    "password": "random_password"
  },
  "interviewId": "interview_id"
}
```

### 2. GET /organization/interviews
**Description**: Get all interviews scheduled by the organization  
**Authentication**: Required (Organization only)  
**Used In**: Organization interviews dashboard  
**Response**:
```json
{
  "interviews": [
    {
      "_id": "interview_id",
      "candidateName": "John Doe",
      "position": "Software Engineer",
      "status": "scheduled|completed",
      "scheduledDate": "2026-03-01T10:00:00"
    }
  ]
}
```

### 3. GET /organization/candidates-list
**Description**: Get all candidates associated with the organization  
**Authentication**: Required (Organization only)  
**Used In**: Candidates management page  

### 4. GET /organization/interview-results/:interviewId
**Description**: Get detailed results for a specific interview  
**Authentication**: Required (Organization only)  
**Used In**: Interview results page  

### 5. PUT /organization/publish-result/:resultId
**Description**: Publish interview results to make them visible to candidate  
**Authentication**: Required (Organization only)  
**Used In**: Interview results management  

### 6. DELETE /organization/delete-interview/:interviewId
**Description**: Delete a scheduled interview  
**Authentication**: Required (Organization only)  
**Used In**: Interview management page  

### 7. PUT /organization/update-candidate/:candidateId
**Description**: Update candidate information  
**Authentication**: Required (Organization only)  
**Used In**: Candidate details modal  

### 8. DELETE /organization/delete-candidate/:candidateId
**Description**: Delete a candidate and all associated data  
**Authentication**: Required (Organization only)  
**Used In**: Candidate management page  

### 9. GET /organization/cv-usage
**Description**: Get CV screening usage statistics  
**Authentication**: Required (Organization only)  
**Used In**: Organization dashboard, usage tracking  

### 10. GET /organization/interview-usage
**Description**: Get interview usage statistics  
**Authentication**: Required (Organization only)  
**Used In**: Organization dashboard, usage tracking  

---

## Candidate APIs
**Blueprint Prefix**: `/candidate`

### 1. GET /candidate/scheduled-interviews
**Description**: Get all incomplete scheduled interviews for the candidate  
**Authentication**: Required  
**Used In**: Candidate dashboard, scheduled interviews page  

### 2. GET /candidate/all-interviews
**Description**: Get all interviews (completed and incomplete) for the candidate  
**Authentication**: Required  
**Used In**: Candidate interview history  

### 3. GET /candidate/interview-history
**Description**: Get only completed interviews for the candidate  
**Authentication**: Required  
**Used In**: Interview history page  

### 4. GET /candidate/dashboard-stats
**Description**: Get dashboard statistics (total, completed, pending interviews, scores)  
**Authentication**: Required  
**Used In**: Candidate dashboard overview  
**Response**:
```json
{
  "stats": {
    "totalInterviews": 10,
    "completedInterviews": 7,
    "pendingInterviews": 3,
    "averageScore": 78.5,
    "bestScore": 92,
    "lastInterview": "2026-02-20T10:00:00"
  }
}
```

### 5. GET /candidate/interview/:interviewId
**Description**: Get details of a specific interview  
**Authentication**: Required  
**Used In**: Interview details page  

### 6. GET /candidate/profile
**Description**: Get candidate profile information  
**Authentication**: Required  
**Used In**: Profile page  

### 7. GET /candidate/full-interview-details/:credentialId
**Description**: Get full interview details from candidate_interview collection  
**Authentication**: Required  
**Used In**: Detailed interview view  

### 8. GET /candidate/interview-results
**Description**: Get all published interview results for the candidate  
**Authentication**: Required  
**Used In**: Results page, performance tracking  
**Response**:
```json
{
  "results": [
    {
      "_id": "result_id",
      "position": "Software Engineer",
      "interviewType": "technical",
      "score": 85,
      "strengths": ["Communication", "Problem solving"],
      "improvements": ["Time management"],
      "qa_pairs": [{"question": "...", "answer": "..."}],
      "completed_at": "2026-02-20T10:00:00"
    }
  ]
}
```

---

## Mock Interview APIs
**Blueprint Prefix**: `/mock-interview`

### 1. POST /mock-interview/create
**Description**: Create a new mock interview configuration  
**Authentication**: Required  
**Used In**: Mock interview setup page  
**Request Body**:
```json
{
  "jobDetails": {
    "title": "Software Engineer",
    "company": "Tech Corp"
  },
  "skillSource": {
    "sourceType": "resume|job_description",
    "jobDescription": "...",
    "resumeFileName": "resume.pdf"
  },
  "skills": {
    "technical": ["Python", "React"],
    "soft": ["Communication"]
  }
}
```

### 2. GET /mock-interview/list
**Description**: Get all mock interviews for the current user  
**Authentication**: Required  
**Used In**: Mock interview dashboard  

### 3. PUT /mock-interview/update/:mockId
**Description**: Update an existing mock interview  
**Authentication**: Required  
**Used In**: Mock interview edit page  

### 4. DELETE /mock-interview/delete/:mockId
**Description**: Delete a mock interview  
**Authentication**: Required  
**Used In**: Mock interview management  

### 5. GET /mock-interview/get/:mockId
**Description**: Get a specific mock interview  
**Authentication**: Required  
**Used In**: Mock interview details page  

---

## Resume Screening APIs
**Blueprint Prefix**: `/api`

### 1. POST /api/job/create
**Description**: Create a new CV screening job with HR parameters  
**Authentication**: Required  
**Used In**: CV screening job creation page  
**Request Body**:
```json
{
  "jobTitle": "Software Engineer",
  "jobDescription": "Full job description...",
  "requiredExperience": "3-5 years",
  "mandatorySkills": ["Python", "React", "AWS"],
  "industry": "Technology",
  "seniorityLevel": "Mid-level",
  "scoringScale": "10|100",
  "reportType": "SUMMARY|DETAILED"
}
```

### 2. POST /api/resumes/upload
**Description**: Upload one or more resumes for a screening job  
**Authentication**: Required  
**Used In**: Resume upload page  
**Request**: Multipart form data
- `jobId`: Job ID
- `resumes`: Multiple resume files (PDF, DOC, DOCX)

**Response**:
```json
{
  "uploaded": [
    {"resumeId": "resume_id", "filename": "resume1.pdf", "status": "uploaded"}
  ],
  "errors": []
}
```

### 3. POST /api/resumes/analyze
**Description**: Trigger AI analysis pipeline for all uploaded resumes  
**Authentication**: Required  
**Used In**: Resume analysis trigger  
**Request Body**:
```json
{
  "jobId": "job_id"
}
```

### 4. POST /api/resumes/generate-report
**Description**: Generate ranked report of analyzed resumes  
**Authentication**: Required  
**Used In**: Report generation page  
**Request Body**:
```json
{
  "jobId": "job_id"
}
```

### 5. GET /api/job/:jobId
**Description**: Get job details and analysis status  
**Authentication**: Required  
**Used In**: Job details page  

### 6. GET /api/job/:jobId/resumes
**Description**: Get all resumes for a specific job  
**Authentication**: Required  
**Used In**: Resume list page  

### 7. GET /api/jobs
**Description**: Get all screening jobs for the organization  
**Authentication**: Required  
**Used In**: CV screening dashboard  

### 8. GET /api/resume/:resumeId/download
**Description**: Download original resume file  
**Authentication**: Required  
**Used In**: Resume viewer  

---

## Job Master APIs
**Blueprint Prefix**: `/api`

### 1. GET /api/job-master
**Description**: Get all job positions for the organization  
**Authentication**: Required  
**Used In**: Job master page, job selection dropdowns  
**Response**:
```json
{
  "jobs": [
    {
      "_id": "job_id",
      "jobTitle": "Software Engineer",
      "jobDescription": "Full description...",
      "minEducation": "Bachelor's",
      "educationField": "Computer Science",
      "minExperience": "2 years",
      "jobLocation": "Remote",
      "createdAt": "2026-01-01T00:00:00"
    }
  ]
}
```

### 2. POST /api/job-master
**Description**: Create a new job position  
**Authentication**: Required  
**Used In**: Job creation form  
**Request Body**:
```json
{
  "jobTitle": "Software Engineer",
  "jobDescription": "Full description...",
  "minEducation": "Bachelor's",
  "educationField": "Computer Science",
  "minExperience": "2 years",
  "otherRequirements": "Additional requirements...",
  "jobLocation": "Remote"
}
```

### 3. PUT /api/job-master/:jobId
**Description**: Update an existing job position  
**Authentication**: Required  
**Used In**: Job edit form  

### 4. DELETE /api/job-master/:jobId
**Description**: Delete a job position  
**Authentication**: Required  
**Used In**: Job management page  

### 5. GET /api/job-master/check-first-time
**Description**: Check if organization has any job positions (for onboarding)  
**Authentication**: Required  
**Used In**: Job master initialization  
**Response**:
```json
{
  "isFirstTime": true
}
```

---

## Subscription APIs (Stripe)
**Blueprint Prefix**: `/subscription`

### 1. GET /subscription/plans
**Description**: Get all available subscription plans  
**Authentication**: Not required  
**Used In**: Pricing page, subscription selection  
**Response**:
```json
{
  "plans": [
    {
      "tier": "basic",
      "name": "Basic",
      "price": 0,
      "description": "Perfect for exploring",
      "features": ["2 AI Interviews", "Basic Score"],
      "isPopular": false,
      "cv_limit": 10
    }
  ]
}
```

### 2. POST /subscription/create-checkout-session
**Description**: Create Stripe checkout session for subscription  
**Authentication**: Not required  
**Used In**: Subscription checkout flow  
**Request Body**:
```json
{
  "email": "user@example.com",
  "tier": "gold"
}
```
**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### 3. POST /subscription/webhook
**Description**: Stripe webhook handler for subscription events  
**Authentication**: Stripe signature verification  
**Used In**: Stripe webhook integration  
**Events Handled**:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 4. GET /subscription/status
**Description**: Get current subscription status for organization  
**Authentication**: Required  
**Used In**: Subscription management page  

### 5. POST /subscription/cancel
**Description**: Cancel active subscription  
**Authentication**: Required  
**Used In**: Subscription cancellation flow  

### 6. POST /subscription/reactivate
**Description**: Reactivate a cancelled subscription  
**Authentication**: Required  
**Used In**: Subscription reactivation  

### 7. POST /subscription/upgrade
**Description**: Upgrade subscription to higher tier  
**Authentication**: Required  
**Used In**: Subscription upgrade flow  

### 8. POST /subscription/downgrade
**Description**: Downgrade subscription to lower tier  
**Authentication**: Required  
**Used In**: Subscription downgrade flow  

### 9. GET /subscription/invoices
**Description**: Get all invoices for the organization  
**Authentication**: Required  
**Used In**: Billing history page  

---

## Razorpay Payment APIs
**Blueprint Prefix**: `/razorpay`

### 1. GET /razorpay/key
**Description**: Get Razorpay public key for frontend  
**Authentication**: Not required  
**Used In**: Razorpay checkout initialization  
**Response**:
```json
{
  "key_id": "rzp_test_..."
}
```

### 2. POST /razorpay/create-subscription
**Description**: Create Razorpay subscription  
**Authentication**: Not required  
**Used In**: Razorpay subscription flow  
**Request Body**:
```json
{
  "email": "user@example.com",
  "tier": "gold"
}
```

### 3. POST /razorpay/verify-payment
**Description**: Verify Razorpay payment signature and activate subscription  
**Authentication**: Not required  
**Used In**: Payment verification after Razorpay checkout  
**Request Body**:
```json
{
  "razorpay_payment_id": "pay_...",
  "razorpay_subscription_id": "sub_...",
  "razorpay_signature": "signature..."
}
```

### 4. GET /razorpay/subscription-status
**Description**: Get Razorpay subscription status  
**Authentication**: Required  
**Used In**: Subscription management page  

### 5. POST /razorpay/cancel-subscription
**Description**: Cancel Razorpay subscription  
**Authentication**: Required  
**Used In**: Subscription cancellation  

### 6. POST /razorpay/upgrade/preview
**Description**: Preview upgrade cost with proration calculation  
**Authentication**: Required  
**Used In**: Upgrade preview page  
**Request Body**:
```json
{
  "newTier": "platinum"
}
```
**Response**:
```json
{
  "currentTier": "gold",
  "newTier": "platinum",
  "proratedCharge": 50.00,
  "currency": "USD",
  "nextBillingDate": "2026-03-01"
}
```

### 7. POST /razorpay/upgrade/create-order
**Description**: Create Razorpay order for upgrade payment  
**Authentication**: Required  
**Used In**: Upgrade checkout  

### 8. POST /razorpay/upgrade/verify-order
**Description**: Verify upgrade payment and create new subscription  
**Authentication**: Required  
**Used In**: Upgrade payment verification  

### 9. POST /razorpay/webhook
**Description**: Razorpay webhook handler  
**Authentication**: Webhook signature verification  
**Used In**: Razorpay webhook integration  

### 10. GET /razorpay/invoices
**Description**: Get all Razorpay invoices  
**Authentication**: Required  
**Used In**: Billing history page  

---

## Admin APIs
**Blueprint Prefix**: `/admin`

### 1. GET /admin/organizations
**Description**: Get all organizations (admin only)  
**Authentication**: Required (Admin role)  
**Used In**: Admin dashboard  

### 2. GET /admin/candidates
**Description**: Get all candidates (admin only)  
**Authentication**: Required (Admin role)  
**Used In**: Admin candidate management  

### 3. GET /admin/interviews
**Description**: Get all interviews across all organizations  
**Authentication**: Required (Admin role)  
**Used In**: Admin interview monitoring  

### 4. GET /admin/subscriptions
**Description**: Get all subscriptions  
**Authentication**: Required (Admin role)  
**Used In**: Admin subscription management  

### 5. PUT /admin/organization/:orgId/limits
**Description**: Update organization usage limits  
**Authentication**: Required (Admin role)  
**Used In**: Admin organization management  

### 6. GET /admin/stats
**Description**: Get platform-wide statistics  
**Authentication**: Required (Admin role)  
**Used In**: Admin analytics dashboard  

### 7. POST /admin/send-notification
**Description**: Send notification to users  
**Authentication**: Required (Admin role)  
**Used In**: Admin notification system  

### 8. GET /admin/logs
**Description**: Get system logs  
**Authentication**: Required (Admin role)  
**Used In**: Admin monitoring  

### 9. POST /admin/reset-usage/:orgId
**Description**: Reset usage counters for organization  
**Authentication**: Required (Admin role)  
**Used In**: Admin usage management  

### 10. DELETE /admin/organization/:orgId
**Description**: Delete organization and all associated data  
**Authentication**: Required (Admin role)  
**Used In**: Admin organization management  

### 11. GET /admin/revenue-stats
**Description**: Get revenue and subscription statistics  
**Authentication**: Required (Admin role)  
**Used In**: Admin financial dashboard  

### 12. POST /admin/create-admin
**Description**: Create new admin user  
**Authentication**: Required (Admin role)  
**Used In**: Admin user management  

### 13. GET /admin/system-health
**Description**: Get system health metrics  
**Authentication**: Required (Admin role)  
**Used In**: Admin monitoring dashboard  

### 14. POST /admin/bulk-email
**Description**: Send bulk emails to users  
**Authentication**: Required (Admin role)  
**Used In**: Admin communication tools  

---

## Pricing APIs
**Blueprint Prefix**: `/pricing-api`

### 1. GET /pricing-api/plans
**Description**: Get all pricing plans from database  
**Authentication**: Not required  
**Used In**: Pricing page, plan selection  

### 2. POST /pricing-api/save-pricing
**Description**: Create or update a pricing plan (admin only)  
**Authentication**: Required (Admin role)  
**Used In**: Admin pricing management  
**Request Body**:
```json
{
  "name": "Gold",
  "price": 49,
  "description": "For growing teams",
  "features": ["Unlimited interviews", "Advanced analytics"],
  "cv_limit": 100,
  "interview_limit": 50,
  "stripe_price_id": "price_...",
  "razorpay_plan_id": "plan_..."
}
```

### 3. DELETE /pricing-api/delete-plan/:planId
**Description**: Delete a pricing plan  
**Authentication**: Required (Admin role)  
**Used In**: Admin pricing management  

### 4. GET /pricing-api/plan/:tier
**Description**: Get specific plan by tier name  
**Authentication**: Not required  
**Used In**: Plan details page  

---

## Prompts APIs
**Blueprint Prefix**: `/prompts-api`

### 1. GET /prompts-api/prompts
**Description**: Get all AI prompts from database  
**Authentication**: Required (Admin role)  
**Used In**: Admin prompt management  

### 2. POST /prompts-api/save-prompt
**Description**: Create or update an AI prompt  
**Authentication**: Required (Admin role)  
**Used In**: Admin prompt editor  
**Request Body**:
```json
{
  "name": "technical_interview",
  "prompt": "You are an AI interviewer...",
  "category": "interview",
  "isActive": true
}
```

### 3. DELETE /prompts-api/delete-prompt/:promptId
**Description**: Delete a prompt  
**Authentication**: Required (Admin role)  
**Used In**: Admin prompt management  

### 4. GET /prompts-api/prompt/:name
**Description**: Get specific prompt by name  
**Authentication**: Required  
**Used In**: AI engine initialization  

---

## Common Response Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted, processing in background
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error

---

## Authentication Flow

1. User signs up via `/auth/signup`
2. User logs in via `/auth/login` or `/auth/unified-login`
3. Backend returns JWT token
4. Frontend stores token in localStorage
5. All subsequent requests include token in Authorization header: `Bearer <token>`
6. Token expires after 24 hours

---

## File Upload Endpoints

### Resume Upload
- **Endpoint**: `/api/resumes/upload`
- **Format**: Multipart form data
- **Allowed**: PDF, DOC, DOCX
- **Max Size**: Configured in Nginx (500MB)

### Recording Upload
- **Endpoint**: `/interview/upload-recording`
- **Format**: Multipart form data
- **Allowed**: WEBM
- **Processing**: Non-blocking background upload to Google Drive

---

## Webhook Endpoints

### Stripe Webhook
- **Endpoint**: `/subscription/webhook`
- **Verification**: Stripe signature header
- **Events**: Subscription lifecycle events

### Razorpay Webhook
- **Endpoint**: `/razorpay/webhook`
- **Verification**: HMAC SHA256 signature
- **Events**: Payment and subscription events

---

## Rate Limiting & Usage Tracking

- CV screening usage tracked per organization
- Interview usage tracked per organization
- Limits enforced based on subscription tier
- Usage counters updated in real-time
- Limits reset on subscription renewal

---

## Database Collections

1. **organizations_collection**: User accounts (organizations and candidates)
2. **candidate_credentials_collection**: Scheduled candidate login credentials
3. **scheduled_interviews_collection**: Interview schedules and metadata
4. **interview_results_collection**: AI-generated interview results
5. **subscriptions_col**: Subscription records (Stripe and Razorpay)
6. **pricing_col**: Pricing plans configuration
7. **invoices_col**: Payment invoices
8. **screening_jobs_collection**: CV screening jobs
9. **screening_resumes_collection**: Uploaded resumes for screening
10. **candidate_interview**: Mock interview configurations

---

## Environment Variables Required

```env
JWT_SECRET_KEY=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/interview_db
GOOGLE_DRIVE_FOLDER_ID=...
```

---

## Notes

- All datetime fields are in ISO 8601 format
- ObjectIds are converted to strings in API responses
- Background tasks use daemon threads
- Google Drive uploads are non-blocking
- AI engine calls may take 30-120 seconds
- Webhook signatures must be verified
- CORS enabled for localhost:5173 and production domain

---

**Last Updated**: February 2026  
**Version**: 1.0  
**Maintained By**: Backend Development Team
