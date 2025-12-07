// Admin Dashboard JavaScript
// Auto-detect environment: use localhost if available, otherwise use Render
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://crazy-musics-1.onrender.com';

// State management
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 10;
let isEditMode = false;
let editingUserId = null;

// Check authentication
const adminToken = sessionStorage.getItem('adminToken');
if (!adminToken) {
  window.location.href = './login.html';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadUsers();
  setupEventListeners();
});

// Load admin info
function loadAdminInfo() {
  const adminName = sessionStorage.getItem('adminName') || 'Admin';
  document.getElementById('adminName').textContent = adminName;
}

// Setup all event listeners
function setupEventListeners() {
  // Sidebar toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Search
  document.getElementById('searchInput').addEventListener('input', filterUsers);

  // Genre filter
  document.getElementById('filterGenre').addEventListener('change', filterUsers);

  // Add user button
  document.getElementById('addUserBtn').addEventListener('click', openAddUserModal);

  // Modal controls
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);

  // Form submission
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);

  // Delete confirmation
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

  // Close modal on outside click
  document.getElementById('userModal').addEventListener('click', (e) => {
    if (e.target.id === 'userModal') closeModal();
  });

  document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') closeDeleteModal();
  });
}

// Load users from API
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load users');
    }

    const data = await response.json();
    allUsers = data.users || [];
    filteredUsers = [...allUsers];
    
    updateStats();
    renderUsers();
    
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('Failed to load users. Please check server connection.', 'error');
  }
}

// Update statistics
function updateStats() {
  const totalUsers = allUsers.length;
  document.getElementById('totalUsers').textContent = totalUsers;

  // Calculate new users this month
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const newUsers = allUsers.filter(user => {
    const createdAt = new Date(user.createdAt);
    return createdAt.getMonth() === thisMonth && createdAt.getFullYear() === thisYear;
  }).length;
  
  document.getElementById('newUsers').textContent = newUsers;

  // Calculate active users (logged in within last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = allUsers.filter(user => {
    const lastLogin = new Date(user.lastLogin || user.createdAt);
    return lastLogin >= thirtyDaysAgo;
  }).length;
  
  document.getElementById('activeUsers').textContent = activeUsers;
}

// Filter users based on search and genre
function filterUsers() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedGenre = document.getElementById('filterGenre').value;

  filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm) ||
      user.username?.toLowerCase().includes(searchTerm) ||
      user.favoriteArtist?.toLowerCase().includes(searchTerm);

    const matchesGenre = !selectedGenre || user.musicGenre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  currentPage = 1;
  renderUsers();
}

// Render users table
function renderUsers() {
  const tbody = document.getElementById('usersTableBody');
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (paginatedUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class='bx bx-user-x' style='font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;'></i>
          <p style='font-size: 16px; font-weight: 500;'>No users found</p>
          <p style='font-size: 14px; margin-top: 8px;'>Try adjusting your search or filters</p>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = paginatedUsers.map(user => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="user-avatar">
              <i class='bx bxs-user'></i>
            </div>
            <span style="font-weight: 600;">${user.fullName || 'N/A'}</span>
          </div>
        </td>
        <td>${user.username || 'N/A'}</td>
        <td>${user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</td>
        <td>
          ${user.musicGenre ? `<span class="genre-badge">${user.musicGenre}</span>` : 'N/A'}
        </td>
        <td>${user.favoriteArtist || 'N/A'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon edit" onclick="editUser('${user._id}')" title="Edit">
              <i class='bx bx-edit'></i>
            </button>
            <button class="btn-icon delete" onclick="deleteUser('${user._id}', '${user.fullName}')" title="Delete">
              <i class='bx bx-trash'></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  updatePagination();
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const pagination = document.getElementById('pagination');
  
  // Update showing info
  const startIndex = (currentPage - 1) * usersPerPage + 1;
  const endIndex = Math.min(currentPage * usersPerPage, filteredUsers.length);
  document.getElementById('showingInfo').textContent = 
    `Showing ${filteredUsers.length > 0 ? startIndex : 0}-${endIndex} of ${filteredUsers.length} users`;

  // Generate pagination buttons
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let paginationHTML = '';
  
  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})"><i class='bx bx-chevron-left'></i></button>`;
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += `<span style="padding: 0 8px; color: var(--text-secondary);">...</span>`;
    }
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})"><i class='bx bx-chevron-right'></i></button>`;
  }

  pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
  currentPage = page;
  renderUsers();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make changePage accessible globally for inline onclick handlers
