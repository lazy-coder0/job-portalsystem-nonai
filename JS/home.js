(async function() {
  'use strict';

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const jobsListEl = document.getElementById('jobs-list');

  // Load and display jobs
  async function loadJobs() {
    try {
      console.log('Starting to load jobs...');
      jobsListEl.innerHTML = '<p class="loading">Loading jobs...</p>';
      
      console.log('Querying Supabase...');
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Query result:', { jobs, error });

      if (error) {
        console.error('Supabase error:', error);
        jobsListEl.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        return;
      }

      if (!jobs || jobs.length === 0) {
        jobsListEl.innerHTML = '<p class="no-data">No jobs available yet. Check back soon!</p>';
        return;
      }

      console.log(`Found ${jobs.length} jobs`);
      jobsListEl.innerHTML = '';
      
      jobs.forEach(job => {
        const postedDate = new Date(job.created_at).toLocaleDateString();

        const jobEl = document.createElement('div');
        jobEl.className = 'job-item';
        jobEl.innerHTML = `
          <h3>${job.title || 'Untitled Job'}</h3>
          <p class="job-meta"><strong>Location:</strong> ${job.location || 'Not specified'}</p>
          <p class="job-meta"><strong>Type:</strong> ${job.job_type || 'Not specified'}</p>
          <p class="job-meta"><strong>Salary:</strong> ${job.salary_range || 'Not specified'}</p>
          <p class="job-desc">${(job.description || 'No description').substring(0, 200)}...</p>
          <div class="job-footer">
            <span class="job-date">Posted: ${postedDate}</span>
            <a href="apply.html?job_id=${job.id}" class="btn-apply">Apply Now</a>
          </div>
        `;

        jobsListEl.appendChild(jobEl);
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobsListEl.innerHTML = `<p class="error">Failed to load jobs. Error: ${error.message}</p>`;
    }
  }

  await loadJobs();
})();
