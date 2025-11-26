"use client";

import React, { useState, useEffect, useCallback } from 'react';
import apiRequest from '../api';
import { User, Lock, Music, Apple, LogOut } from 'lucide-react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('global hits');
  const [songs, setSongs] = useState([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);
  const [spotifyError, setSpotifyError] = useState('');
  const [activeQuery, setActiveQuery] = useState('global hits');

  useEffect(() => {
    checkAuth();
  }, []);

  const fetchSongs = useCallback(async (query) => {
    const normalizedQuery = (query || '').trim();
    if (!normalizedQuery) {
      setSpotifyError('Type a song, artist, or vibe to search');
      return;
    }

    try {
      setIsSearchingSongs(true);
      setSpotifyError('');
      const endpoint = `/api/search?q=${encodeURIComponent(normalizedQuery)}`;
      const data = await apiRequest(endpoint, 'GET');
      const items = data?.tracks?.items ?? [];
      setSongs(items);
      setActiveQuery(normalizedQuery);
    } catch (error) {
      setSpotifyError(error.message || 'Unable to reach Spotify right now');
      setSongs([]);
    } finally {
      setIsSearchingSongs(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs('global hits');
  }, [fetchSongs]);

  const songSection = (
    <div className="relative z-10 w-full max-w-5xl px-6">
      <div
        className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8"
        style={{ boxShadow: '0 8px 32px rgba(8, 16, 44, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.08)' }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.45em] text-cyan-300">LIVE FROM SPOTIFY</p>
            <h3 className="text-2xl md:text-3xl font-bold text-white mt-2">Vibe Explorer</h3>
            <p className="text-white/60 text-sm mt-1">
              Showing results for <span className="text-white font-semibold">{activeQuery}</span>
            </p>
          </div>
          <div className="text-white/60 text-sm">
            <span className="hidden md:inline">Powered by Spotify Search API</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchSongs(searchQuery);
                }
              }}
              placeholder="Search by song, artist, or mood"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchSongs(searchQuery)}
            disabled={isSearchingSongs}
            className="px-6 py-4 rounded-2xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
              boxShadow: '0 4px 18px rgba(6, 182, 212, 0.35)'
            }}
          >
            {isSearchingSongs ? 'Fetching vibes…' : 'Fetch songs'}
          </button>
        </div>

        {spotifyError && (
          <p className="text-red-300 text-sm mt-4">{spotifyError}</p>
        )}

        {!spotifyError && isSearchingSongs && (
          <p className="text-white/70 text-sm mt-4">Grabbing the freshest tracks for you…</p>
        )}

        {!spotifyError && !isSearchingSongs && songs.length === 0 && (
          <p className="text-white/70 text-sm mt-4">No tracks yet. Try another vibe.</p>
        )}

        <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3">
          {songs.slice(0, 9).map((track) => {
            const cover =
              track?.album?.images?.[1]?.url ||
              track?.album?.images?.[0]?.url ||
              'https://placehold.co/200x200/0f172a/ffffff?text=%E2%99%AB';
            const artists = track?.artists?.map((artist) => artist.name).join(', ');
            return (
              <div
                key={track.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:border-cyan-400/40 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                    <img src={cover} alt={track.name} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 to-transparent" />
                  </div>
                  <div>
                    <p className="text-white font-semibold leading-snug">{track.name}</p>
                    <p className="text-white/60 text-sm">{artists}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{track?.album?.release_date?.slice(0, 4) || '----'}</span>
                  <div className="flex items-center gap-3">
                    {track.preview_url && (
                      <a
                        href={track.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200"
                      >
                        Preview
                      </a>
                    )}
                    {track?.external_urls?.spotify && (
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-300 hover:text-pink-200 font-semibold"
                      >
                        Open in Spotify
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const navigateToMusicApp = () => {
    window.location.href = '/MusicApp';
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // You might need a /me or /verify endpoint on your server
        // For now, we'll just assume the token is valid if it exists
        setIsAuthenticated(true);
        // You could also decode the token to get user info if not fetching from a /me endpoint
      } catch (error) {
        setIsAuthenticated(false);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await apiRequest('/login', 'POST', { email: username, pass: password });
      localStorage.setItem('token', data.token);
      checkAuth();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      await apiRequest('/signup', 'POST', { username, password, dob: '2000-01-01' }); // Assuming a default DOB for now
      // Optionally, automatically log in the user after signup
      const data = await apiRequest('/login', 'POST', { email: username, pass: password });
      localStorage.setItem('token', data.token);
      checkAuth();
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      apiRequest('/me')
        .then(setUser)
        .catch(() => {
          handleLogout();
        });
    }
  }, [isAuthenticated]);

  // If user is logged in, show welcome screen
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen w-full overflow-hidden relative flex flex-col items-center justify-center gap-10 py-16 px-4">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 animate-pulse"></div>
          </div>
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* Welcome Card */}
        <div className="relative z-10 w-full max-w-md px-6">
          <div 
            className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10 text-center"
            style={{
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <h1 className="text-4xl font-bold text-white">Crazy</h1>
              <Music className="w-8 h-8 text-cyan-400 animate-pulse" />
              <h1 className="text-4xl font-bold text-white">Musics</h1>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">Welcome Back!</h2>
            <p className="text-cyan-300 text-lg mb-2">{user.full_name || user.email}</p>
            <p className="text-white/60 text-sm mb-8">You're logged into the madness</p>

            <div className="space-y-3">
              <button
                onClick={navigateToMusicApp}
                className="w-full py-4 rounded-xl font-bold text-lg text-white tracking-wider relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                style={{
                  background: 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                }}
              >
                <Music className="w-6 h-6" />
                <span>ENTER THE MUSIC APP</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl font-medium text-base text-white tracking-wide backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <LogOut className="w-5 h-5" />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>
        </div>

        {songSection}

        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
              opacity: 0.4;
            }
            50% {
              transform: translateY(-20px) translateX(10px);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-hidden relative flex items-center justify-center">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 animate-pulse"></div>
        </div>
      </div>

      {/* Animated Wave Visualizations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top wave */}
        <div className="absolute top-20 left-0 w-full h-64 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
            <path 
              d="M0,100 Q300,50 600,100 T1200,100 L1200,200 L0,200 Z" 
              fill="url(#gradient1)"
              className="animate-wave"
            >
              <animate
                attributeName="d"
                dur="8s"
                repeatCount="indefinite"
                values="M0,100 Q300,50 600,100 T1200,100 L1200,200 L0,200 Z;
                        M0,100 Q300,150 600,100 T1200,100 L1200,200 L0,200 Z;
                        M0,100 Q300,50 600,100 T1200,100 L1200,200 L0,200 Z"
              />
            </path>
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 w-full h-64 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
            <path 
              d="M0,100 Q300,150 600,100 T1200,100 L1200,0 L0,0 Z" 
              fill="url(#gradient2)"
            >
              <animate
                attributeName="d"
                dur="6s"
                repeatCount="indefinite"
                values="M0,100 Q300,150 600,100 T1200,100 L1200,0 L0,0 Z;
                        M0,100 Q300,50 600,100 T1200,100 L1200,0 L0,0 Z;
                        M0,100 Q300,150 600,100 T1200,100 L1200,0 L0,0 Z"
              />
            </path>
            <defs>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Equalizer bars - left side */}
        <div className="absolute left-8 bottom-20 flex items-end gap-1 h-40 opacity-60">
          {[...Array(20)].map((_, i) => (
            <div
              key={`left-${i}`}
              className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-500 rounded-t"
              style={{
                height: `${Math.random() * 100}%`,
                animation: `pulse ${0.5 + Math.random() * 1}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        {/* Equalizer bars - right side */}
        <div className="absolute right-8 bottom-20 flex items-end gap-1 h-40 opacity-60">
          {[...Array(20)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="w-1.5 bg-gradient-to-t from-pink-500 to-purple-500 rounded-t"
              style={{
                height: `${Math.random() * 100}%`,
                animation: `pulse ${0.5 + Math.random() * 1}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div 
          className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-4xl font-bold text-white">
                Crazy
              </h1>
              <Music className="w-8 h-8 text-cyan-400 animate-pulse" />
              <h1 className="text-4xl font-bold text-white">
                Musics
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              WELCOME BACK!
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <User className="w-5 h-5 text-cyan-300" />
              </div>
              <input
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-12 py-3.5 bg-white/5 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Lock className="w-5 h-5 text-cyan-300" />
              </div>
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-12 py-3.5 bg-white/5 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg text-white tracking-wider relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
                backgroundSize: '200% 100%',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
              }}
            >
              <span className="relative z-10">
                {isLoading ? 'LOGGING IN...' : 'LOGIN TO THE MADNESS'}
              </span>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundSize: '200% 100%' }}
              />
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors underline-offset-2 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          {/* Social Login Options */}
          <div className="space-y-4">
            <p className="text-center text-white/80 text-sm mb-4">
              Don't have an account?
            </p>
            
            <div className="flex gap-3">
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="flex-1 py-3 px-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-white font-medium">Google</span>
              </button>

              {/* Apple Login */}
              <button
                onClick={handleAppleLogin}
                type="button"
                className="flex-1 py-3 px-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <Apple className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Apple</span>
              </button>

              {/* Sign Up Button */}
              <button
                onClick={handleSignUp}
                type="button"
                className="px-6 py-3 backdrop-blur-md bg-cyan-500/20 border border-cyan-400/30 rounded-xl hover:bg-cyan-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group"
                style={{
                  boxShadow: '0 2px 8px rgba(6, 182, 212, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <span className="text-cyan-300 font-bold uppercase tracking-wide">Sign Up</span>
              </button>
            </div>
          </div>

          {/* Decorative Glow Effects */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }

        @keyframes pulse {
          0% {
            opacity: 0.3;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}