window.changePage = changePage;

// Open add user modal
function openAddUserModal() {
  isEditMode = false;
  editingUserId = null;
  document.getElementById('modalTitle').textContent = 'Add New User';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('password').required = true;
  document.getElementById('modalError').textContent = '';
  document.getElementById('userModal').classList.add('active');
}

// Edit user
async function editUser(userId) {
  isEditMode = true;
  editingUserId = userId;
  
  const user = allUsers.find(u => u._id === userId);
  if (!user) return;

  document.getElementById('modalTitle').textContent = 'Edit User';
  document.getElementById('userId').value = userId;
  document.getElementById('fullName').value = user.fullName || '';
  document.getElementById('email').value = user.username || '';
  document.getElementById('password').value = '';
  document.getElementById('password').required = false;
  document.getElementById('dob').value = user.dob ? user.dob.split('T')[0] : '';
  document.getElementById('musicGenre').value = user.musicGenre || '';
  document.getElementById('favoriteArtist').value = user.favoriteArtist || '';
  document.getElementById('modalError').textContent = '';
  
  document.getElementById('userModal').classList.add('active');
}

// Make editUser accessible globally
window.editUser = editUser;

// Close modal
function closeModal() {
  document.getElementById('userModal').classList.remove('active');
  document.getElementById('userForm').reset();
  document.getElementById('modalError').textContent = '';
}

// Handle user form submission
async function handleUserSubmit(e) {
  e.preventDefault();
  
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const dob = document.getElementById('dob').value;
  const musicGenre = document.getElementById('musicGenre').value;
  const favoriteArtist = document.getElementById('favoriteArtist').value.trim();

  // Validation
  if (!fullName || !email || (!isEditMode && !password) || !dob) {
    document.getElementById('modalError').textContent = 'Please fill in all required fields';
    return;
  }

  if (!isEditMode && password.length < 6) {
    document.getElementById('modalError').textContent = 'Password must be at least 6 characters';
    return;
  }

  const userData = {
    fullName,
    username: email,
    dob,
    musicGenre,
    favoriteArtist
  };

  if (password) {
    userData.password = password;
  }

  try {
    let response;
    
    if (isEditMode) {
      // Update existing user
      response = await fetch(`${API_BASE_URL}/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(userData)
      });
    } else {
      // Create new user
      response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
    }

    const data = await response.json();

    if (response.ok) {
      showToast(isEditMode ? 'User updated successfully' : 'User created successfully', 'success');
      closeModal();
      loadUsers();
    } else {
      document.getElementById('modalError').textContent = data.message || 'An error occurred';
    }
  } catch (error) {
    console.error('Error saving user:', error);
    document.getElementById('modalError').textContent = 'Failed to save user. Please try again.';
  }
}

// Delete user
function deleteUser(userId, userName) {
  editingUserId = userId;
  document.getElementById('deleteUserName').textContent = userName;
  document.getElementById('deleteModal').classList.add('active');
}

// Make deleteUser accessible globally
window.deleteUser = deleteUser;

// Close delete modal
function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
  editingUserId = null;
}

// Confirm delete
async function confirmDelete() {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${editingUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.ok) {
      showToast('User deleted successfully', 'success');
      closeDeleteModal();
      loadUsers();
    } else {
      const data = await response.json();
      showToast(data.message || 'Failed to delete user', 'error');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast('Failed to delete user. Please try again.', 'error');
  }
}

// Logout
function logout() {
  sessionStorage.clear();
  window.location.href = './login.html';
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
