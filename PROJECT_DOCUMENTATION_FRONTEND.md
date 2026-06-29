# AI-Powered Interview Simulation Platform - Frontend Documentation

## Project Overview

**Project Name:** AI-Powered Interview Simulation Platform  
**Technology Stack:** React 19.2.0 + Vite 7.2.4  
**Purpose:** A comprehensive web-based platform that enables organizations to conduct AI-powered interviews and allows candidates to practice interview skills through intelligent simulation.

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Technology Stack

**Frontend Framework:**
- **React 19.2.0** - Modern UI library with hooks and functional components
- **Vite 7.2.4** - Fast build tool and development server
- **React Router DOM 7.12.0** - Client-side routing and navigation

**UI Libraries & Tools:**
- **React Icons 5.5.0** - Comprehensive icon library (HeroIcons v2)
- **Bootstrap 5.3.8** - CSS framework for responsive design
- **React Markdown 10.1.0** - Markdown rendering for content display

**HTTP Client:**
- **Axios 1.13.2** - Promise-based HTTP client for API communication

**Build & Deployment:**
- **ESLint** - Code quality and consistency
- **gh-pages** - GitHub Pages deployment

### 1.2 Project Structure

```
src/
├── components/           # All React components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Candidate dashboard
│   ├── organization-dashboard/  # Organization dashboard
│   ├── home/            # Landing page components
│   ├── interview/       # Interview execution components
│   ├── pricing/         # Pricing and subscription
│   └── [shared components]
├── pages/               # Page-level components
├── services/            # API service layer
├── ui/                  # Reusable UI components
├── layout/              # Layout wrappers
└── admin/               # Admin panel components
```

---

## 2. USER ROLES & ACCESS CONTROL

### 2.1 User Types

The platform supports **three distinct user roles**, each with dedicated interfaces:

1. **Candidates** - Job seekers practicing or taking scheduled interviews
2. **Organizations** - Companies conducting interviews and managing candidates
3. **Administrators** - Platform managers handling pricing and system configuration

### 2.2 Authentication System

**Components:**
- `ProtectedRoute.jsx` - Route guard component ensuring authenticated access
- `AuthCard.jsx` - Reusable authentication form container with modern UI

**Authentication Flow:**
- JWT token-based authentication
- Token stored in localStorage via `services/token.js`
- Automatic redirection for unauthorized access
- Role-based route protection

---

## 3. CANDIDATE INTERFACE

### 3.1 Dashboard Layout (`components/dashboard/`)

**DashboardLayout.jsx** - Main layout wrapper with:
- Responsive sidebar navigation
- Top navigation bar with user profile
- Content area for page rendering

**Sidebar.jsx** - Navigation menu featuring:
- Overview/Dashboard
- Scheduled Interviews
- Interview History
- Performance Reports
- Practice Mode
- Profile Settings
- Audio Testing

**Topbar.jsx** - Header component with:
- User profile dropdown
- Notifications
- Quick actions
- Logout functionality

### 3.2 Dashboard Pages

#### 3.2.1 Overview Page (`Overview.jsx`)
**Purpose:** Central dashboard displaying candidate's interview statistics

**Key Features:**
- **Statistics Cards:**
  - Total interviews scheduled
  - Completed interviews count
  - Average performance score
  - Best score achieved
  - Days since last interview
  - Upcoming interview countdown

- **Last Scheduled Interview Card:**
  - Interview details display
  - Position and organization info
  - Scheduled date/time
  - Quick action button to start interview

- **Data Fetching:**
  - Fetches scheduled interviews from `/candidate/scheduled-interviews`
  - Retrieves all interviews from `/candidate/all-interviews`
  - Calculates performance metrics from `/candidate/interview-results`

**State Management:**
- Loading states for async operations
- Interview data caching in localStorage
- Real-time statistics calculation

#### 3.2.2 Scheduled Interviews (`ScheduledInterviews.jsx`)
**Purpose:** Display all upcoming and pending interviews

**Features:**
- Interview cards with detailed information:
  - Position and company name
  - Interview type (Technical/HR/Managerial/Cultural-fit)
  - Scheduled date and time
  - Interview duration
  - Status badges (Pending/Scheduled/Completed)

- **Actions:**
  - Start interview button
  - View credentials
  - Interview details modal

- **Filtering & Search:**
  - Filter by status
  - Search by position/company
  - Sort by date

#### 3.2.3 Interview History (`Interviews.jsx`)
**Purpose:** View completed and past interviews

**Features:**
- Comprehensive interview list with:
  - Interview completion date
  - Position details
  - Performance indicators
  - Status tracking

- **Interview Details:**
  - Questions asked
  - Answers provided
  - AI feedback received
  - Overall score

#### 3.2.4 Reports Page (`Reports.jsx`)
**Purpose:** Detailed performance analytics and insights

**Features:**
- **Performance Metrics:**
  - Score trends over time
  - Improvement tracking
  - Strengths and weaknesses analysis

- **Visual Analytics:**
  - Score distribution charts
  - Performance comparison graphs
  - Skill-wise breakdown

- **AI-Generated Insights:**
  - Personalized recommendations
  - Areas for improvement
  - Success patterns

#### 3.2.5 Practice Mode (`Practice.jsx`)
**Purpose:** Self-paced interview practice with AI

**Multi-Step Wizard:**

**Step 1: Skill Source Selection**
- Choose between:
  - Manual skill entry
  - Resume/CV upload for automatic skill extraction

