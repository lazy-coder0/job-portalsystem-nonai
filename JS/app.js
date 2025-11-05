(function() {
  'use strict';

  // Initialize Supabase client
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase configuration missing');
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // State
  let currentUser = null;
  let currentUserProfile = null;

  // DOM Elements
  const messageEl = document.getElementById('message');
  const userInfoEl = document.getElementById('user-info');
  const jobsListEl = document.getElementById('jobs-list');
  
  const registerArea = document.getElementById('register-area');
  const authArea = document.getElementById('auth-area');
  const postArea = document.getElementById('post-area');
  const applyArea = document.getElementById('apply-area');
  const resetArea = document.getElementById('reset-area');
  const applicationsArea = document.getElementById('applications-area');
  const applicationsListEl = document.getElementById('applications-list');
  
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const postForm = document.getElementById('post-form');
  const applyForm = document.getElementById('apply-form');
  const resetForm = document.getElementById('reset-form');
  
  const btnShowLogin = document.getElementById('btn-show-login');
  const btnShowRegister = document.getElementById('btn-show-register');
  const btnShowPost = document.getElementById('btn-show-post');
  const btnShowApplications = document.getElementById('btn-show-applications');
  const btnLogout = document.getElementById('btn-logout');
  const btnCancelRegister = document.getElementById('btn-cancel-register');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  const btnCancelPost = document.getElementById('btn-cancel-post');
  const btnCancelApply = document.getElementById('btn-cancel-apply');
  const btnForgotPassword = document.getElementById('btn-forgot-password');
  const btnCancelReset = document.getElementById('btn-cancel-reset');

  let currentJobIdForApplication = null;

  // Utility: Show message
  function showMessage(msg, isError = false, timeout = 5000) {
    messageEl.textContent = msg;
    messageEl.className = isError ? 'message error' : 'message';
    if (timeout > 0) {
      setTimeout(() => messageEl.classList.add('hidden'), timeout);
    }
  }

  // Utility: Hide all forms
  function hideAllForms() {
    registerArea.classList.add('hidden');
    authArea.classList.add('hidden');
    postArea.classList.add('hidden');
    applyArea.classList.add('hidden');
    resetArea.classList.add('hidden');
    applicationsArea.classList.add('hidden');
  }

  // Update UI based on auth state
  async function updateAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    const authUser = session?.user || null;

    if (authUser) {
      // Get user profile from custom users table
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      currentUser = authUser;
      currentUserProfile = userProfile;

      userInfoEl.textContent = `👤 ${userProfile?.full_name || authUser.email}`;
      userInfoEl.classList.remove('hidden');
      btnShowLogin.style.display = 'none';
      btnShowRegister.style.display = 'none';
      btnLogout.style.display = 'inline-block';
      btnShowApplications.style.display = 'inline-block';
    } else {
      currentUser = null;
      currentUserProfile = null;
      userInfoEl.classList.add('hidden');
      btnShowLogin.style.display = 'inline-block';
      btnShowRegister.style.display = 'inline-block';
      btnLogout.style.display = 'none';
      btnShowApplications.style.display = 'none';
    }
  }

  // Register new user
  async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters', true);
      return;
    }

    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (authError) throw authError;

      // Create user record in custom users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          full_name: fullName,
          email: email,
          password_hash: 'managed_by_supabase_auth',
          role: 'job_seeker'
        }]);

      if (userError) throw userError;

      // Create profile with phone
      if (phone) {
        await supabase
          .from('profiles')
          .insert([{
            user_id: authData.user.id,
            bio: '',
            skills: [],
            experience_years: 0
          }]);
      }

      // Check if email confirmation is disabled (user will be logged in immediately)
      if (authData?.session) {
        showMessage('Registration successful! You are now logged in.');
        await updateAuthState();
        await loadJobs();
      } else {
        showMessage('Registration successful! Please check your email to verify your account.');
      }
      
      registerForm.reset();
      hideAllForms();
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('Registration failed: ' + error.message, true);
    }
  }

  // Login user
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      showMessage('Login successful!');
      loginForm.reset();
      hideAllForms();
      await updateAuthState();
      await loadJobs();
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Login failed: ' + error.message, true);
    }
  }

  // Logout user
  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      showMessage('Logged out successfully');
      await updateAuthState();
      await loadJobs();
    } catch (error) {
      console.error('Logout error:', error);
      showMessage('Logout failed: ' + error.message, true);
    }
  }

  // Reset password request
  async function handleResetPassword(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      
      if (error) throw error;
      
      showMessage('Password reset link sent! Check your email.', false, 8000);
      resetForm.reset();
      hideAllForms();
    } catch (error) {
      console.error('Password reset error:', error);
      showMessage('Failed to send reset link: ' + error.message, true);
    }
  }

  // Load jobs from database with company info
  async function loadJobs() {
    try {
      jobsListEl.innerHTML = '<p class="loading">Loading jobs...</p>';
      
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            location
          ),
          users:posted_by (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!jobs || jobs.length === 0) {
        jobsListEl.innerHTML = '<p class="loading">No jobs available yet. Be the first to post!</p>';
        return;
      }

      renderJobs(jobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobsListEl.innerHTML = '<p class="loading">Error loading jobs. Please check your database setup.</p>';
      showMessage('Error loading jobs: ' + error.message, true);
    }
  }

  // Render jobs list
  function renderJobs(jobs) {
    jobsListEl.innerHTML = '';
    
    jobs.forEach(job => {
      const jobEl = document.createElement('div');
      jobEl.className = 'job';
      
      const isOwner = currentUserProfile && job.posted_by === currentUserProfile.id;
      const companyName = job.companies?.name || 'Company not specified';
      const companyLocation = job.companies?.location || job.location || 'Location not specified';
      
      jobEl.innerHTML = `
        <h3>${escapeHtml(job.title || 'Untitled Job')}</h3>
        <div class="meta">
          <span>🏢 ${escapeHtml(companyName)}</span>
          <span>📍 ${escapeHtml(companyLocation)}</span>
          ${job.job_type ? `<span>💼 ${escapeHtml(job.job_type.replace('_', ' '))}</span>` : ''}
          ${job.salary_range ? `<span>💰 ${escapeHtml(job.salary_range)}</span>` : ''}
        </div>
        <p>${escapeHtml(job.description || 'No description provided')}</p>
        <div class="job-actions">
          <button class="btn-apply" data-id="${job.id}">Apply Now</button>
          ${isOwner ? `<button class="btn-edit" data-id="${job.id}">Edit</button>` : ''}
        </div>
      `;
      
      jobsListEl.appendChild(jobEl);
    });

    // Attach event listeners
    document.querySelectorAll('.btn-apply').forEach(btn => {
      btn.addEventListener('click', () => handleApply(btn.dataset.id));
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => handleEdit(btn.dataset.id));
    });
  }

  // Post new job
  async function handlePostJob(e) {
    e.preventDefault();

    if (!currentUserProfile) {
      showMessage('Please login to post a job', true);
      authArea.classList.remove('hidden');
      return;
    }

    const title = document.getElementById('job-title').value.trim();
    const companyName = document.getElementById('job-company').value.trim();
    const location = document.getElementById('job-location').value.trim();
    const description = document.getElementById('job-desc').value.trim();

    try {
      // First, create or get company
      let companyId = null;
      if (companyName) {
        // Check if company exists
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', companyName)
          .eq('owner_id', currentUserProfile.id)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert([{
              name: companyName,
              location: location,
              owner_id: currentUserProfile.id
            }])
            .select()
            .single();

          if (companyError) throw companyError;
          companyId = newCompany.id;
        }
      }

      // Create job
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          title,
          description,
          location,
          company_id: companyId,
          posted_by: currentUserProfile.id,
          job_type: 'full_time'
        }])
        .select();

      if (error) throw error;

      showMessage('Job posted successfully!');
      postForm.reset();
      hideAllForms();
      await loadJobs();
    } catch (error) {
      console.error('Error posting job:', error);
      showMessage('Failed to post job: ' + error.message, true);
    }
  }

  // Apply to job
  async function handleApply(jobId) {
    if (!currentUserProfile) {
      showMessage('Please login to apply for jobs', true);
      authArea.classList.remove('hidden');
      return;
    }

    try {
      // Check if already applied
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', currentUserProfile.id)
        .single();

      if (existing) {
        showMessage('You have already applied to this job!', true);
        return;
      }

      // Get job details
      const { data: job } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', jobId)
        .single();

      // Show apply form with pre-filled details
      currentJobIdForApplication = jobId;
      document.getElementById('apply-job-title').textContent = `Applying for: ${job?.title || 'Job'}`;
      document.getElementById('apply-name').value = currentUserProfile.full_name || '';
      document.getElementById('apply-email').value = currentUserProfile.email || '';
      document.getElementById('apply-phone').value = '';
      document.getElementById('apply-cover').value = '';
      
      hideAllForms();
      applyArea.classList.remove('hidden');
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error: ' + error.message, true);
    }
  }

  // Submit application with resume
  async function handleSubmitApplication(e) {
    e.preventDefault();

    const name = document.getElementById('apply-name').value.trim();
    const email = document.getElementById('apply-email').value.trim();
    const phone = document.getElementById('apply-phone').value.trim();
    const coverLetter = document.getElementById('apply-cover').value.trim();
    const resumeFile = document.getElementById('apply-resume').files[0];

    if (!resumeFile) {
      showMessage('Please upload your resume (PDF)', true);
      return;
    }

    if (resumeFile.type !== 'application/pdf') {
      showMessage('Resume must be a PDF file', true);
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) { // 5MB limit
      showMessage('Resume file size must be less than 5MB', true);
      return;
    }

    try {
      showMessage('Uploading resume...', false, 0);

      // Upload resume to Supabase Storage
      const fileName = `resumes/${currentUserProfile.id}_${Date.now()}_${resumeFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-portal-files')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('job-portal-files')
        .getPublicUrl(fileName);

      const resumeUrl = urlData.publicUrl;

      // Submit application
      const { error: appError } = await supabase
        .from('applications')
        .insert([{
          job_id: currentJobIdForApplication,
          applicant_id: currentUserProfile.id,
          status: 'pending'
        }]);

      if (appError) throw appError;

      // Update user profile with latest info
      await supabase
        .from('users')
        .update({ 
          full_name: name
        })
        .eq('id', currentUserProfile.id);

      // Update or create profile with resume URL
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUserProfile.id)
        .single();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({ resume_url: resumeUrl })
          .eq('user_id', currentUserProfile.id);
      } else {
        await supabase
          .from('profiles')
          .insert([{
            user_id: currentUserProfile.id,
            resume_url: resumeUrl,
            bio: coverLetter || ''
          }]);
      }

      showMessage('Application submitted successfully!');
      applyForm.reset();
      hideAllForms();
      currentJobIdForApplication = null;
    } catch (error) {
      console.error('Error submitting application:', error);
      showMessage('Failed to submit application: ' + error.message, true);
    }
  }

  // Edit job (prefill form)
  async function handleEdit(jobId) {
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*, companies(name)')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      document.getElementById('job-title').value = job.title || '';
      document.getElementById('job-company').value = job.companies?.name || '';
      document.getElementById('job-location').value = job.location || '';
      document.getElementById('job-desc').value = job.description || '';

      hideAllForms();
      postArea.classList.remove('hidden');
      
      // Store job ID for update
      postForm.dataset.editId = jobId;
    } catch (error) {
      console.error('Error loading job:', error);
      showMessage('Failed to load job: ' + error.message, true);
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load applications for jobs posted by current user
  async function loadApplications() {
    if (!currentUserProfile) {
      applicationsListEl.innerHTML = '<p class="loading">Please login to view applications.</p>';
      return;
    }

    try {
      applicationsListEl.innerHTML = '<p class="loading">Loading applications...</p>';

      // Get all jobs posted by current user
      const { data: myJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('posted_by', currentUserProfile.id);

      if (jobsError) throw jobsError;

      if (!myJobs || myJobs.length === 0) {
        applicationsListEl.innerHTML = '<p class="loading">You haven\'t posted any jobs yet.</p>';
        return;
      }

      const jobIds = myJobs.map(j => j.id);

      // Get all applications for those jobs with applicant details
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title
          ),
          users:applicant_id (
            id,
            full_name,
            email
          )
        `)
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      if (!applications || applications.length === 0) {
        applicationsListEl.innerHTML = '<p class="loading">No applications received yet.</p>';
        return;
      }

      // Get profile/resume info for each applicant
      const applicantIds = applications.map(a => a.applicant_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, resume_url, bio')
        .in('user_id', applicantIds);

      // Map profiles to applications
      const profileMap = {};
      if (profiles) {
        profiles.forEach(p => {
          profileMap[p.user_id] = p;
        });
      }

      renderApplications(applications, profileMap);
    } catch (error) {
      console.error('Error loading applications:', error);
      applicationsListEl.innerHTML = '<p class="loading">Error loading applications.</p>';
      showMessage('Error loading applications: ' + error.message, true);
    }
  }

  // Render applications list
  function renderApplications(applications, profileMap) {
    applicationsListEl.innerHTML = '';

    applications.forEach(app => {
      const appEl = document.createElement('div');
      appEl.className = 'application-item';

      const applicantName = app.users?.full_name || 'Unknown';
      const applicantEmail = app.users?.email || 'No email';
      const jobTitle = app.jobs?.title || 'Unknown Job';
      const appliedDate = new Date(app.applied_at).toLocaleDateString();
      const status = app.status || 'pending';
      
      const profile = profileMap[app.applicant_id] || {};
      const resumeUrl = profile.resume_url || '';
      const bio = profile.bio || '';

      appEl.innerHTML = `
        <h4>${escapeHtml(jobTitle)}</h4>
        <div class="app-meta">
          <strong>Applicant:</strong> ${escapeHtml(applicantName)}<br>
          <strong>Email:</strong> <a href="mailto:${escapeHtml(applicantEmail)}">${escapeHtml(applicantEmail)}</a><br>
          ${bio ? `<strong>Cover Letter:</strong> ${escapeHtml(bio)}<br>` : ''}
          ${resumeUrl ? `<strong>Resume:</strong> <a href="${escapeHtml(resumeUrl)}" target="_blank" style="color:#667eea">Download PDF</a><br>` : ''}
          <strong>Applied:</strong> ${appliedDate}<br>
          <strong>Status:</strong> <span class="app-status ${status}">${status.toUpperCase()}</span>
        </div>
      `;

      applicationsListEl.appendChild(appEl);
    });
  }

  // Event Listeners
  registerForm.addEventListener('submit', handleRegister);
  loginForm.addEventListener('submit', handleLogin);
  postForm.addEventListener('submit', handlePostJob);
  applyForm.addEventListener('submit', handleSubmitApplication);
  resetForm.addEventListener('submit', handleResetPassword);
  
  btnShowLogin.addEventListener('click', () => {
    hideAllForms();
    authArea.classList.remove('hidden');
  });

  btnShowRegister.addEventListener('click', () => {
    hideAllForms();
    registerArea.classList.remove('hidden');
  });

  btnForgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    hideAllForms();
    resetArea.classList.remove('hidden');
  });

  btnShowPost.addEventListener('click', () => {
    if (!currentUserProfile) {
      showMessage('Please login to post a job', true);
      authArea.classList.remove('hidden');
      return;
    }
    hideAllForms();
    postForm.reset();
    delete postForm.dataset.editId;
    postArea.classList.remove('hidden');
  });

  btnShowApplications.addEventListener('click', () => {
    if (!currentUserProfile) {
      showMessage('Please login to view applications', true);
      authArea.classList.remove('hidden');
      return;
    }
    hideAllForms();
    applicationsArea.classList.remove('hidden');
    loadApplications();
  });

  btnLogout.addEventListener('click', handleLogout);
  
  btnCancelRegister.addEventListener('click', hideAllForms);
  btnCancelLogin.addEventListener('click', hideAllForms);
  btnCancelReset.addEventListener('click', hideAllForms);
  btnCancelApply.addEventListener('click', () => {
    hideAllForms();
    applyForm.reset();
    currentJobIdForApplication = null;
  });
  btnCancelPost.addEventListener('click', () => {
    hideAllForms();
    postForm.reset();
    delete postForm.dataset.editId;
  });

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    updateAuthState();
  });

  // Initialize
  async function init() {
    await updateAuthState();
    await loadJobs();
  }

  init();
})();
