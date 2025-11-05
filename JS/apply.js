(async function() {
  'use strict';

  const { supabase, showMessage, requireAuth, updateNavigation, escapeHtml } = window.appUtils;

  const user = await requireAuth();
  if (!user) return;

  await updateNavigation();

  const applyForm = document.getElementById('apply-form');
  const jobDetailsDiv = document.getElementById('job-details');

  // Get job ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job_id');

  if (!jobId) {
    showMessage('Invalid job ID', true);
    window.location.href = 'index.html';
    return;
  }

  // Load job details
  async function loadJobDetails() {
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            location
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;

      const companyName = job.companies?.name || 'Unknown Company';
      const location = job.companies?.location || 'Location not specified';

      jobDetailsDiv.innerHTML = `
        <h3 style="color:#667eea;margin-bottom:8px;">${escapeHtml(job.title)}</h3>
        <p style="margin-bottom:8px;"><strong>${escapeHtml(companyName)}</strong> • ${escapeHtml(location)}</p>
        <p style="color:#666;">${escapeHtml(job.description)}</p>
      `;
    } catch (error) {
      console.error('Error loading job:', error);
      jobDetailsDiv.innerHTML = '<p class="error">Failed to load job details</p>';
      showMessage('Job not found', true);
    }
  }

  // Load user profile data
  async function loadUserData() {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.authUser.id)
        .single();

      document.getElementById('apply-name').value = user.userProfile.full_name || '';
      document.getElementById('apply-email').value = user.userProfile.email || '';
      document.getElementById('apply-phone').value = profile?.phone || '';
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Check if already applied
  async function checkExistingApplication() {
    try {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.userProfile.id)
        .single();

      if (data) {
        showMessage('You have already applied for this job', true, 0);
        applyForm.innerHTML = '<p style="text-align:center;color:#667eea;">You have already applied for this job.</p>';
      }
    } catch (error) {
      // No existing application found (error code PGRST116)
      if (error.code !== 'PGRST116') {
        console.error('Error checking application:', error);
      }
    }
  }

  // Submit application
  applyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('apply-name').value.trim();
    const email = document.getElementById('apply-email').value.trim();
    const phone = document.getElementById('apply-phone').value.trim();
    const coverLetter = document.getElementById('apply-cover').value.trim();
    const resumeFile = document.getElementById('apply-resume').files[0];

    if (!resumeFile) {
      showMessage('Please upload your resume', true);
      return;
    }

    if (resumeFile.type !== 'application/pdf') {
      showMessage('Only PDF files are allowed', true);
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      showMessage('File size must be less than 5MB', true);
      return;
    }

    try {
      // Upload resume
      const fileName = `resumes/${user.authUser.id}_${Date.now()}_${resumeFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-portal-files')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('job-portal-files')
        .getPublicUrl(fileName);

      // Create application
      const { error: appError } = await supabase
        .from('applications')
        .insert([{
          job_id: jobId,
          applicant_id: user.userProfile.id,
          cover_letter: coverLetter,
          resume_url: publicUrl,
          status: 'pending'
        }]);

      if (appError) throw appError;

      // Update user profile
      await supabase
        .from('users')
        .update({ full_name: name })
        .eq('email', user.authUser.email);

      // Update profiles
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.authUser.id,
          phone: phone || null,
          resume_url: publicUrl
        }, { onConflict: 'user_id' });

      showMessage('Application submitted successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      showMessage('Failed to submit application: ' + error.message, true);
    }
  });

  await loadJobDetails();
  await loadUserData();
  await checkExistingApplication();
})();