**Step 2: Skill Selection** (`SkillSelectionStep.jsx`)
- Display extracted or manually entered skills
- Multi-select skill chips
- Skill categorization (Technical/Soft skills)
- Add custom skills option

**Step 3: Job Details** (`JobDetailsStep.jsx`)
- Position title input
- Company name (optional)
- Job description
- Experience level selection
- Interview type preference

**Step 4: Review & Start** (`ReviewMockStep.jsx`)
- Summary of selected configuration
- Estimated duration
- Interview type confirmation
- Start practice interview button

**State Management:**
- Multi-step form state
- Skill extraction from CV
- Mock interview configuration
- Progress tracking

#### 3.2.6 Profile Management (`Profile.jsx`)
**Purpose:** Candidate profile and settings management

**Features:**
- **Personal Information:**
  - Name and email
  - Contact details
  - Professional summary

- **Credentials Management:**
  - View interview credentials
  - Password change
  - Account security

- **Preferences:**
  - Notification settings
  - Interview reminders
  - Email preferences

#### 3.2.7 Audio Testing (`AudioMonitor.jsx`)
**Purpose:** Pre-interview audio/video setup and testing

**Features:**
- **Device Testing:**
  - Microphone level monitoring
  - Speaker/audio output test
  - Camera preview
  - Device selection

- **Audio Visualization:**
  - Real-time audio level meter
  - Voice clarity indicator
  - Background noise detection

- **Troubleshooting:**
  - Permission request handling
  - Device error messages
  - Setup instructions

### 3.3 Interview Execution Components

#### 3.3.1 Interview Setup (`InterviewSetup.jsx`)
**Purpose:** Multi-step hardware setup wizard before interview

**4-Step Setup Process:**

**Step 1: Camera Permission**
- Request camera access
- Permission status display
- Troubleshooting guide

**Step 2: Camera Selection**
- List available cameras
- Live camera preview
- Camera quality test
- Device switching

**Step 3: Speaker Test**
- Audio output test
- Volume level check
- Speaker selection
- Test sound playback

**Step 4: Final Test**
- Combined audio/video preview
- Microphone test recording
- Final confirmation
- Start interview button

**Technical Implementation:**
- WebRTC API for media devices
- `navigator.mediaDevices` for device enumeration
- Real-time stream handling
- Device permission management

#### 3.3.2 Speech-to-Text Input (`SpeechToTextInput.jsx`)
**Purpose:** Voice input component for interview responses

**Features:**
- **Voice Recording:**
  - Start/stop recording controls
  - Real-time audio visualization
  - Recording duration timer
  - Audio level monitoring

- **Speech Recognition:**
  - Browser Speech Recognition API
  - Real-time transcription display
  - Text editing capability
  - Auto-save functionality

- **Visual Feedback:**
  - Waveform visualization (`VoiceVisualizer.jsx`)
  - Recording status indicators
  - Microphone activity animation

**State Management:**
- Recording state (idle/recording/processing)
- Transcribed text buffer
- Audio stream handling
- Error state management

#### 3.3.3 Voice Visualizer (`VoiceVisualizer.jsx`)
**Purpose:** Real-time audio waveform visualization

**Features:**
- Canvas-based waveform rendering
- Audio frequency analysis
- Visual feedback during recording
- Responsive design

#### 3.3.4 Recording Upload Overlay (`RecordingUploadOverlay.jsx`)
**Purpose:** Post-interview recording upload interface

**Features:**
- Upload progress indicator
- File size display
- Upload status messages
- Error handling
- Retry mechanism

---

## 4. ORGANIZATION INTERFACE

### 4.1 Organization Dashboard Layout

**OrgDashboardLayout.jsx** - Main layout for organization users

**OrgSidebar.jsx** - Organization navigation menu:
- Dashboard Overview
- Smart Scheduler (AI-powered)
- Schedule Interview (Manual)
- Job Master (Position management)
- CV Analyzer (Resume screening)
- CV History
- Interviews Management
- Candidates Database
- Subscription Management
- Billing & Invoices
- Settings

**OrgTopbar.jsx** - Organization header:
- Company name display
- Subscription tier badge
- Usage statistics
- Profile dropdown
- Quick actions

### 4.2 Organization Dashboard Pages

#### 4.2.1 Organization Overview (`OrgOverview.jsx`)
**Purpose:** Central dashboard for organization metrics

**Key Metrics:**
- Total interviews scheduled
- Active candidates count
- Completed interviews
- Pending interviews
- Subscription usage (interviews/CVs)

**Quick Actions:**
- Schedule new interview
- Analyze resumes
- View candidates
- Manage subscription

**Recent Activity:**
- Latest interviews
- Recent candidate additions
- System notifications

#### 4.2.2 Smart Scheduler (`OrgScheduler.jsx`)
**Purpose:** AI-powered interview scheduling with CV parsing

**4-Step Scheduling Process:**

**Step 1: Select Position**
- Display job positions from Job Master
- Job details preview
- Position selection
- Create new position option

**Step 2: Upload CV**
- Drag-and-drop CV upload
- File format validation (PDF, DOC, DOCX)
- AI-powered CV parsing using Gemini API
- Automatic candidate information extraction:
  - Name and email
  - Educational qualifications
  - Work experience (past and current)
  - Core skills
  - Company type
  - Seniority level

