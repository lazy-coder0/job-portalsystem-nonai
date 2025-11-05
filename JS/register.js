(async function() {
  'use strict';

  const { supabase, showMessage } = window.appUtils;

  const registerForm = document.getElementById('register-form');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      // Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          email,
          full_name: fullName,
          role: 'user'
        }]);

      if (userError) throw userError;

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: authData.user.id,
          phone: phone || null,
          bio: '',
          skills: '',
          experience_years: 0
        }]);

      if (profileError) throw profileError;

      showMessage('Registration successful! Redirecting to login...', false, 3000);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('Registration failed: ' + error.message, true);
    }
  });
})();
