(async function() {
  'use strict';

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const messageEl = document.getElementById('message');
  
  // Helper function
  function showMessage(msg, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = msg;
    messageEl.className = isError ? 'message error' : 'message';
    messageEl.classList.remove('hidden');
    setTimeout(() => messageEl.classList.add('hidden'), 5000);
  }

  const profileForm = document.getElementById('profile-form');
  const resumeForm = document.getElementById('resume-form');
  const passwordForm = document.getElementById('password-form');
  const currentResumeDiv = document.getElementById('current-resume');

  // Get current user - REQUIRED
  async function getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;
      
      if (!authUser) {
        showMessage('Please login to access your account', true);
        setTimeout(() => window.location.href = 'login.html', 2000);
        return null;
      }
      
      return authUser;
    } catch (error) {
      console.error('Error getting user:', error);
      showMessage('Authentication error. Please login again.', true);
      setTimeout(() => window.location.href = 'login.html', 2000);
      return null;
    }
  }

  // Load user profile
  async function loadProfile() {
    try {
      const authUser = await getCurrentUser();
      
      if (!authUser) {
        return;
      }

      console.log('Loading profile for user:', authUser.email);

      // Get user from database
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      console.log('User profile:', userProfile, 'Error:', userError);

      // Get additional profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      console.log('Profile data:', profile, 'Error:', profileError);

      // Populate form fields with user's data
      document.getElementById('full-name').value = userProfile?.full_name || '';
      document.getElementById('email').value = authUser.email || '';
      document.getElementById('phone').value = profile?.phone || '';
      document.getElementById('bio').value = profile?.bio || '';
      document.getElementById('skills').value = profile?.skills || '';
      document.getElementById('experience').value = profile?.experience_years || 0;
      document.getElementById('linkedin').value = profile?.linkedin_url || '';
      document.getElementById('portfolio').value = profile?.portfolio_url || '';

      // Display current resume
      if (profile?.resume_url) {
        currentResumeDiv.innerHTML = `
          <p><strong>Current Resume:</strong> <a href="${profile.resume_url}" target="_blank" style="color:#667eea">Download PDF</a></p>
        `;
      } else {
        currentResumeDiv.innerHTML = '<p style="color:#999">No resume uploaded yet</p>';
      }
      
      showMessage('Profile loaded successfully!');
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('Failed to load profile: ' + error.message, true);
    }
  }

  // Update profile
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const skills = document.getElementById('skills').value.trim();
    const experience = parseInt(document.getElementById('experience').value) || 0;
    const linkedin = document.getElementById('linkedin').value.trim();
    const portfolio = document.getElementById('portfolio').value.trim();

    if (!email) {
      showMessage('Email is required', true);
      return;
    }

    try {
      const authUser = await getCurrentUser();
      
      if (authUser) {
        // Update users table
        const { error: userError } = await supabase
          .from('users')
          .update({ full_name: fullName })
          .eq('email', authUser.email);

        if (userError) throw userError;

        // Upsert profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: authUser.id,
            phone,
            bio,
            skills,
            experience_years: experience,
            linkedin_url: linkedin,
            portfolio_url: portfolio
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;
      }

      showMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('Failed to update profile: ' + error.message, true);
    }
  });

  // Upload resume
  resumeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const authUser = await getCurrentUser();
    if (!authUser) {
      showMessage('Please login to upload resume', true);
      return;
    }

    const fileInput = document.getElementById('resume-file');
    const file = fileInput.files[0];

    if (!file) {
      showMessage('Please select a file', true);
      return;
    }

    if (file.type !== 'application/pdf') {
      showMessage('Only PDF files are allowed', true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('File size must be less than 5MB', true);
      return;
    }

    try {
      const fileName = `resumes/${authUser.id}_${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-portal-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('job-portal-files')
        .getPublicUrl(fileName);

      // Update profile with resume URL
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authUser.id,
          resume_url: publicUrl
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      showMessage('Resume uploaded successfully!');
      resumeForm.reset();
      await loadProfile();
    } catch (error) {
      console.error('Error uploading resume:', error);
      showMessage('Failed to upload resume: ' + error.message, true);
    }
  });

  // Change password
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const authUser = await getCurrentUser();
    if (!authUser) {
      showMessage('Please login to change password', true);
      return;
    }

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', true);
      return;
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', true);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showMessage('Password changed successfully!');
      passwordForm.reset();
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('Failed to change password: ' + error.message, true);
    }
  });

  await loadProfile();
})();
