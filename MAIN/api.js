// ============================================================================
// API REQUEST UTILITY - Central API communication module
// ============================================================================
// This module provides a centralized way to make HTTP requests to the backend
// Handles authentication tokens, request formatting, and error handling
// ============================================================================

// ========== API Configuration ==========
// Base URL for all API requests
const API_URL = 'https://crazy-musics-1.onrender.com';

// ========== API Request Function ==========
// Makes authenticated HTTP requests to the backend server
// Automatically includes JWT token from localStorage if available
// 
// @param {string} endpoint - API endpoint path (e.g., '/login', '/users')
// @param {string} method - HTTP method ('GET', 'POST', 'PUT', 'DELETE')
// @param {object} body - Request body data (will be JSON stringified)
// @returns {Promise<object>} - Parsed JSON response from server
async function apiRequest(endpoint, method, body = null) {
    // Build request options
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Add request body if provided
    if (body) {
        options.body = JSON.stringify(body);
    }

    // Include authentication token if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        // Make the HTTP request
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        
        // Check for HTTP errors
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        // Log and re-throw error for caller to handle
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// ========== Export Module ==========
export default apiRequest;
