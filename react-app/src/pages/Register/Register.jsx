/*
================================================================================
  REGISTER PAGE
================================================================================
  User registration form with full name, email, password, DOB, preferences.
================================================================================
*/

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/api';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    musicGenre: '',
    favoriteArtist: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  
  // Handle input change
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }
  
  // Validate password
  function validatePassword(password) {
    if (password.length < 10) {
      return 'Password must be at least 10 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  }
  
  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();
    
    const { fullName, email, password, confirmPassword, dob } = formData;
    
    // Validate required fields
    if (!fullName || !email || !password || !confirmPassword || !dob) {
      showToast('All required fields must be filled ⚠️', 'error');
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address ⚠️', 'error');
      return;
    }
    
    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      showToast(passwordError + ' ⚠️', 'error');
      return;
    }
    
    // Check password match
    if (password !== confirmPassword) {
      showToast('Passwords do not match ⚠️', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        dob: formData.dob,
        musicGenre: formData.musicGenre || null,
        favoriteArtist: formData.favoriteArtist || null
      });
      
      showToast('Account Created Successfully 🎉 Welcome to Crazy-Musics!', 'success');
      
      // Redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (err) {
      showToast(err.message || 'Server Error ⚠️', 'error');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Go back to home
  function goBack() {
    navigate('/');
  }
  
  return (
    <div className="register-page">
      {/* Back Button */}
      <div className="back-button" onClick={goBack}>
        <span>← Back to Main</span>
      </div>
      
      {/* Register Form */}
      <div className="wrapper">
        <div className="login-box">
          {/* Header */}
          <div className="login-header">
            <span>Sign Up</span>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="input-box">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder=" "
                className="input-field"
              />
              <label className="label">Full Name</label>
              <i className="icon">👤</i>
            </div>
            
            {/* Email */}
            <div className="input-box">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder=" "
                className="input-field"
              />
              <label className="label">Email</label>
              <i className="icon">📧</i>
            </div>
            
            {/* Password */}
            <div className="input-box">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder=" "
                className="input-field"
                minLength="10"
              />
              <label className="label">Password (min 10 chars)</label>
              <span 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            
            {/* Confirm Password */}
            <div className="input-box">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder=" "
                className="input-field"
              />
              <label className="label">Confirm Password</label>
              <span 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            
            {/* Date of Birth */}
            <div className="input-box">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder=" "
                className="input-field"
              />
              <label className="label" style={{ top: '15px' }}>Date of Birth</label>
              <i className="icon">📅</i>
            </div>
            
            {/* Music Genre (Optional) */}
            <div className="input-box">
              <select
                name="musicGenre"
                value={formData.musicGenre}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select your vibe (Optional)</option>
                <option value="Pop">🎤 Pop</option>
                <option value="Hip-Hop">🎵 Hip-Hop</option>
                <option value="Lofi">🎧 Lofi</option>
                <option value="Telugu Beats">🥁 Telugu Beats</option>
                <option value="Melody">🎼 Melody</option>
                <option value="EDM">🔊 EDM</option>
                <option value="Rock">🎸 Rock</option>
                <option value="Jazz">🎺 Jazz</option>
              </select>
              <label className="label" style={{ top: '15px' }}>Favorite Music Genre</label>
              <i className="icon">🎵</i>
            </div>
            
            {/* Favorite Artist (Optional) */}
            <div className="input-box">
              <input
                type="text"
                name="favoriteArtist"
                value={formData.favoriteArtist}
                onChange={handleChange}
                placeholder=" "
                className="input-field"
              />
              <label className="label">Favorite Artist (Optional)</label>
              <i className="icon">⭐</i>
            </div>
            
            {/* Terms Checkbox */}
            <div className="remember-forgot">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label htmlFor="terms">
                  I agree to <a href="#" style={{ color: '#00bcd4' }}>Terms & Privacy Policy</a>
                </label>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="input-box">
              <button 
                type="submit" 
                className="input-submit"
                disabled={!termsAccepted || isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
          
          {/* Login Link */}
          <div className="register">
            <span>Already have an account? <Link to="/login">Login</Link></span>
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

export default Register;