**CV Parsing Features:**
- Text extraction from PDF/DOC files
- AI analysis with job context
- Structured data extraction
- Auto-fill form fields

**Step 3: Review Details**
- Candidate information review
- Editable form fields:
  - Candidate name and email
  - Position details
  - Educational qualification
  - Past work experience (years and field)
  - Current work experience (years and field)
  - Core skill set
  - Type of company
  - Nature of position (seniority)

**Step 4: Schedule Interview**
- **Scheduling Options:**
  - **Specific Date/Time:** Set exact interview date and time
  - **Timer-based:** Set deadline in days (e.g., "Complete within 3 days")

- **Interview Configuration:**
  - Interview type selection (Technical/HR/Managerial/Cultural-fit)
  - Duration setting (15/30/45/60 minutes)
  - Additional instructions

- **Credential Generation:**
  - Automatic candidate credential creation
  - Email notification to candidate
  - Interview link generation
  - Credential display modal

**Special Features:**

**Edit Mode:**
- Pre-fill form with existing interview data
- Update interview details
- Modify scheduling
- PUT request to backend for updates

**CV History Integration:**
- Automatic CV retrieval from screening history
- Skip manual upload step
- Use existing parsed data
- Seamless workflow from CV analyzer

**State Management:**
- Multi-step form state
- CV file handling
- Parsing status
- Interview usage tracking
- Subscription limit checks

**API Endpoints Used:**
- `POST /organization/parse-cv` - Parse uploaded CV
- `POST /organization/parse-cv-from-history` - Parse existing CV file
- `POST /organization/schedule-interview` - Create interview
- `PUT /organization/interviews/:id` - Update interview
- `GET /organization/job-master` - Fetch job positions

#### 4.2.3 Schedule Interview (Manual) (`ScheduleInterview.jsx`)
**Purpose:** Traditional manual interview scheduling

**Features:**
- Manual candidate information entry
- No CV upload required
- Direct form filling
- Quick scheduling option

**Form Fields:**
- Candidate details
- Position selection
- Interview configuration
- Scheduling preferences

#### 4.2.4 Job Master (`OrgJobMaster.jsx`)
**Purpose:** Centralized job position management

**Features:**

**Job Position CRUD:**
- Create new job positions
- Edit existing positions
- Delete positions
- View position details

**Job Information:**
- Job title
- Job description
- Minimum education requirement
- Minimum experience required
- Job location
- Employment type
- Salary range (optional)
- Required skills
- Job responsibilities

**First-Time User Experience:**
- `FirstTimeJobModal.jsx` - Onboarding modal for new users
- Step-by-step guidance
- Sample job template
- Quick setup wizard

**Job History:**
- `JobHistoryModal.jsx` - View job posting history
- Track position usage
- Interview statistics per position
- Candidate applications

**Integration:**
- Used by Smart Scheduler for position selection
- Linked to CV Analyzer for job-resume matching
- Connected to interview scheduling

#### 4.2.5 CV Analyzer (`OrgCvAnalyzer.jsx`)
**Purpose:** AI-powered bulk resume screening and ranking

**Multi-Step Workflow:**

**Step 1: Job Setup**
- Select job position from Job Master
- OR create new job position
- Job description display
- Required skills configuration

**Step 2: Upload Resumes**
- Bulk CV upload (multiple files)
- Drag-and-drop interface
- File format validation
- Upload progress tracking
- Resume list display

**Step 3: Configure Screening**
- **Scoring Scale Selection:**
  - Out of 10
  - Out of 100

- **Report Type:**
  - **Summary Report:** Quick overview with scores and verdicts
  - **Detailed Report:** Comprehensive analysis with insights

- **Analysis Parameters:**
  - Experience matching weight
  - Skills matching criteria
  - Education requirements
  - Custom evaluation criteria

**Step 4: AI Analysis**
- Trigger AI screening process
- Real-time progress tracking
- Per-resume status updates
- Error handling for failed analyses

**AI Analysis Pipeline:**
1. **Resume Parsing:** Extract text from PDF/DOC files
2. **Normalization:** Structure candidate data using Gemini AI
3. **Evaluation:** Score and rank candidates against job requirements
4. **Report Generation:** Create comprehensive screening report

**Analysis Output:**
- Candidate ranking (1st, 2nd, 3rd, etc.)
- Overall score (based on selected scale)
- Verdict (Shortlist/Borderline/Reject)
- Experience match assessment
- Skills match percentage
- Role fit evaluation
- Matched skills list
- Missing skills list
- AI-generated summary

**Subscription Integration:**
- CV usage tracking
- Limit enforcement based on plan
- `CvLimitModal.jsx` - Upgrade prompt when limit reached
- `CvUpgradeGate.jsx` - Feature gate for basic plan users

**State Management:**
- Multi-step wizard state
- File upload handling
- Analysis progress tracking
- Report data caching

#### 4.2.6 CV History (`OrgCvHistory.jsx`)
**Purpose:** View past resume screening reports

**Features:**

**History List View:**
- Date-grouped screening jobs
- Job title and metadata
- Number of resumes analyzed
- Report type indicator
- Completion status
- Timestamp display

**Report View (Read-Only):**
- **Summary Report Table:**
  - Sortable columns (Rank, Name, Score, Verdict)
  - Status badges
  - Quick actions
  - Schedule interview button per candidate

- **Detailed Report Cards:**
  - Expandable candidate cards
  - Rank badges (1st, 2nd, 3rd highlighting)
  - Detailed metrics display
  - Skills breakdown
  - Experience analysis
  - AI summary
  - Schedule interview action

