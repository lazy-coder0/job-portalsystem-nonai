(async function() {
  'use strict';

  const { supabase, showMessage, requireAuth, updateNavigation } = window.appUtils;

  const user = await requireAuth();
  if (!user) return;

  await updateNavigation();

  const postForm = document.getElementById('post-form');

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('job-title').value.trim();
    const companyName = document.getElementById('job-company').value.trim();
    const location = document.getElementById('job-location').value.trim();
    const description = document.getElementById('job-desc').value.trim();
    const jobType = document.getElementById('job-type').value;
    const salary = document.getElementById('job-salary').value.trim();

    try {
      // Find or create company
      let companyId;
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .eq('owner_id', user.userProfile.id)
        .single();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: companyName,
            location: location,
            owner_id: user.userProfile.id
          }])
          .select()
          .single();

        if (companyError) throw companyError;
        companyId = newCompany.id;
      }

      // Insert job
      const { error: jobError } = await supabase
        .from('jobs')
        .insert([{
          title,
          description,
          company_id: companyId,
          posted_by: user.userProfile.id,
          employment_type: jobType,
          salary_range: salary || null
        }]);

      if (jobError) throw jobError;

      showMessage('Job posted successfully! Redirecting...');
      postForm.reset();
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } catch (error) {
      console.error('Error posting job:', error);
      showMessage('Failed to post job: ' + error.message, true);
    }
  });
})();
