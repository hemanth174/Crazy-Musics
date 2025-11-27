/*
================================================================================
  NAVBAR COMPONENT
================================================================================
  The navigation bar at the top of every page.
  Shows: Logo, Navigation Links, User Info, Login/Logout
================================================================================
*/

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

function Navbar() {
  // Get current page location
  const location = useLocation();
  
  // Get auth state
  const { isLoggedIn, getUsername, logout } = useAuth();
  
  // Check if a link is active
  function isActive(path) {
    return location.pathname === path ? 'active' : '';
  }
  
  // Handle logout click
  function handleLogout(e) {
    e.preventDefault();
    logout();
  }
  
  return (
    <header className="navbar">
      {/* Logo */}
      <div className="logo">
        <img src="/APPlogo.png" alt="Logo" className="logo-img" />
        <span>Crazy Musics</span>
      </div>
      
      {/* Navigation Links */}
      <nav className="nav-links">
        <Link to="/home" className={isActive('/home')}>Home</Link>
        <Link to="/" className={isActive('/')}>Landing</Link>
        
        {/* Show user info if logged in */}
        {isLoggedIn && (
          <span className="user-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="username">{getUsername()}</span>
          </span>
        )}
        
        {/* Logout button (if logged in) */}
        {isLoggedIn && (
          <a href="#" onClick={handleLogout} className="logout-btn">Logout</a>
        )}
        
        {/* Login button (if not logged in) */}
        {!isLoggedIn && (
          <Link to="/login" className="login-btn">Login</Link>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