**Integration with Smart Scheduler:**
- Direct scheduling from CV history
- Automatic CV data passing
- Resume file reuse from server
- Seamless workflow transition

**Navigation:**
- Back to job setup
- View report
- Schedule interviews
- Export options

#### 4.2.7 Interviews Management (`OrgInterviews.jsx`)
**Purpose:** Manage all scheduled interviews

**Features:**

**Interview List:**
- Comprehensive interview cards
- Candidate information
- Position details
- Interview type and duration
- Status indicators (Scheduled/Completed/Cancelled/Pending)

**Interview Metadata Display:**
- **Date/Time Information:**
  - Scheduled date and time (if specific)
  - Deadline countdown (e.g., "Due in 2 days")
  - Timer-based scheduling display
  - Expired status

- **Sorting:**
  - Latest interviews first (by creation date)
  - Status-based filtering
  - Search by candidate/position

**Actions:**
- **Edit Interview:** Navigate to Smart Scheduler with pre-filled data
- **View Credentials:** Display candidate login credentials
- **Delete Interview:** Remove scheduled interview
- **View Results:** Navigate to interview results (if completed)

**Credential Display:**
- Candidate email
- Generated password
- Interview link
- Copy to clipboard functionality

**Status Badges:**
- Color-coded status indicators
- Visual status differentiation
- Status-based action availability

#### 4.2.8 Candidates Database (`OrgCandidates.jsx`)
**Purpose:** Centralized candidate management

**Features:**

**Candidate List:**
- All candidates who have taken interviews
- Candidate profile information
- Interview history per candidate
- Performance tracking

**Candidate Details Modal** (`CandidateDetailsModal.jsx`):
- **Personal Information:**
  - Name and email
  - Contact details
  - Educational background
  - Work experience

- **Interview History:**
  - All interviews taken
  - Performance scores
  - Interview dates
  - Positions applied for

- **Performance Analytics:**
  - Average score
  - Best performance
  - Improvement trends
  - Skill assessments

**Search & Filter:**
- Search by name/email
- Filter by performance
- Filter by interview status
- Sort by various criteria

**Actions:**
- View detailed profile
- Schedule new interview
- Export candidate data
- Send communications

#### 4.2.9 Interview Results (`InterviewResults.jsx`)
**Purpose:** Detailed interview performance review

**Features:**

**Results Overview:**
- Overall score and grade
- Interview completion date
- Duration taken
- Position and candidate info

**Question-by-Question Analysis:**
- Questions asked
- Candidate responses
- AI evaluation per answer
- Individual question scores
- Feedback and suggestions

**Performance Metrics:**
- Technical accuracy
- Communication skills
- Problem-solving ability
- Domain knowledge
- Overall impression

**AI-Generated Feedback:**
- Strengths identified
- Areas for improvement
- Detailed recommendations
- Comparative analysis

**Actions:**
- Publish results to candidate
- Download report
- Share with team
- Schedule follow-up

**Result Publishing:**
- Toggle result visibility
- Candidate notification
- Result access control

#### 4.2.10 Subscription Management (`ManageSubscription.jsx`)
**Purpose:** View and manage organization subscription

**Features:**

**Current Plan Display:**
- Plan name and tier (Basic/Gold/Platinum)
- Subscription status (Active/Cancelled/Expired)
- Billing cycle
- Next billing date
- Auto-renewal status

**Usage Statistics:**
- Interviews used / limit
- CVs analyzed / limit
- Usage percentage
- Remaining quota

**Plan Features:**
- Feature list for current plan
- Comparison with other tiers
- Upgrade benefits

**Actions:**
- Upgrade subscription
- Cancel subscription
- View billing history
- Update payment method

**Navigation:**
- Upgrade Subscription page
- Billing & Invoices page
- Payment provider selection

#### 4.2.11 Upgrade Subscription
**Purpose:** Subscription tier upgrade flow

**Two Payment Providers:**

**Stripe Integration** (`UpgradeSubscription.jsx`):
- Plan selection cards
- Feature comparison
- Pricing display
- Stripe Checkout integration
- Secure payment processing

**Razorpay Integration** (`RazorpayUpgradeSubscription.jsx`):
- India-specific payment gateway
- Plan selection
- Razorpay Checkout component
- Subscription creation
- Payment verification

**Upgrade Modal** (`UpgradeModal.jsx`):
- Quick upgrade prompt
- Plan comparison
- Benefits highlight
- CTA buttons

**Features:**
- Proration calculation
- Immediate upgrade
- Plan change confirmation
- Email notifications

#### 4.2.12 Billing & Invoices

**Stripe Billing** (`SubscriptionBilling.jsx`):
- Invoice history
- Payment receipts
- Billing details
- Download invoices
- Payment method management

**Razorpay Billing** (`RazorpaySubscriptionBilling.jsx`):
- Razorpay-specific billing
- Invoice downloads
- Payment history
- Subscription details

**Features:**
- Invoice list with dates and amounts
- Payment status tracking
- PDF invoice generation
- Billing address management

#### 4.2.13 Settings (`OrgSettings.jsx`)
**Purpose:** Organization account settings

**Features:**

**Organization Profile:**
- Company name
- Contact information
- Industry type
- Company size

**Account Settings:**
- Email preferences
- Notification settings
- Security options
- Password change

