/*
================================================================================
  PLAYER CONTEXT - Global State Management
================================================================================
  This context manages the music player state across the entire app.
  
  WHAT IT STORES:
  - Current playlist (array of songs)
  - Current song index
  - Is playing or paused
  - Audio element reference
  - Volume level
  - Current time and duration
  - Listening history
================================================================================
*/

import { createContext, useContext, useState, useRef, useEffect } from 'react';

// Create the context
const PlayerContext = createContext();

// Default image for songs without cover art
const DEFAULT_IMAGE = 'https://placehold.co/400x400/0f172a/ffffff?text=Crazy+Musics';

// Provider component that wraps the app
export function PlayerProvider({ children }) {
  
  // ==========================================
  // STATE VARIABLES
  // ==========================================
  
  // Playlist and current song
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [musicSource, setMusicSource] = useState('jiosaavn');
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  
  // Audio element reference
  const audioRef = useRef(null);
  
  // Listening history
  const [history, setHistory] = useState([]);
  
  
  // ==========================================
  // LOAD SAVED STATE ON START
  // ==========================================
  
  useEffect(() => {
    // Load playlist from localStorage
    const savedPlaylist = localStorage.getItem('currentPlaylist');
    const savedIndex = localStorage.getItem('currentIndex');
    const savedSource = localStorage.getItem('musicSource');
    const savedHistory = localStorage.getItem('listenHistory');
    
    if (savedPlaylist) {
      setPlaylist(JSON.parse(savedPlaylist));
    }
    if (savedIndex) {
      setCurrentIndex(parseInt(savedIndex));
    }
    if (savedSource) {
      setMusicSource(savedSource);
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);
  
  
  // ==========================================
  // GET CURRENT SONG
  // ==========================================
  
  const currentSong = playlist[currentIndex] || null;
  
  
  // ==========================================
  // PLAYER FUNCTIONS
  // ==========================================
  
  // Play a song
  function playSong() {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem('isCurrentlyPlaying', 'true');
        })
        .catch(error => {
          console.log('Play error:', error);
          setIsPlaying(false);
        });
    }
  }
  
  // Pause the song
  function pauseSong() {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem('isCurrentlyPlaying', 'false');
    }
  }
  
  // Toggle play/pause
  function togglePlayPause() {
    if (isPlaying) {
      pauseSong();
    } else {
      playSong();
    }
  }
  
  // Go to next song
  function nextSong() {
    if (currentIndex < playlist.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      localStorage.setItem('currentIndex', newIndex.toString());
    }
  }
  
  // Go to previous song
  function prevSong() {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      localStorage.setItem('currentIndex', newIndex.toString());
    }
  }
  
  // Seek to a specific time
  function seekTo(time) {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }
  
  // Change volume
  function changeVolume(newVolume) {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  }
  
  // Load a new playlist and start playing
  function loadPlaylist(songs, startIndex = 0, source = 'jiosaavn') {
    setPlaylist(songs);
    setCurrentIndex(startIndex);
    setMusicSource(source);
    
    // Save to localStorage
    localStorage.setItem('currentPlaylist', JSON.stringify(songs));
    localStorage.setItem('currentIndex', startIndex.toString());
    localStorage.setItem('musicSource', source);
  }
  
  // Add song to history
  function addToHistory(song) {
    if (!song) return;
    
    const today = new Date();
    const dateText = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const newEntry = {
      id: song.id,
      name: song.name,
      artists: song.artists,
      cover: song.cover || DEFAULT_IMAGE,
      duration: song.duration,
      playedAt: today.toISOString(),
      date: dateText
    };
    
    // Remove if already exists
    const filteredHistory = history.filter(item => item.id !== song.id);
    
    // Add to beginning
    const newHistory = [newEntry, ...filteredHistory].slice(0, 50);
    
    setHistory(newHistory);
    localStorage.setItem('listenHistory', JSON.stringify(newHistory));
  }
  
  // Get audio URL for a song
  function getAudioUrl(song) {
    if (!song) return '';
    
    if (musicSource === 'jiosaavn') {
      return `/api/saavn/stream/${song.id}`;
    } else {
      return song.preview || '';
    }
  }
  
  
  // ==========================================
  // CONTEXT VALUE
  // ==========================================
  
  const value = {
    // State
    playlist,
    currentIndex,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    musicSource,
    history,
    audioRef,
    
    // Functions
    playSong,
    pauseSong,
    togglePlayPause,
    nextSong,
    prevSong,
    seekTo,
    changeVolume,
    loadPlaylist,
    addToHistory,
    getAudioUrl,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    
    // Constants
    DEFAULT_IMAGE
  };
  
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

// Custom hook to use the player context
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

export default PlayerContext;
