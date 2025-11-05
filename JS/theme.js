// Theme Toggle Functionality
(function() {
  'use strict';

  // Check for saved theme preference or default to 'light'
  const currentTheme = localStorage.getItem('theme') || 'light';
  
  // Apply theme on page load
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  // Update toggle button icon
  function updateToggleButton() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    if (document.body.classList.contains('dark-theme')) {
      themeToggle.textContent = '☀️';
      themeToggle.title = 'Switch to Light Mode';
    } else {
      themeToggle.textContent = '🌙';
      themeToggle.title = 'Switch to Dark Mode';
    }
  }

  // Initialize button on page load
  updateToggleButton();

  // Theme toggle function
  window.toggleTheme = function() {
    document.body.classList.toggle('dark-theme');
    
    // Save preference
    if (document.body.classList.contains('dark-theme')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
    
    updateToggleButton();
  };

  // Add event listener when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', window.toggleTheme);
    }
  });
})();
