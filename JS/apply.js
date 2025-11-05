(async function() {
  'use strict';

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const applyForm = document.getElementById('apply-form');
  const jobDetailsDiv = document.getElementById('job-details');
  const messageEl = document.getElementById('message');

  // Helper functions
  function showMessage(msg, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = msg;
    messageEl.className = isError ? 'message error' : 'message';
    messageEl.classList.remove('hidden');
    setTimeout(() => messageEl.classList.add('hidden'), 5000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get job ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job_id');

  if (!jobId) {
    showMessage('Invalid job ID', true);
    setTimeout(() => window.location.href = 'index.html', 2000);
    return;
  }

  // Load job details
  async function loadJobDetails() {
    try {
      console.log('Loading job with ID:', jobId);
      
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      console.log('Job data:', job, 'Error:', error);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!job) {
        jobDetailsDiv.innerHTML = '<p class="error">Job not found</p>';
        showMessage('Job not found', true);
        return;
      }

      jobDetailsDiv.innerHTML = `
        <h3 style="color:#667eea;margin-bottom:8px;">${escapeHtml(job.title)}</h3>
        <p style="margin-bottom:12px;"><strong>📍 Location:</strong> ${escapeHtml(job.location || 'Not specified')}</p>
        <p style="margin-bottom:12px;"><strong>💼 Type:</strong> ${formatJobType(job.job_type)}</p>
        <p style="margin-bottom:12px;"><strong>💰 Salary:</strong> ${escapeHtml(job.salary_range || 'Not specified')}</p>
        <p style="color:#666;line-height:1.6;"><strong>Description:</strong><br>${escapeHtml(job.description || 'No description available')}</p>
      `;
    } catch (error) {
      console.error('Error loading job:', error);
      jobDetailsDiv.innerHTML = '<p class="error">Failed to load job details</p>';
      showMessage('Failed to load job details: ' + error.message, true);
    }
  }

  // Format job type
  function formatJobType(type) {
    const typeMap = {
      'full_time': 'Full-time',
      'part_time': 'Part-time',
      'internship': 'Internship',
      'contract': 'Contract'
    };
    return typeMap[type] || type || 'Not specified';
  }

  // Submit application
  applyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('apply-name').value.trim();
    const email = document.getElementById('apply-email').value.trim();
    const phone = document.getElementById('apply-phone').value.trim();
    const coverLetter = document.getElementById('apply-cover').value.trim();
    const resumeFile = document.getElementById('apply-resume').files[0];

    if (!name || !email) {
      showMessage('Please fill in your name and email', true);
      return;
    }

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
      showMessage('Submitting application...');
      
      // For now, just show success message
      // In production, you would upload to Supabase storage and save to database
      showMessage('Application submitted successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      showMessage('Failed to submit application: ' + error.message, true);
    }
  });

  // Load job details on page load
  await loadJobDetails();
})();
