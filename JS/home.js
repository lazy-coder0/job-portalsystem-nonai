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
  const jobsCountBadge = document.getElementById('jobs-count');

  let allJobs = [];
  let filteredJobs = [];

  // Section switching
  window.showSection = function(section) {
    const heroSection = document.querySelector('.hero-section');
    const featuresGrid = document.querySelector('.features-grid');
    const jobsArea = document.getElementById('jobs-area');

    if (section === 'jobs') {
      heroSection.classList.add('hidden');
      featuresGrid.classList.add('hidden');
      jobsArea.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      heroSection.classList.remove('hidden');
      featuresGrid.classList.remove('hidden');
      jobsArea.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Close drawer after navigation
    if (window.toggleDrawer) {
      const drawer = document.getElementById('side-drawer');
      if (drawer && drawer.classList.contains('active')) {
        window.toggleDrawer();
      }
    }
  };

  // Toggle drawer function
  window.toggleDrawer = function() {
    const drawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('drawer-overlay');
    
    if (drawer) drawer.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
  };

  // Load and display jobs
  async function loadJobs() {
    try {
      console.log('Starting to load jobs...');
      console.log('Supabase URL:', SUPABASE_URL);
      
      if (!jobsListEl) {
        console.error('jobs-list element not found!');
        return;
      }
      
      console.log('Querying Supabase...');
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Query result:', { jobs, error });

      if (error) {
        console.error('Supabase error:', error);
        jobsListEl.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        if (jobsCountBadge) jobsCountBadge.textContent = 'Error loading';
        const drawerBadge = document.getElementById('drawer-jobs-count');
        if (drawerBadge) drawerBadge.textContent = '!';
        return;
      }

      if (!jobs || jobs.length === 0) {
        console.warn('No jobs found in database');
        jobsListEl.innerHTML = '<p class="no-data">No jobs available yet. Check back soon!</p>';
        if (jobsCountBadge) jobsCountBadge.textContent = '0 Jobs Available';
        const drawerBadge = document.getElementById('drawer-jobs-count');
        if (drawerBadge) drawerBadge.textContent = '0';
        return;
      }

      console.log(`Found ${jobs.length} jobs`);
      allJobs = jobs;
      filteredJobs = jobs;
      displayJobs(filteredJobs);
      updateResultsCount();
      if (jobsCountBadge) jobsCountBadge.textContent = `${jobs.length} Jobs Available`;
      
      // Update drawer badge
      const drawerJobsCount = document.getElementById('drawer-jobs-count');
      if (drawerJobsCount) {
        drawerJobsCount.textContent = jobs.length;
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      if (jobsListEl) jobsListEl.innerHTML = `<p class="error">Failed to load jobs. Error: ${error.message}</p>`;
      if (jobsCountBadge) jobsCountBadge.textContent = 'Error loading';
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
  if (searchInput) searchInput.addEventListener('input', filterJobs);
  if (jobTypeFilter) jobTypeFilter.addEventListener('change', filterJobs);
  if (salaryFilter) salaryFilter.addEventListener('change', filterJobs);
  if (locationFilter) locationFilter.addEventListener('input', filterJobs);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);

  // Initial load
  await loadJobs();
})();
