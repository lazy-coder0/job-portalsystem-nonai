# Supabase Storage Setup for Resume Uploads

## Quick Setup (2 Minutes)

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sgenotbbvrliuewrlrqv
2. Click **Storage** in the left sidebar
3. Click **"New bucket"**
4. Name it: `job-portal-files`
5. Make it **Public** (check the box)
6. Click **"Create bucket"**

### Step 2: Set Storage Policies

Click on the `job-portal-files` bucket, then click **"Policies"**, then **"New Policy"**.

Create these 3 policies:

#### Policy 1: Anyone can upload
```sql
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-portal-files');
```

#### Policy 2: Anyone can read
```sql
CREATE POLICY "Anyone can download resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-portal-files');
```

#### Policy 3: Users can delete their own files
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-portal-files' AND auth.uid() = owner);
```

### Step 3: Test It!

That's it! Now when users click "Apply Now":
- ✅ They upload their resume (PDF only, max 5MB)
- ✅ Resume is stored in Supabase Storage
- ✅ You can download it from "My Applications"

---

## What's New in the App

### For Job Seekers:
1. **Register** with full name and phone
2. **Apply** to jobs - fills in their name/email automatically
3. **Upload resume** (PDF) required for each application
4. **Add cover letter** (optional)

### For Employers (You):
1. Click **"My Applications"**
2. See all applications with:
   - Applicant name
   - **Clickable email** (opens your email app)
   - **Download Resume** link (PDF)
   - Cover letter text
   - Application date

---

## Troubleshooting

### "Storage bucket not found"
- Make sure you created the bucket named exactly: `job-portal-files`
- Make sure it's set to **Public**

### "Upload failed"
- Check the storage policies are set correctly
- Make sure the file is a PDF
- Make sure file is under 5MB

### Resume link not working
- Verify the bucket is **Public**
- Check the SELECT policy exists

---

Done! Your job portal now has full resume upload functionality! 🎉
