/*
================================================================================
  LOGIN PAGE
================================================================================
  User login form with email and password.
================================================================================
*/

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home');
    }
  }, [isLoggedIn, navigate]);
  
  // Show toast message
  function showToast(message, type = 'info') {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  }
  
  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate
    if (!email || !password) {
      setError('⚠️ All fields are required');
      showToast('All inputs are required', 'error');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('⚠️ Please enter a valid email address');
      showToast('Invalid email format', 'error');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const data = await loginUser(email, password);
      
      // Save login
      login(data.token, data.email);
      
      showToast('Login Successful! 🎉 Redirecting...', 'success');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/home');
      }, 1500);
      
    } catch (err) {
      if (err.message.includes('not found')) {
        setError('❌ Account not found. Please sign up first.');
        showToast('Account not found', 'error');
      } else if (err.message.includes('password') || err.message.includes('Incorrect')) {
        setError('❌ Incorrect password. Please try again.');
        showToast('Wrong password', 'error');
      } else {
        setError('⚠️ ' + err.message);
        showToast(err.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  // Go back to home
  function goBack() {
    navigate('/');
  }
  
  return (
    <div className="login-page">
      {/* Back Button */}
      <div className="back-button" onClick={goBack}>
        <span>← Back to Main</span>
      </div>
      
      {/* Login Form */}
      <div className="wrapper">
        <div className="login-box">
          {/* Header */}
          <div className="login-header">
            <img src="/logo.png" alt="Logo" className="login-logo" />
            <span>Login</span>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="input-box">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="input-field"
              />
              <label htmlFor="email" className="label">Email</label>
              <i className="icon">📧</i>
            </div>
            
            {/* Password Input */}
            <div className="input-box">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="input-field"
              />
              <label htmlFor="password" className="label">Password</label>
              <i className="icon">🔒</i>
              <span 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            
            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}
            
            {/* Remember Me & Forgot Password */}
            <div className="remember-forgot">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">Remember me</label>
              </div>
              <div className="forgot">
                <a href="#">Forgot password?</a>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="input-box">
              <button 
                type="submit" 
                className="input-submit"
                disabled={!rememberMe || isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
          
          {/* Trust Text */}
          <div className="trust-text">
            🔒 Your details are safe with us
          </div>
          
          {/* Divider */}
          <div className="divider">
            <span>or</span>
          </div>
          
          {/* Social Login */}
          <div className="social-login">
            <button className="social-btn google-btn" onClick={() => showToast('Google Sign-In coming soon! 🎵', 'info')}>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
              </svg>
              Continue with Google
            </button>
            <button className="social-btn apple-btn" onClick={() => showToast('Apple Sign-In coming soon! 🎵', 'info')}>
              🍎 Continue with Apple
            </button>
          </div>
          
          {/* Register Link */}
          <div className="register">
            <span>Don't have an account? <Link to="/register">Register</Link></span>
          </div>
        </div>
      </div>
      
      {/* Toast */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Login;
