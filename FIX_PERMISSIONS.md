# Database Permissions Fix

## Problem
The homepage shows "Loading jobs..." forever because anonymous users don't have permission to read the jobs table.

## Solution
Run these SQL commands in your Supabase SQL Editor:

### Step 1: Go to Supabase SQL Editor
1. Open https://supabase.com/dashboard
2. Select your project: `sgenotbbvrliuewrlrqv`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run This SQL

```sql
-- Allow anonymous users to read jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to jobs"
ON jobs FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to companies"
ON companies FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to insert jobs
CREATE POLICY "Allow authenticated users to insert jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = posted_by);

-- Allow authenticated users to insert companies
CREATE POLICY "Allow authenticated users to insert companies"
ON companies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

-- Allow anonymous users to read applications (so users can see their own)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own applications"
ON applications FOR SELECT
TO authenticated
USING (auth.uid() = applicant_id);

CREATE POLICY "Users can insert their own applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = applicant_id);

-- Allow users to read their own profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Step 3: Click "Run" (or press Ctrl+Enter)

### Step 4: Refresh your homepage
After running the SQL, go back to https://jobportalnoai.netlify.app/ and refresh. You should see all 24 jobs!

## What This Does
- ✅ Allows anyone to view jobs and companies (public read)
- ✅ Allows logged-in users to post jobs
- ✅ Allows logged-in users to apply to jobs
- ✅ Keeps user profiles and applications private
