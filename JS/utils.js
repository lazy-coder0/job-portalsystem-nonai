// Shared utilities for all pages
(function() {
  'use strict';

  // Initialize Supabase client
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase configuration missing');
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Export to window for use in other scripts
  window.appUtils = {
    supabase,
    
    showMessage(msg, isError = false, timeout = 5000) {
      const messageEl = document.getElementById('message');
      if (!messageEl) return;
      messageEl.textContent = msg;
      messageEl.className = isError ? 'message error' : 'message';
      if (timeout > 0) {
        setTimeout(() => messageEl.classList.add('hidden'), timeout);
      }
    },

    async getCurrentUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user || null;
      
      if (!authUser) return null;

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      return { authUser, userProfile };
    },

    async updateNavigation() {
      const userInfoEl = document.getElementById('user-info');
      const guestNav = document.getElementById('guest-nav');
      const userNav = document.getElementById('user-nav');
      const logoutBtn = document.getElementById('btn-logout');

      const user = await this.getCurrentUser();

      if (user && user.userProfile) {
        if (userInfoEl) {
          userInfoEl.textContent = `👤 ${user.userProfile.full_name || user.authUser.email}`;
          userInfoEl.classList.remove('hidden');
        }
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) userNav.style.display = 'block';
      } else {
        if (userInfoEl) userInfoEl.classList.add('hidden');
        if (guestNav) guestNav.style.display = 'block';
        if (userNav) userNav.style.display = 'none';
      }

      // Add logout listener
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await supabase.auth.signOut();
          this.showMessage('Logged out successfully');
          window.location.href = 'index.html';
        });
      }
    },

    async requireAuth() {
      const user = await this.getCurrentUser();
      if (!user) {
        this.showMessage('Please login to access this page', true);
        window.location.href = 'login.html';
        return null;
      }
      return user;
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };
})();
