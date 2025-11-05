# Job Portal System - Multi-Page Application

A fully functional job portal built with vanilla JavaScript and Supabase backend.

## 📁 Project Structure

```
job-portal-system/
├── index.html              # Home page with job listings
├── login.html              # Login page
├── register.html           # Registration page
├── account.html            # User account management
├── post-job.html           # Post new job listing
├── my-applications.html    # View received applications
├── apply.html              # Job application form
├── reset-password.html     # Password reset page
├── CSS/
│   └── style.css          # Global styles
├── JS/
│   ├── config.js          # Supabase configuration
│   ├── utils.js           # Shared utilities
│   ├── home.js            # Home page logic
│   ├── login.js           # Login functionality
│   ├── register.js        # Registration logic
│   ├── account.js         # Account management
│   ├── post-job.js        # Job posting
│   ├── my-applications.js # Applications view
│   ├── apply.js           # Application submission
│   └── reset-password.js  # Password reset
└── README.md              # This file
```

## 🚀 Features

### For Job Seekers:
- ✅ **User Registration** - Create account with personal details
- ✅ **Account Management** - Update profile, resume, skills, experience
- ✅ **Browse Jobs** - View all available job listings
- ✅ **Apply to Jobs** - Submit applications with resume upload
- ✅ **Auto-fill Details** - Application forms pre-filled from profile
- ✅ **Password Reset** - Forgot password functionality

### For Employers:
- ✅ **Post Jobs** - Create job listings with company details
- ✅ **Manage Applications** - View all received applications
- ✅ **Applicant Details** - Access resumes, cover letters, contact info

### Account Management Page Features:
- Personal information (name, email, phone)
- Professional bio
- Skills and experience
- LinkedIn and portfolio URLs
- Resume upload and management
- Password change

## 🛠️ Setup Instructions

### 1. Database Setup (Supabase)

Your Supabase database should already have these tables:
- `users` - User accounts
- `profiles` - Extended user information
- `companies` - Company information
- `jobs` - Job listings
- `applications` - Job applications

### 2. Storage Setup (Supabase Storage)

Create a storage bucket for file uploads:

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Name: `job-portal-files`
4. Set as **Public**
5. Click **"Create bucket"**

Then set up storage policies (SQL):

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-portal-files');

-- Allow public to download files
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-portal-files');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-portal-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Local Development

Run a local server (choose one):

**Python:**
```powershell
python -m http.server 8000
```

**Node.js (http-server):**
```powershell
npx http-server -p 8000
```

Then open: http://localhost:8000

## 📄 Page Navigation

### Public Pages (No Login Required):
- **Home** (`index.html`) - Browse jobs
- **Login** (`login.html`) - Sign in
- **Register** (`register.html`) - Create account
- **Reset Password** (`reset-password.html`) - Recover account

### Protected Pages (Login Required):
- **Account** (`account.html`) - Manage profile and settings
- **Post Job** (`post-job.html`) - Create job listing
- **My Applications** (`my-applications.html`) - View received applications
- **Apply** (`apply.html?job_id=123`) - Submit job application

## 🔐 User Flow

### Job Seeker Flow:
1. Visit **index.html** → Browse jobs
2. Click **Register** → Create account with details
3. Go to **Account** → Update profile, upload resume
4. Browse jobs → Click **Apply Now**
5. Auto-filled application form → Upload resume → Submit

### Employer Flow:
1. Visit **index.html** → Click **Login**
2. After login → Click **Post Job**
3. Fill job details → Submit
4. Click **My Applications** → View all applicants
5. Download resumes, view contact details

## 🎨 Key Features

### Auto-Fill Forms
When applying for jobs, the application form automatically fills:
- Full name from profile
- Email from account
- Phone from profile
- User can still edit before submitting

### Resume Management
- Upload PDF resumes (max 5MB)
- Store in Supabase Storage
- Automatically attached to applications
- Update anytime from Account page

### Password Recovery
- Click "Forgot Password" on login page
- Enter email address
- Receive reset link via email
- Set new password securely

## 🚢 Deployment

See `DEPLOY.md` for deployment instructions to:
- Netlify (recommended - drag & drop)
- Vercel
- GitHub Pages

## 📝 Configuration

Your Supabase credentials are in `JS/config.js`:
- Project URL: `https://sgenotbbvrliuewrlrqv.supabase.co`
- Anon Key: Already configured

## 🐛 Troubleshooting

### "Failed to load jobs"
- Check Supabase connection in browser console
- Verify RLS policies allow public SELECT on jobs table

### "Upload failed"
- Ensure storage bucket `job-portal-files` exists
- Check storage policies are set correctly
- Verify file is PDF and under 5MB

### "Please login to access this page"
- Some pages require authentication
- Go to Login page and sign in
- Session persists across page refreshes

### Navigation not updating after login
- Hard refresh the page (Ctrl+F5)
- Check browser console for errors
- Verify utils.js is loaded before page scripts

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🔧 Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Authentication + Storage)
- **Deployment**: Static hosting (Netlify/Vercel)

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase dashboard for database/storage issues
3. Ensure all policies are set correctly

---

**Built with ❤️ using Supabase**
