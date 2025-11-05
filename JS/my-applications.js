(async function() {
  'use strict';

  const { supabase, showMessage, requireAuth, updateNavigation, escapeHtml } = window.appUtils;

  const user = await requireAuth();
  if (!user) return;

  await updateNavigation();

  const applicationsListEl = document.getElementById('applications-list');

  async function loadApplications() {
    try {
      applicationsListEl.innerHTML = '<p class="loading">Loading applications...</p>';

      // Get all applications for jobs posted by current user
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            posted_by
          ),
          users!applications_applicant_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('jobs.posted_by', user.userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!applications || applications.length === 0) {
        applicationsListEl.innerHTML = '<p class="no-data">No applications received yet.</p>';
        return;
      }

      // Get profile data for all applicants
      const applicantIds = [...new Set(applications.map(app => app.applicant_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', applicantIds);

      const profileMap = {};
      if (profiles) {
        profiles.forEach(profile => {
          profileMap[profile.user_id] = profile;
        });
      }

      applicationsListEl.innerHTML = '';

      applications.forEach(app => {
        const jobTitle = app.jobs?.title || 'Unknown Job';
        const applicantName = app.users?.full_name || 'Unknown';
        const applicantEmail = app.users?.email || '';
        const appliedDate = new Date(app.created_at).toLocaleDateString();
        const status = app.status || 'pending';

        const profile = profileMap[app.applicant_id] || {};
        const resumeUrl = profile.resume_url || app.resume_url || '';
        const coverLetter = app.cover_letter || '';
        const phone = profile.phone || '';

        const appEl = document.createElement('div');
        appEl.className = 'application-item';
        appEl.innerHTML = `
          <h4>${escapeHtml(jobTitle)}</h4>
          <div class="app-meta">
            <strong>Applicant:</strong> ${escapeHtml(applicantName)}<br>
            <strong>Email:</strong> <a href="mailto:${escapeHtml(applicantEmail)}">${escapeHtml(applicantEmail)}</a><br>
            ${phone ? `<strong>Phone:</strong> ${escapeHtml(phone)}<br>` : ''}
            ${coverLetter ? `<strong>Cover Letter:</strong> ${escapeHtml(coverLetter)}<br>` : ''}
            ${resumeUrl ? `<strong>Resume:</strong> <a href="${escapeHtml(resumeUrl)}" target="_blank" style="color:#667eea">Download PDF</a><br>` : ''}
            <strong>Applied:</strong> ${appliedDate}<br>
            <strong>Status:</strong> <span class="app-status ${status}">${status.toUpperCase()}</span>
          </div>
        `;

        applicationsListEl.appendChild(appEl);
      });
    } catch (error) {
      console.error('Error loading applications:', error);
      applicationsListEl.innerHTML = '<p class="error">Failed to load applications.</p>';
      showMessage('Error: ' + error.message, true);
    }
  }

  await loadApplications();
})();