**Integration Settings:**
- API keys (if applicable)
- Webhook configurations
- Third-party integrations

---

## 5. SHARED COMPONENTS

### 5.1 Reusable UI Components (ui/ directory)

**Card.jsx** - Reusable card container:
- Consistent styling
- Hover effects
- Shadow variations
- Responsive design

**Button.jsx** - Standardized button component:
- Multiple variants (primary, secondary, danger, success)
- Size options (sm, md, lg)
- Loading states
- Icon support
- Disabled states

**Input.jsx** - Form input component:
- Text, email, password, number types
- Validation states
- Error message display
- Label integration
- Icon support

**StatCard.jsx** - Dashboard statistics card:
- Icon display
- Metric value
- Label text
- Trend indicators
- Color theming

**ScoreBadge.jsx** - Score display badge:
- Color-coded by score range
- Percentage or numeric display
- Size variations

**InterviewTable.jsx** - Reusable interview list table:
- Sortable columns
- Pagination
- Row actions
- Status indicators

### 5.2 Utility Components

**ProtectedRoute.jsx** - Route authentication guard:
- JWT token validation
- Role-based access control
- Automatic redirection
- Loading states

**ChatBubble.jsx** - Interview chat message bubble:
- User/AI message differentiation
- Timestamp display
- Message formatting
- Markdown support

**TypingIndicator.jsx** - AI typing animation:
- Animated dots
- Loading state indicator
- Smooth transitions

**VoiceInput.jsx** - Voice recording component:
- Microphone access
- Recording controls
- Audio visualization
- File upload

**RazorpayCheckout.jsx** - Razorpay payment integration:
- Payment modal
- Order creation
- Payment verification
- Success/failure handling

### 5.3 Authentication Components

**AuthCard.jsx** - Authentication form container:
- Modern card design
- Form wrapper
- Branding elements
- Responsive layout

**Login/Signup Pages:**
- Form validation
- Error handling
- Success messages
- Redirect logic

**CandidateLogin.jsx** - Dedicated candidate login:
- Credential-based authentication
- Interview access
- Token management

---

## 6. LANDING PAGE & MARKETING

### 6.1 Home Page Components (`components/home/`)

**Hero.jsx** - Landing page hero section:
- Eye-catching headline
- Value proposition
- CTA buttons
- Background animations
- Responsive design

**Features.jsx** - Platform features showcase:
- Feature cards with icons
- Benefit descriptions
- Visual demonstrations
- Grid layout

**FAQ.jsx** - Frequently asked questions:
- Accordion-style Q&A
- Searchable questions
- Category filtering
- Expandable answers

**CTA.jsx** - Call-to-action section:
- Sign-up prompts
- Trial offers
- Contact information
- Conversion optimization

**Pricing Display:**
- Plan comparison table
- Feature lists
- Pricing cards
- Subscribe buttons

### 6.2 Additional Pages

**Features Page** - Detailed feature explanations
**Contact Us** - Contact form and information
**Pricing Page** - Subscription plans and pricing

---

## 7. PAYMENT & SUBSCRIPTION INTEGRATION

### 7.1 Dual Payment Gateway Support

**Stripe Integration:**
- International payments
- Subscription management
- Webhook handling
- Invoice generation

**Razorpay Integration:**
- India-specific payments
- UPI, Cards, Net Banking
- Subscription billing
- Payment verification

### 7.2 Subscription Flow

**Service Type Selection (Signup):**
- CV Analysis Only → Basic Plan
- CV Analysis + Interview → Gold/Platinum Plans

**Plan Selection:**
- Basic, Gold, Platinum tiers
- Feature comparison
- Pricing display

**Payment Processing:**
- Provider selection (Stripe/Razorpay)
- Checkout session creation
- Payment confirmation
- Subscription activation

**Subscription Management:**
- View current plan
- Usage tracking
- Upgrade/downgrade
- Cancellation
- Billing history

---

## 8. STATE MANAGEMENT & DATA FLOW

### 8.1 State Management Approach

**React Hooks Used:**
- `useState` - Component-level state
- `useEffect` - Side effects and data fetching
- `useRef` - DOM references and mutable values
- `useNavigate` - Programmatic navigation
- `useLocation` - Route state and parameters

**No Global State Library:**
- Props drilling for shared state
- Context API for authentication
- localStorage for persistence
- Component-level state management

### 8.2 Data Fetching Pattern

**API Service Layer** (`services/` directory):
- `token.js` - JWT token management
- `api.js` - Base API configuration
- `subscriptionApi.js` - Subscription endpoints
- `jobMasterApi.js` - Job position endpoints
- `resumeScreeningApi.js` - CV analysis endpoints
- `razorpayService.js` - Razorpay payment APIs

**Fetch Pattern:**
```javascript
const fetchData = async () => {
  try {
    const token = getToken();
    const res = await fetch(`${backendURL}/endpoint`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setState(data);
    }
  } catch (error) {
    console.error(error);
  }
};
```

### 8.3 Form Handling

**Controlled Components:**
- Form state in component state
- onChange handlers for inputs
- Validation on submit
- Error state management

**Multi-Step Forms:**
- Step state tracking
- Form data accumulation
- Step validation
- Progress indicators

---

## 9. ROUTING ARCHITECTURE

### 9.1 Route Structure

**Public Routes (with Layout):**
- `/` - Home page
- `/features` - Features page
- `/pricing` - Pricing page
- `/login` - User login
- `/signup` - User registration
- `/candidate-login` - Candidate login
- `/contact` - Contact page

