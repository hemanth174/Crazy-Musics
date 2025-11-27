/*
================================================================================
  API SERVICE - All API calls to the backend
================================================================================
  This file contains all the functions to communicate with the server.
  
  ENDPOINTS:
  - /login - User login
  - /signup - User registration
  - /api/saavn/search - Search for songs
  - /api/saavn/song - Get song details
  - /api/saavn/stream/:id - Stream audio
================================================================================
*/

// Base URL for API calls
const API_BASE_URL = 'https://crazy-musics-1.onrender.com';

// ==========================================
// AUTH API CALLS
// ==========================================

// Login user
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      pass: password
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  
  return data;
}

// Register new user
export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  
  return data;
}


// ==========================================
// MUSIC API CALLS
// ==========================================

// Search for songs
export async function searchSongs(query) {
  const response = await fetch(`${API_BASE_URL}/api/saavn/search?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error('Search failed: ' + response.status);
  }
  
  const data = await response.json();
  return data.songs || data || [];
}

// Get song details
export async function getSongDetails(songId) {
  const response = await fetch(`${API_BASE_URL}/api/saavn/song?id=${songId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get song details');
  }
  
  return await response.json();
}

// Get audio stream URL
export function getStreamUrl(songId) {
  return `${API_BASE_URL}/api/saavn/stream/${songId}`;
}


// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Format duration from seconds to M:SS
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Get high quality image URL
export function getHighQualityImage(imageUrl) {
  if (!imageUrl) return 'https://placehold.co/400x400/0f172a/ffffff?text=Crazy+Musics';
  return imageUrl.replace('150x150', '500x500');
}

export default {
  loginUser,
  registerUser,
  searchSongs,
  getSongDetails,
  getStreamUrl,
  formatDuration,
  getHighQualityImage
};
