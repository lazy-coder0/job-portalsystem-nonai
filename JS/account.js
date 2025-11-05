(async function() {
  'use strict';

  const { supabase, showMessage, requireAuth, updateNavigation } = window.appUtils;

  const user = await requireAuth();
  if (!user) return;

  await updateNavigation();

  const profileForm = document.getElementById('profile-form');
  const resumeForm = document.getElementById('resume-form');
  const passwordForm = document.getElementById('password-form');
  const currentResumeDiv = document.getElementById('current-resume');

  // Load user profile
  async function loadProfile() {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Populate form fields
      document.getElementById('full-name').value = user.userProfile.full_name || '';
      document.getElementById('email').value = user.userProfile.email || '';
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
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('Failed to load profile', true);
    }
  }

  // Update profile
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('full-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const skills = document.getElementById('skills').value.trim();
    const experience = parseInt(document.getElementById('experience').value) || 0;
    const linkedin = document.getElementById('linkedin').value.trim();
    const portfolio = document.getElementById('portfolio').value.trim();

    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('email', user.authUser.email);

      if (userError) throw userError;

      // Upsert profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.authUser.id,
          phone,
          bio,
          skills,
          experience_years: experience,
          linkedin_url: linkedin,
          portfolio_url: portfolio
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      showMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('Failed to update profile: ' + error.message, true);
    }
  });

  // Upload resume
  resumeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

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
      const fileName = `resumes/${user.authUser.id}_${Date.now()}_${file.name}`;
      
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
          user_id: user.authUser.id,
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
