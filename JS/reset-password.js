(async function() {
  'use strict';

  const { supabase, showMessage } = window.appUtils;

  const resetForm = document.getElementById('reset-form');
  const resetEmailInput = document.getElementById('reset-email');

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      
      if (error) throw error;
      
      showMessage('Password reset link sent! Check your email.', false, 8000);
      resetForm.reset();
    } catch (error) {
      console.error('Password reset error:', error);
      showMessage('Failed to send reset link: ' + error.message, true);
    }
  });
})();