**Candidate Dashboard Routes:**
- `/dashboard` - Overview
- `/dashboard/interviews` - Interview history
- `/dashboard/scheduled-interviews` - Upcoming interviews
- `/dashboard/reports` - Performance reports
- `/dashboard/practice` - Practice mode
- `/dashboard/profile` - Profile settings
- `/dashboard/audio-testing` - Audio setup

**Organization Dashboard Routes:**
- `/organization/dashboard` - Overview
- `/organization/dashboard/smart-scheduler` - AI scheduler
- `/organization/dashboard/schedule-interview` - Manual scheduler
- `/organization/dashboard/job-master` - Job positions
- `/organization/dashboard/cv-analyser` - Resume screening
- `/organization/dashboard/cv-analyser/history` - Screening history
- `/organization/dashboard/interviews` - Interview management
- `/organization/dashboard/candidates` - Candidate database
- `/organization/dashboard/subscription` - Subscription management
- `/organization/dashboard/upgrade-subscription` - Plan upgrade
- `/organization/dashboard/billing` - Billing & invoices
- `/organization/dashboard/settings` - Settings
- `/organization/dashboard/interview-results/:id` - Interview results

**Interview Execution:**
- `/interview` - Live interview interface

**Admin Routes:**
- `/admin` - Admin login
- `/admin/dashboard/*` - Admin panel

### 9.2 Route Protection

**ProtectedRoute Wrapper:**
- Checks JWT token validity
- Verifies user role
- Redirects unauthorized users
- Maintains intended destination

---

## 10. RESPONSIVE DESIGN & STYLING

### 10.1 CSS Architecture

**Component-Scoped Styling:**
- Each component has dedicated CSS file
- BEM-like naming conventions
- Modular and maintainable

**CSS Variables:**
- Color themes
- Spacing units
- Typography scales
- Transition timings

**Responsive Breakpoints:**
- Mobile-first approach
- Tablet optimizations
- Desktop layouts
- Large screen support

### 10.2 Bootstrap Integration

**Bootstrap 5.3.8 Usage:**
- Grid system for layouts
- Utility classes for spacing
- Component styling base
- Responsive utilities

**Custom Overrides:**
- Brand color customization
- Component modifications
- Additional utility classes

---

## 11. BROWSER APIs & INTEGRATIONS

### 11.1 WebRTC Integration

**Media Device Access:**
- Camera permission requests
- Microphone access
- Device enumeration
- Stream management

**Use Cases:**
- Interview setup wizard
- Audio testing
- Video preview
- Recording functionality

### 11.2 Speech Recognition

**Web Speech API:**
- Real-time voice transcription
- Language detection
- Continuous recognition
- Interim results handling

**Implementation:**
- `SpeechToTextInput.jsx` component
- Browser compatibility checks
- Fallback mechanisms

### 11.3 File Handling

**File Upload:**
- Drag-and-drop support
- Multiple file selection
- File type validation
- Size limit checks

**File Types Supported:**
- PDF documents
- DOC/DOCX files
- Image formats (for future features)

### 11.4 LocalStorage Usage

**Data Persistence:**
- JWT token storage
- User preferences
- Interview data caching
- Form state preservation

---

## 12. PERFORMANCE OPTIMIZATIONS

### 12.1 Code Splitting

**React.lazy (Potential):**
- Route-based code splitting
- Component lazy loading
- Reduced initial bundle size

### 12.2 Asset Optimization

**Vite Build Optimizations:**
- Tree shaking
- Minification
- Asset compression
- Cache busting

### 12.3 Data Fetching

**Optimization Strategies:**
- Data caching in state
- Conditional fetching
- Loading states
- Error boundaries

---

## 13. ERROR HANDLING & USER FEEDBACK

### 13.1 Error Handling Patterns

**API Error Handling:**
- Try-catch blocks
- Error state management
- User-friendly error messages
- Retry mechanisms

**Form Validation:**
- Client-side validation
- Real-time feedback
- Error message display
- Field-level validation

### 13.2 User Feedback Mechanisms

**Loading States:**
- Spinners and loaders
- Skeleton screens
- Progress indicators
- Disabled states

**Success Messages:**
- Toast notifications
- Success banners
- Confirmation modals
- Visual feedback

**Error Messages:**
- Error alerts
- Inline validation errors
- Modal error displays
- Helpful error descriptions

---

## 14. ACCESSIBILITY CONSIDERATIONS

### 14.1 Semantic HTML

**Proper Element Usage:**
- Semantic tags (header, nav, main, section)
- ARIA labels where needed
- Heading hierarchy
- Form labels

### 14.2 Keyboard Navigation

**Interactive Elements:**
- Tab navigation support
- Focus indicators
- Keyboard shortcuts
- Escape key handling

### 14.3 Screen Reader Support

**ARIA Attributes:**
- Role definitions
- State announcements
- Live regions
- Descriptive labels

---

## 15. SECURITY MEASURES

### 15.1 Authentication Security

**JWT Token Handling:**
- Secure token storage
- Token expiration handling
- Automatic logout on expiry
- Token refresh mechanism

### 15.2 Input Validation

**Client-Side Validation:**
- XSS prevention
- Input sanitization
- Type checking
- Length restrictions

### 15.3 Secure Communication

**HTTPS Enforcement:**
- Secure API calls
- Environment-based URLs
- CORS handling

