// Common functionality shared across admin pages

// Sidebar Toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

if (menuToggle && sidebar) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    }
  });
}

// Load Admin Info
function loadAdminInfo() {
  const adminName = sessionStorage.getItem('adminName') || 'Admin';
  const adminNameElement = document.getElementById('adminName');
  
  if (adminNameElement) {
    adminNameElement.textContent = adminName;
  }
}

// Logout Function
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// Toast Notification System
function showToast(message, type = 'success') {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon based on type
  let icon = 'bx-check-circle';
  if (type === 'error') icon = 'bx-error-circle';
  if (type === 'warning') icon = 'bx-error';
  if (type === 'info') icon = 'bx-info-circle';
  
  toast.innerHTML = `
    <i class='bx ${icon}'></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Show toast with animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Authentication Check
function checkAuth() {
  const adminToken = sessionStorage.getItem('adminToken');
  if (!adminToken) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Initialize common functionality on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  checkAuth();
  
  // Load admin info
  loadAdminInfo();
  
  // Set active nav item based on current page
  setActiveNav();
});

// Set Active Navigation Item
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-link, .settings-nav-item');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

// Format Number with Commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format Date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Confirm Dialog
function confirmAction(message) {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
}

// Loading Spinner
function showLoading(element) {
  if (element) {
    element.innerHTML = `
      <div class="loading-spinner">
        <i class='bx bx-loader-alt bx-spin'></i>
        <span>Loading...</span>
      </div>
    `;
  }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast,
    checkAuth,
    loadAdminInfo,
    logout,
    formatNumber,
    formatDate,
    confirmAction,
    showLoading
  };
}
