(async function() {
  'use strict';

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const jobsListEl = document.getElementById('jobs-list');
  const searchInput = document.getElementById('search-input');
  const jobTypeFilter = document.getElementById('job-type-filter');
  const salaryFilter = document.getElementById('salary-filter');
  const locationFilter = document.getElementById('location-filter');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const resultsCount = document.getElementById('results-count');

  let allJobs = [];
  let filteredJobs = [];

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
      allJobs = jobs;
      filteredJobs = jobs;
      displayJobs(filteredJobs);
      updateResultsCount();
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobsListEl.innerHTML = `<p class="error">Failed to load jobs. Error: ${error.message}</p>`;
    }
  }

  // Display jobs
  function displayJobs(jobs) {
    if (!jobs || jobs.length === 0) {
      jobsListEl.innerHTML = '<p class="no-data">No jobs match your filters. Try adjusting your search criteria.</p>';
      return;
    }

    jobsListEl.innerHTML = '';
    
    jobs.forEach(job => {
      const postedDate = new Date(job.created_at).toLocaleDateString();

      const jobEl = document.createElement('div');
      jobEl.className = 'job-item';
      jobEl.innerHTML = `
        <h3>${job.title || 'Untitled Job'}</h3>
        <p class="job-meta"><strong>📍 Location:</strong> ${job.location || 'Not specified'}</p>
        <p class="job-meta"><strong>💼 Type:</strong> ${formatJobType(job.job_type)}</p>
        <p class="job-meta"><strong>💰 Salary:</strong> ${job.salary_range || 'Not specified'}</p>
        <p class="job-desc">${(job.description || 'No description').substring(0, 200)}...</p>
        <div class="job-footer">
          <span class="job-date">Posted: ${postedDate}</span>
          <a href="apply.html?job_id=${job.id}" class="btn-apply">Apply Now</a>
        </div>
      `;

      jobsListEl.appendChild(jobEl);
    });
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

  // Filter jobs
  function filterJobs() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const jobType = jobTypeFilter.value;
    const salaryRange = salaryFilter.value;
    const location = locationFilter.value.toLowerCase().trim();

    filteredJobs = allJobs.filter(job => {
      // Search filter
      const matchesSearch = !searchTerm || 
        (job.title && job.title.toLowerCase().includes(searchTerm)) ||
        (job.description && job.description.toLowerCase().includes(searchTerm)) ||
        (job.location && job.location.toLowerCase().includes(searchTerm));

      // Job type filter
      const matchesJobType = !jobType || job.job_type === jobType;

      // Location filter
      const matchesLocation = !location || 
        (job.location && job.location.toLowerCase().includes(location));

      // Salary filter
      let matchesSalary = true;
      if (salaryRange && job.salary_range) {
        const salaryText = job.salary_range.toLowerCase();
        const numbers = salaryText.match(/\d+/g);
        
        if (numbers && numbers.length > 0) {
          const firstNum = parseInt(numbers[0]);
          
          if (salaryRange === '0-5') {
            matchesSalary = firstNum <= 5;
          } else if (salaryRange === '5-10') {
            matchesSalary = firstNum >= 5 && firstNum <= 10;
          } else if (salaryRange === '10-15') {
            matchesSalary = firstNum >= 10 && firstNum <= 15;
          } else if (salaryRange === '15+') {
            matchesSalary = firstNum >= 15;
          }
        }
      }

      return matchesSearch && matchesJobType && matchesLocation && matchesSalary;
    });

    displayJobs(filteredJobs);
    updateResultsCount();
  }

  // Update results count
  function updateResultsCount() {
    resultsCount.textContent = `Showing ${filteredJobs.length} of ${allJobs.length} jobs`;
  }

  // Clear filters
  function clearFilters() {
    searchInput.value = '';
    jobTypeFilter.value = '';
    salaryFilter.value = '';
    locationFilter.value = '';
    filteredJobs = allJobs;
    displayJobs(filteredJobs);
    updateResultsCount();
  }

  // Event listeners
  searchInput.addEventListener('input', filterJobs);
  jobTypeFilter.addEventListener('change', filterJobs);
  salaryFilter.addEventListener('change', filterJobs);
  locationFilter.addEventListener('input', filterJobs);
  clearFiltersBtn.addEventListener('click', clearFilters);

  // Initial load
  await loadJobs();
})();