---

## 16. DEPLOYMENT & BUILD

### 16.1 Build Process

**Vite Build:**
```bash
npm run build
```
- Production optimization
- Asset bundling
- Environment variable injection
- Output to `dist/` directory

### 16.2 Deployment Options

**GitHub Pages:**
```bash
npm run deploy
```
- Automated deployment
- Branch-based hosting
- Custom domain support

**Other Platforms:**
- Netlify
- Vercel
- AWS S3 + CloudFront
- Traditional web servers

---

## 17. ENVIRONMENT CONFIGURATION

### 17.1 Environment Variables

**Backend URL Configuration:**
- Development: `http://localhost:5003`
- Production: `https://interview.onewebmart.cloud`

**API Keys:**
- Razorpay Key ID
- Stripe Publishable Key
- Other service keys

### 17.2 Configuration Files

**vite.config.js:**
- Build configuration
- Plugin setup
- Path aliases
- Server settings

**package.json:**
- Dependencies
- Scripts
- Project metadata

---

## 18. FUTURE ENHANCEMENTS & SCALABILITY

### 18.1 Potential Features

**Candidate Side:**
- Video interview recording
- AI-powered mock interview feedback
- Interview preparation resources
- Performance analytics dashboard
- Peer comparison

**Organization Side:**
- Bulk candidate import
- Advanced analytics
- Team collaboration features
- Custom branding
- API access for integrations

### 18.2 Technical Improvements

**Performance:**
- Implement React.lazy for code splitting
- Add service workers for offline support
- Optimize image loading
- Implement virtual scrolling for large lists

**State Management:**
- Consider Redux or Zustand for complex state
- Implement React Query for server state
- Add optimistic updates

**Testing:**
- Unit tests with Jest
- Integration tests
- E2E tests with Cypress/Playwright
- Component testing with React Testing Library

---

## 19. KEY WORKFLOWS

### 19.1 Organization Interview Scheduling Workflow

**Traditional Flow:**
1. Organization logs in
2. Navigates to Schedule Interview
3. Manually enters candidate details
4. Configures interview settings
5. Schedules interview
6. Candidate receives credentials via email

**AI-Powered Flow (Smart Scheduler):**
1. Organization selects job position
2. Uploads candidate CV
3. AI parses CV and extracts information
4. Organization reviews auto-filled details
5. Configures interview settings
6. Schedules interview
7. Candidate receives credentials

**CV History Integration Flow:**
1. Organization analyzes bulk resumes
2. Reviews screening report
3. Clicks "Schedule Interview" on candidate
4. System retrieves existing CV from server
5. Auto-parses CV with AI
6. Pre-fills candidate information
7. Organization reviews and schedules
8. No re-upload needed

### 19.2 Candidate Interview Taking Workflow

1. Candidate receives email with credentials
2. Logs in using provided credentials
3. Views scheduled interview details
4. Clicks "Start Interview"
5. Completes hardware setup wizard:
   - Camera permission
   - Camera selection
   - Speaker test
   - Final verification
6. Interview begins
7. AI asks questions one by one
8. Candidate responds via voice/text
9. Real-time transcription
10. Interview completes
11. Recording uploaded to server
12. AI evaluates responses
13. Results generated
14. Organization reviews and publishes results
15. Candidate views performance report

### 19.3 Resume Screening Workflow

1. Organization creates/selects job position
2. Uploads multiple resumes (bulk)
3. Configures screening parameters
4. Triggers AI analysis
5. AI processes each resume:
   - Text extraction
   - Data normalization
   - Evaluation against job requirements
   - Scoring and ranking
6. Report generated with rankings
7. Organization reviews candidates
8. Shortlists candidates
9. Schedules interviews directly from report

---

## 20. COMPONENT INTERACTION DIAGRAM

```
App.jsx (Router)
├── Layout (Public Pages)
│   ├── Navbar
│   ├── Home Components (Hero, Features, FAQ, CTA)
│   ├── Auth Components (Login, Signup)
│   └── Pricing Components
│
├── DashboardLayout (Candidate)
│   ├── Sidebar
│   ├── Topbar
│   └── Pages
│       ├── Overview
│       ├── Scheduled Interviews
│       ├── Interview History
│       ├── Reports
│       ├── Practice (Multi-step)
│       ├── Profile
│       └── Audio Testing
│
├── OrgDashboardLayout (Organization)
│   ├── OrgSidebar
│   ├── OrgTopbar
│   └── Pages
│       ├── OrgOverview
│       ├── OrgScheduler (Multi-step AI)
│       ├── ScheduleInterview (Manual)
│       ├── OrgJobMaster
│       ├── OrgCvAnalyzer (Multi-step)
│       ├── OrgCvHistory
│       ├── OrgInterviews
│       ├── OrgCandidates
│       ├── InterviewResults
│       ├── ManageSubscription
│       ├── Upgrade/Billing
│       └── OrgSettings
│
└── Interview Components
    ├── InterviewSetup (Multi-step)
    ├── SpeechToTextInput
    ├── VoiceVisualizer
    └── RecordingUploadOverlay
```

---

## 21. DATA MODELS (Frontend Perspective)

### 21.1 User/Organization Object
```javascript
{
  _id: string,
  email: string,
  role: "candidate" | "organization",
  name: string,
  organizationName?: string,
  subscriptionTier?: "basic" | "gold" | "platinum",
  interviewUsed?: number,
  interviewLimit?: number,
  cvUsed?: number,
  cvLimit?: number
}
```

