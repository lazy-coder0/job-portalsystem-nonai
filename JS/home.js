(async function() {
  'use strict';

  const { supabase, showMessage, getCurrentUser, updateNavigation, escapeHtml } = window.appUtils;
  
  await updateNavigation();

  const jobsListEl = document.getElementById('jobs-list');

  // Load and display jobs
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
        jobsListEl.innerHTML = '<p class="no-data">No jobs available yet. Check back soon!</p>';
        return;
      }

      jobsListEl.innerHTML = '';
      
      jobs.forEach(job => {
        const companyName = job.companies?.name || 'Unknown Company';
        const location = job.companies?.location || 'Location not specified';
        const postedDate = new Date(job.created_at).toLocaleDateString();

        const jobEl = document.createElement('div');
        jobEl.className = 'job-item';
        jobEl.innerHTML = `
          <h3>${escapeHtml(job.title)}</h3>
          <p class="job-meta"><strong>${escapeHtml(companyName)}</strong> • ${escapeHtml(location)}</p>
          <p class="job-desc">${escapeHtml(job.description).substring(0, 200)}...</p>
          <div class="job-footer">
            <span class="job-date">Posted: ${postedDate}</span>
            <a href="apply.html?job_id=${job.id}" class="btn-apply">Apply Now</a>
          </div>
        `;

        jobsListEl.appendChild(jobEl);
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobsListEl.innerHTML = '<p class="error">Failed to load jobs. Please try again.</p>';
    }
  }

  await loadJobs();
})();
