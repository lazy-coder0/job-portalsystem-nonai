# Multi-Page Structure Guide

## What Changed?

The job portal has been restructured from a single-page application to a **multi-page application** with dedicated pages for each feature.

## Why This Is Better

✅ **Better User Experience**
- Cleaner URLs (e.g., `/account.html` instead of hash fragments)
- Browser back/forward buttons work naturally
- Users can bookmark specific pages

✅ **Easier to Manage Personal Details**
- Dedicated Account page for managing profile
- Separate forms for different actions
- No hidden/shown sections confusion

✅ **Better Organization**
- Each page has its own JavaScript file
- Cleaner code structure
- Easier to maintain and debug

## Page Overview

### 🏠 index.html - Home Page
- **Purpose**: Browse all available jobs
- **Access**: Public (no login required)
- **Features**: View job listings, click Apply Now

### 🔐 login.html - Login Page
- **Purpose**: Sign in to existing account
- **Access**: Public
- **Features**: Email/password login, forgot password link

### ✍️ register.html - Registration Page
- **Purpose**: Create new account
- **Access**: Public
- **Features**: Register with name, email, phone, password

### 👤 account.html - Account Management
- **Purpose**: Manage personal information and settings
- **Access**: Protected (login required)
- **Features**:
  - Update personal info (name, email, phone)
  - Write professional bio
  - Add skills and experience
  - Add LinkedIn/portfolio URLs
  - Upload/update resume
  - Change password

### 📝 post-job.html - Post Job
- **Purpose**: Create new job listing
- **Access**: Protected (login required)
- **Features**: Post job with company details, description, employment type, salary

### 📋 my-applications.html - View Applications
- **Purpose**: See who applied to your jobs
- **Access**: Protected (login required)
- **Features**: View applicant details, download resumes, see cover letters

### ✉️ apply.html - Job Application
- **Purpose**: Apply to a specific job
- **Access**: Protected (login required)
- **Features**: Auto-filled form, resume upload, cover letter

### 🔑 reset-password.html - Password Reset
- **Purpose**: Request password reset link
- **Access**: Public
- **Features**: Send reset email

## How Users Manage Personal Details

### Old Way (Single Page):
- Everything on one page
- Forms hidden/shown with JavaScript
- Hard to find where to update info

### New Way (Multi-Page):
1. **Register** → Create account with initial details
2. **Login** → Access your account
3. **Account Page** → Dedicated page to:
   - Update name, phone
   - Write bio about yourself
   - List your skills
   - Add experience years
   - Upload resume
   - Add social links
   - Change password

## Navigation Flow

```
Public User:
  index.html (Home) → Browse Jobs
  ↓ Click "Apply Now"
  ↓
  login.html → Login or Register
  ↓
  account.html → Complete profile
  ↓
  apply.html → Submit application

Employer:
  index.html (Home)
  ↓
  login.html → Login
  ↓
  post-job.html → Post new job
  ↓
  my-applications.html → View applicants
```

## File Organization

### HTML Files (Pages)
- `index.html` - Home
- `login.html` - Login
- `register.html` - Register
- `account.html` - Account settings
- `post-job.html` - Post job
- `my-applications.html` - View applications
- `apply.html` - Apply form
- `reset-password.html` - Reset password

### JavaScript Files (Logic)
- `JS/utils.js` - Shared utilities (loaded on every page)
- `JS/home.js` - Home page logic
- `JS/login.js` - Login logic
- `JS/register.js` - Registration logic
- `JS/account.js` - Account management
- `JS/post-job.js` - Job posting
- `JS/my-applications.js` - Applications view
- `JS/apply.js` - Application submission
- `JS/reset-password.js` - Password reset

### Shared Files
- `CSS/style.css` - Global styles for all pages
- `JS/config.js` - Supabase configuration
- `JS/utils.js` - Shared functions

## Key Improvements

### 1. Personal Details Management
Users can now fully manage their profile:
- **Basic Info**: Name, email, phone
- **Professional Info**: Bio, skills, experience
- **Links**: LinkedIn, portfolio
- **Documents**: Resume upload/update
- **Security**: Password change

### 2. Auto-Fill on Apply
When applying for jobs:
- Name auto-filled from profile
- Email auto-filled from account
- Phone auto-filled from profile
- User can edit before submitting

### 3. Resume Management
- Upload once in Account page
- Automatically used in applications
- Update anytime
- Download from employer view

## Testing the New Structure

1. **Start local server**:
   ```powershell
   python -m http.server 8000
   ```

2. **Test flow**:
   - Visit http://localhost:8000
   - Click "Register" → Create account
   - After login, click "Account" → Update profile
   - Go to "Home" → Apply to a job
   - See auto-filled details

3. **Employer flow**:
   - Login → "Post Job" → Create listing
   - "My Applications" → View applicants

## Migration Notes

- Old `app.js` file is no longer used
- Each page now has its own dedicated script
- `utils.js` provides shared functionality
- All pages use same CSS for consistent design
- Session persists across all pages

---

**The multi-page structure makes it much easier for users to manage their personal details and navigate the application!**
