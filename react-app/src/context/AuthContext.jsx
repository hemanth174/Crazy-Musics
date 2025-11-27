/*
================================================================================
  AUTH CONTEXT - User Authentication State
================================================================================
  This context manages user login/logout state across the app.
  
  WHAT IT STORES:
  - User token
  - User email
  - Is logged in
================================================================================
*/

import { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  
  // ==========================================
  // STATE VARIABLES
  // ==========================================
  
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  
  // ==========================================
  // CHECK LOGIN STATUS ON START
  // ==========================================
  
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUserEmail(savedEmail);
      setIsLoggedIn(true);
    }
    
    setIsLoading(false);
  }, []);
  
  
  // ==========================================
  // AUTH FUNCTIONS
  // ==========================================
  
  // Login function
  function login(newToken, email) {
    setToken(newToken);
    setUserEmail(email);
    setIsLoggedIn(true);
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
  }
  
  // Logout function
  function logout() {
    setToken(null);
    setUserEmail(null);
    setIsLoggedIn(false);
    
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
  }
  
  // Get username from email
  function getUsername() {
    if (!userEmail) return '';
    return userEmail.split('@')[0];
  }
  
  
  // ==========================================
  // CONTEXT VALUE
  // ==========================================
  
  const value = {
    token,
    userEmail,
    isLoggedIn,
    isLoading,
    login,
    logout,
    getUsername
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
