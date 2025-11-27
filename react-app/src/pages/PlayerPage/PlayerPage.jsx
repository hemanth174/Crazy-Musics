/*
================================================================================
  PLAYER PAGE - Crazy Musics
================================================================================
  Full screen music player with album art carousel, controls, progress, volume.
  Matches the original player.html design exactly.
================================================================================
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { getStreamUrl, getHighQualityImage } from '../../services/api';
import './PlayerPage.css';

// Default cover image
const DEFAULT_COVER = 'https://placehold.co/400x400/0f172a/ffffff?text=Crazy+Musics';

// Format time to M:SS
function formatTime(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function PlayerPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { 
    playlist, 
    currentIndex, 
    currentSong, 
    isPlaying,
    setIsPlaying,
    nextSong,
    prevSong,
    addToHistory
  } = usePlayer();
  
  // Local state
  const [audioLoading, setAudioLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [artistDisplay, setArtistDisplay] = useState('Please wait');
  const [volumeValue, setVolumeValue] = useState(70);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // Use a ref for the Audio object instead of an HTML element
  const audioRef = useRef(null);
  const addToHistoryRef = useRef(addToHistory);
  
  // Keep ref updated
  useEffect(() => {
    addToHistoryRef.current = addToHistory;
  }, [addToHistory]);
  
  // Redirect to login if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, authLoading, navigate]);
  
  // Redirect to home if no songs
  useEffect(() => {
    if (!authLoading && playlist.length === 0) {
      navigate('/home');
    }
  }, [playlist.length, authLoading, navigate]);
  
  // Create and manage audio when song changes
  useEffect(() => {
    if (!currentSong?.id) return;
    
    // Stop and cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    setAudioLoading(true);
    setArtistDisplay('Loading...');
    setCurrentTime(0);
    setDuration(0);
    
    // Get stream URL
    const url = getStreamUrl(currentSong.id);
    console.log('Loading audio from:', url);
    
    // Create new Audio object (like original player.js does)
    const audio = new Audio(url);
    audio.volume = volumeValue / 100;
    audioRef.current = audio;
    
    // Event handlers
    const handleLoadedMetadata = () => {
      const songLength = audio.duration || parseInt(currentSong?.duration) || 180;
      setDuration(songLength);
      setArtistDisplay(currentSong?.artists || 'Unknown Artist');
      console.log('Audio loaded, duration:', songLength);
    };
    
    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const handleEnded = () => {
      if (currentIndex < playlist.length - 1) {
        nextSong();
      } else {
        setIsPlaying(false);
      }
    };
    
    const handleCanPlay = () => {
      setAudioLoading(false);
      console.log('Audio can play now');
    };
    
    const handleError = (e) => {
      console.error('Audio error:', e);
      setArtistDisplay('Failed to load - trying next...');
      setAudioLoading(false);
      if (currentIndex < playlist.length - 1) {
        setTimeout(() => nextSong(), 2000);
      }
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    
    // Add to history
    if (addToHistoryRef.current) {
      addToHistoryRef.current(currentSong);
    }
    
    // Cleanup function
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [currentSong?.id]); // Only depend on song ID changing
  
  // Sync audio play/pause with isPlaying state - this is the main controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    console.log('Play state changed:', isPlaying);
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Play error:', error);
          if (error.name === 'NotAllowedError') {
            setArtistDisplay('Click play to start');
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);
  
  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 100;
    }
  }, [volumeValue]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevSong();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextSong();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, prevSong, nextSong]);
  
  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Play failed:', err));
    }
  }, [isPlaying, setIsPlaying]);
  
  // Handle progress slider - while dragging
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    setIsSeeking(true);
  };
  
  // Handle progress slider - when released (seek to position)
  const handleProgressSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setIsSeeking(false);
  };
  
  // Handle clicking on progress bar directly
  const handleProgressBarClick = (e) => {
    if (!audioRef.current || !duration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    setVolumeValue(parseFloat(e.target.value));
  };
  
  // No song selected state
  if (!currentSong) {
    return (
      <div className="player-page-container">
        <div className="player-container">
          <Link to="/home" className="back-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to Home</span>
          </Link>
          <div className="no-song-message">
            <h2>No song selected</h2>
            <p>Go back and pick a track to play!</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Get cover images
  const currentCover = getHighQualityImage(currentSong?.cover || currentSong?.image) || DEFAULT_COVER;
  const prevCover = currentIndex > 0 
    ? getHighQualityImage(playlist[currentIndex - 1]?.cover || playlist[currentIndex - 1]?.image) || DEFAULT_COVER
    : DEFAULT_COVER;
  const nextCover = currentIndex < playlist.length - 1
    ? getHighQualityImage(playlist[currentIndex + 1]?.cover || playlist[currentIndex + 1]?.image) || DEFAULT_COVER
    : DEFAULT_COVER;
  
  const songName = currentSong?.name || currentSong?.title || 'Loading...';
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="player-page-container">
      {/* Particles Background */}
      <div id="particles-container"></div>
      
      <div className="player-container">
        {/* Back Button */}
        <Link to="/home" className="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back to Home</span>
        </Link>
        
        {/* Album Art Carousel */}
        <div className="carousel-section">
          <button className="carousel-arrow left" onClick={prevSong} disabled={currentIndex === 0}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          
          <div className="album-carousel">
            <div className="album-art prev">
              <img src={prevCover} alt="Previous track" />
            </div>
            <div className="album-art current">
              <img src={currentCover} alt="Current track" />
              <div className="now-playing-badge">NOW PLAYING</div>
            </div>
            <div className="album-art next">
              <img src={nextCover} alt="Next track" />
            </div>
          </div>
          
          <button className="carousel-arrow right" onClick={nextSong} disabled={currentIndex === playlist.length - 1}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
        
        {/* Track Info */}
        <div className="track-info">
          <h1 id="trackName">{songName}</h1>
          <p id="artistName">{artistDisplay}</p>
        </div>
        
        {/* Player Controls (Fixed Bottom) */}
        <div className="player-controls">
          {/* Progress Section */}
          <div className="progress-section">
            <span className="time" id="currentTime">{formatTime(currentTime)}</span>
            <div className="progress-bar" onClick={handleProgressBarClick}>
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              <input 
                type="range" 
                className="progress-slider" 
                min="0" 
                max={duration || 100} 
                step="0.1"
                value={currentTime}
                onChange={handleProgressChange}
                onMouseUp={handleProgressSeek}
                onTouchEnd={handleProgressSeek}
              />
            </div>
            <span className="time" id="duration">{formatTime(duration)}</span>
          </div>
          
          {/* Controls Buttons */}
          <div className="controls-buttons">
            <button className="control-btn" onClick={prevSong} title="Previous track">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button 
              className={`control-btn play-pause ${audioLoading ? 'loading' : ''}`} 
              onClick={togglePlayPause} 
              title="Play/Pause"
            >
              {audioLoading ? (
                <div className="loading-spinner"></div>
              ) : isPlaying ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" id="pauseIcon">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" id="playIcon">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <button className="control-btn" onClick={nextSong} title="Next track">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>
          
          {/* Volume Section */}
          <div className="volume-section">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input 
              type="range" 
              className="volume-slider" 
              min="0" 
              max="100" 
              value={volumeValue}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerPage;