### 21.2 Interview Object
```javascript
{
  _id: string,
  candidateName: string,
  candidateEmail: string,
  position: string,
  organizationId: string,
  interviewType: "technical" | "hr" | "managerial" | "cultural-fit",
  duration: number,
  scheduledDate?: string,
  deadline?: string,
  daysTimer?: number,
  schedulingType: "specific" | "timer",
  status: "scheduled" | "completed" | "cancelled" | "pending",
  completed: boolean,
  createdAt: string,
  educationalQualification?: string,
  pastWorkExperienceYears?: string,
  pastWorkExperienceField?: string,
  currentWorkExperienceYears?: string,
  currentWorkExperienceField?: string,
  coreSkillSet?: string,
  typeOfCompany?: string,
  natureOfPosition?: string
}
```

### 21.3 Job Position Object
```javascript
{
  _id: string,
  jobTitle: string,
  jobDescription: string,
  minEducation: string,
  minExperience: string,
  jobLocation: string,
  requiredSkills: string[],
  responsibilities: string[],
  organizationId: string,
  createdAt: string
}
```

### 21.4 CV Screening Report Object
```javascript
{
  jobId: string,
  job: {
    jobTitle: string,
    scoringScale: "10" | "100",
    reportType: "SUMMARY" | "DETAILED"
  },
  candidates: [
    {
      resumeId: string,
      candidateName: string,
      filename: string,
      rank: number,
      score: number,
      verdict: "Shortlist" | "Borderline" | "Reject",
      experienceMatch: string,
      skillsMatchPercent: number,
      roleFit: string,
      matchedSkills: string[],
      missingSkills: string[],
      summary: string,
      status: "analyzed" | "uploaded" | "failed"
    }
  ],
  buckets: {
    shortlist: number,
    borderline: number,
    reject: number
  }
}
```

### 21.5 Interview Result Object
```javascript
{
  _id: string,
  interviewId: string,
  candidateId: string,
  questions: [
    {
      question: string,
      answer: string,
      score: number,
      feedback: string
    }
  ],
  overallScore: number,
  grade: string,
  strengths: string[],
  improvements: string[],
  aiSummary: string,
  completedAt: string,
  published: boolean
}
```

---

## 22. API INTEGRATION SUMMARY

### 22.1 Authentication Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/candidate-login` - Candidate login
- `GET /auth/me` - Get current user

### 22.2 Candidate Endpoints
- `GET /candidate/scheduled-interviews` - Get scheduled interviews
- `GET /candidate/all-interviews` - Get all interviews
- `GET /candidate/interview-history` - Get completed interviews
- `GET /candidate/interview-results` - Get performance results
- `GET /candidate/profile` - Get candidate profile

### 22.3 Organization Endpoints
- `POST /organization/schedule-interview` - Schedule interview
- `PUT /organization/interviews/:id` - Update interview
- `DELETE /organization/interviews/:id` - Delete interview
- `GET /organization/interviews` - Get all interviews
- `GET /organization/candidates` - Get all candidates
- `POST /organization/parse-cv` - Parse uploaded CV
- `POST /organization/parse-cv-from-history` - Parse existing CV
- `GET /organization/interview-results/:id` - Get interview results
- `PUT /organization/publish-results/:id` - Publish results

### 22.4 Job Master Endpoints
- `GET /organization/job-master` - Get all job positions
- `POST /organization/job-master` - Create job position
- `PUT /organization/job-master/:id` - Update job position
- `DELETE /organization/job-master/:id` - Delete job position

### 22.5 Resume Screening Endpoints
- `POST /api/job/create` - Create screening job
- `POST /api/resumes/upload` - Upload resumes
- `POST /api/resumes/analyze` - Trigger AI analysis
- `GET /api/report/:jobId` - Get screening report
- `GET /api/history/jobs` - Get screening history
- `GET /api/resume/:resumeId/data` - Get resume data

### 22.6 Subscription Endpoints
- `GET /subscription/plans` - Get available plans
- `POST /subscription/create-checkout-session` - Create Stripe session
- `GET /api/subscription-status` - Get subscription status
- `GET /api/interview-usage` - Get interview usage
- `GET /api/cv-usage` - Get CV usage

### 22.7 Razorpay Endpoints
- `GET /razorpay/key` - Get Razorpay public key
- `POST /razorpay/create-subscription` - Create subscription
- `POST /razorpay/verify-payment` - Verify payment
- `POST /razorpay/cancel-subscription` - Cancel subscription

---

## 23. CONCLUSION

This AI-Powered Interview Simulation Platform represents a comprehensive solution for modern recruitment and interview preparation. The frontend architecture is built with modern React practices, emphasizing:

- **User Experience:** Intuitive interfaces for both candidates and organizations
- **AI Integration:** Seamless integration with AI-powered features (CV parsing, interview evaluation)
- **Scalability:** Modular component architecture for easy expansion
- **Performance:** Optimized build process and efficient data fetching
- **Security:** JWT-based authentication and secure API communication
- **Flexibility:** Support for multiple payment gateways and subscription models

The platform successfully bridges the gap between traditional interview processes and modern AI-assisted recruitment, providing value to both job seekers and hiring organizations.

---

**Document Version:** 1.0  
**Last Updated:** April 14, 2026  
**Prepared For:** Internship Project Report
