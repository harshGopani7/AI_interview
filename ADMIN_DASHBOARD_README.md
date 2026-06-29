# Admin Dashboard Documentation

## Overview
The admin dashboard provides a centralized interface for platform administrators to manage organizations, candidates, and interviews across the entire system.

## Features

### 1. **Admin Authentication**
- **Login**: `/admin/login`
- **Signup**: `/admin/signup`
- Separate authentication from organization and candidate users
- Stored in `admin_users` MongoDB collection

### 2. **Dashboard Pages**

#### Overview (`/admin/dashboard`)
- Real-time statistics:
  - Total Organizations
  - Total Candidates
  - Total Interviews
  - Completed Interviews
  - Scheduled Interviews
- Quick action links to main sections

#### Organizations (`/admin/dashboard/organizations`)
- View all registered organizations
- Display organization details:
  - Organization name
  - Contact person
  - Email, phone, industry, company size
  - Number of candidates
  - Number of interviews
  - Join date

#### Candidates (`/admin/dashboard/candidates`)
- View all candidates across all organizations
- Display candidate details:
  - Name, email, username
  - Associated organization
  - Number of interviews
  - Creation date

#### Interviews (`/admin/dashboard/interviews`)
- View all scheduled interviews system-wide
- Display interview details:
  - Candidate information
  - Organization
  - Position, type, duration
  - Status (scheduled, completed, etc.)
  - Scheduled date

#### Settings (`/admin/dashboard/settings`)
- View admin account information
- Read-only display of admin name and email

## Database Collections

### admin_users
```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "password": String (hashed),
  "role": "admin",
  "created_at": Date
}
```

### Data Sources
- **Organizations**: `users` collection (role: "organization")
- **Candidates**: `candidate_credentials` collection
- **Interviews**: `scheduled_interviews` collection

## Backend API Endpoints

All endpoints require JWT authentication with admin role.

- `POST /admin/signup` - Create admin account
- `POST /admin/login` - Admin login
- `GET /admin/me` - Get current admin info
- `GET /admin/stats` - Get dashboard statistics
- `GET /admin/organizations` - Get all organizations
- `GET /admin/candidates` - Get all candidates
- `GET /admin/interviews` - Get all interviews

## Design
The admin dashboard uses the exact same design system as the organization dashboard:
- Same layout structure (sidebar + topbar + content)
- Same color scheme and styling
- Same UI components (Card, Input, Button)
- Responsive design matching organization dashboard

## Access
1. Create an admin account at `/admin/signup`
2. Login at `/admin/login`
3. Access dashboard at `/admin/dashboard`

## Security
- JWT-based authentication
- Protected routes requiring admin role
- Password hashing using werkzeug.security
- Separate admin collection from regular users
