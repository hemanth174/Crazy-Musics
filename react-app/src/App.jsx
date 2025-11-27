/*
================================================================================
  APP.JSX - Main Application Component
================================================================================
  Sets up React Router and wraps the app with Context Providers
================================================================================
*/

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider } from './context/AuthContext';

// Pages
import Landing from './pages/Landing/Landing';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import PlayerPage from './pages/PlayerPage/PlayerPage';

// Global styles
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <Routes>
            {/* Landing Page - First page visitors see */}
            <Route path="/" element={<Landing />} />
            
            {/* Main App Routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/player" element={<PlayerPage />} />
            
            {/* Fallback - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
