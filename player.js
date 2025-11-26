(function() {
  // Get track data from URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const playlistJSON = urlParams.get('playlist');
  const startIndex = parseInt(urlParams.get('index') || '0');

  let playlist = [];
  let currentIndex = 0;
  let audio = null;
  let isPlaying = false;
  let isSeeking = false;

  // DOM Elements
  const prevAlbum = document.getElementById('prevAlbum');
  const currentAlbum = document.getElementById('currentAlbum');
  const nextAlbum = document.getElementById('nextAlbum');
  const trackName = document.getElementById('trackName');
  const artistName = document.getElementById('artistName');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const prevTrackBtn = document.getElementById('prevTrackBtn');
  const nextTrackBtn = document.getElementById('nextTrackBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progressSlider = document.getElementById('progressSlider');
  const progressFill = document.getElementById('progressFill');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const volumeSlider = document.getElementById('volumeSlider');

  // Check music source (Spotify or JioSaavn)
  const musicSource = localStorage.getItem('musicSource') || urlParams.get('source') || 'spotify';
  
  // Initialize
  function init() {
    // Try to get playlist from URL or localStorage
    if (playlistJSON) {
      try {
        playlist = JSON.parse(decodeURIComponent(playlistJSON));
        currentIndex = startIndex;
        localStorage.setItem('currentPlaylist', playlistJSON);
        localStorage.setItem('currentIndex', currentIndex);
      } catch (e) {
        loadFromStorage();
      }
    } else {
      loadFromStorage();
    }

    if (playlist.length === 0) {
      // Redirect to home page if no playlist
      window.location.href = 'index.html';
      return;
    }

    loadTrack(currentIndex);
    setupEventListeners();
    
    // Auto-resume if was playing
    const wasPlaying = localStorage.getItem('isCurrentlyPlaying') === 'true';
    if (wasPlaying) {
      setTimeout(() => {
        if (audio && !isPlaying) {
          play();
        }
      }, 1000);
    }
  }

  function loadFromStorage() {
    const storedPlaylist = localStorage.getItem('currentPlaylist');
    const storedIndex = localStorage.getItem('currentIndex');
    
    if (storedPlaylist) {
      try {
        playlist = JSON.parse(storedPlaylist);
        currentIndex = parseInt(storedIndex || '0');
      } catch (e) {
        // Failed to load from storage
      }
    }
  }

  function showError(message) {
    trackName.textContent = 'Error';
    artistName.textContent = message;
  }

  async function loadJioSaavnTrack(track, wasPlaying) {
    try {
      artistName.textContent = 'Loading...';

      // Use proxy endpoint to stream audio (bypass CORS)
      const audioUrl = `/api/saavn/stream/${track.id}`;
      
      // Save audio URL for background playback on home page
      localStorage.setItem('currentAudioUrl', audioUrl);

      // Create audio element
      audio = new Audio(audioUrl);
      audio.volume = volumeSlider.value / 100;

      // Initialize particle audio analysis
      if (typeof window.initParticleAudio === 'function') {
        window.initParticleAudio(audio);
      }

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration || parseInt(track.duration) || 180;
        durationEl.textContent = formatTime(duration);
        progressSlider.max = duration;
        artistName.textContent = track.artists || 'Unknown Artist';
      });

      audio.addEventListener('timeupdate', updateProgress);
      
      audio.addEventListener('ended', () => {
        localStorage.removeItem('currentPlaybackTime');
        if (currentIndex < playlist.length - 1) {
          nextTrack();
        } else {
          pause();
          localStorage.setItem('isCurrentlyPlaying', 'false');
        }
      });

      audio.addEventListener('error', (e) => {
        artistName.textContent = 'Failed to load audio';
        
        // Try next track if available
        if (currentIndex < playlist.length - 1) {
          setTimeout(() => {
            currentIndex++;
            loadTrack(currentIndex);
          }, 2000);
        }
      });

      // Resume from saved position if available
      const savedTime = parseFloat(localStorage.getItem('currentPlaybackTime') || '0');
      if (savedTime > 0 && savedTime < (parseInt(track.duration) || 180)) {
        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration > savedTime) {
            audio.currentTime = savedTime;
          }
        }, { once: true });
      }
      
      // Auto-play if was playing
      if (wasPlaying) {
        play();
      }
      
    } catch (err) {
      artistName.textContent = 'Error: ' + err.message;
      
      // Try next track
      if (currentIndex < playlist.length - 1) {
        setTimeout(() => {
          currentIndex++;
          loadTrack(currentIndex);
        }, 2000);
      }
    }
  }

  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;

    const track = playlist[index];
    const wasPlaying = isPlaying;

    // Stop current audio
    if (audio) {
      audio.pause();
      audio = null;
    }

    // Reset play state
    isPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';

    // Update current track display
    trackName.textContent = track.name || 'Unknown Track';
    artistName.textContent = track.artists || 'Unknown Artist';

    // Update album art
    const fallback = 'https://placehold.co/400x400/0f172a/ffffff?text=Crazy+Musics';
    currentAlbum.querySelector('img').src = track.cover || fallback;

    // Update prev/next album art
    if (index > 0) {
      const prevTrack = playlist[index - 1];
      prevAlbum.querySelector('img').src = prevTrack.cover || fallback;
    } else {
      prevAlbum.querySelector('img').src = fallback;
    }

    if (index < playlist.length - 1) {
      const nextTrack = playlist[index + 1];
      nextAlbum.querySelector('img').src = nextTrack.cover || fallback;
    } else {
      nextAlbum.querySelector('img').src = fallback;
    }

    // Create new audio based on source
    if (musicSource === 'jiosaavn') {
      loadJioSaavnTrack(track, wasPlaying);
    } else {
      // Spotify preview
      if (track.preview) {
        // Save audio URL for background playback on home page
        localStorage.setItem('currentAudioUrl', track.preview);
        
        audio = new Audio(track.preview);
        audio.volume = volumeSlider.value / 100;

        // Initialize particle audio analysis
        if (typeof window.initParticleAudio === 'function') {
          window.initParticleAudio(audio);
        }

        audio.addEventListener('loadedmetadata', () => {
          durationEl.textContent = formatTime(audio.duration);
          progressSlider.max = audio.duration;
        });

        audio.addEventListener('timeupdate', updateProgress);
        
        audio.addEventListener('ended', () => {
          if (currentIndex < playlist.length - 1) {
            nextTrack();
          } else {
            pause();
          }
        });

        audio.addEventListener('error', (e) => {
          artistName.textContent = 'Error loading track';
        });

        // Resume from saved position if available
        const savedTime = parseFloat(localStorage.getItem('currentPlaybackTime') || '0');
        if (savedTime > 0) {
          audio.addEventListener('loadedmetadata', () => {
            if (audio.duration > savedTime) {
              audio.currentTime = savedTime;
            }
          }, { once: true });
        }
        
        // Auto-play if was playing
        if (wasPlaying) {
          play();
        }
      } else {
        trackName.textContent = track.name || 'Unknown Track';
        artistName.textContent = 'No preview available - Try next track';
        
        // Automatically skip to next track with preview if was playing
        if (wasPlaying && currentIndex < playlist.length - 1) {
          setTimeout(() => {
            currentIndex++;
            loadTrack(currentIndex);
          }, 1500);
        }
      }
    }

    // Save current index
    localStorage.setItem('currentIndex', currentIndex);
    
    // Track listen history
    saveToListenHistory(track);
  }

  // Save track to listen history
  function saveToListenHistory(track) {
    try {
      let history = JSON.parse(localStorage.getItem('listenHistory') || '[]');
      
      // Add timestamp to track
      const historyEntry = {
        ...track,
        playedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      
      // Remove duplicate if exists (same song ID)
      history = history.filter(item => item.id !== track.id);
      
      // Add to beginning of array
      history.unshift(historyEntry);
      
      // Keep only last 50 songs
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      localStorage.setItem('listenHistory', JSON.stringify(history));
    } catch (e) {
      // Error saving history
    }
  }

  function play() {
    if (!audio) {
      return;
    }
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isPlaying = true;
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        
        // Mark as currently playing
        localStorage.setItem('isCurrentlyPlaying', 'true');
        
        // Update Media Session API
        updateMediaSession();
      }).catch(err => {
        isPlaying = false;
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        
        // Show user-friendly error
        if (err.name === 'NotAllowedError') {
          artistName.textContent = 'Click play to start (browser autoplay policy)';
        } else {
          artistName.textContent = 'Unable to play this track';
        }
      });
    }
  }

  function pause() {
    if (!audio) return;
    
    audio.pause();
    isPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    
    // Mark as not currently playing
    localStorage.setItem('isCurrentlyPlaying', 'false');
    
    // Update Media Session API
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  function togglePlayPause() {
    if (isPlaying) {
      pause();
    } else {
      // If no audio (no preview available), try to find next track with preview
      if (!audio) {
        findAndPlayNextAvailableTrack();
      } else {
        play();
      }
    }
  }

  function findAndPlayNextAvailableTrack() {
    let searchIndex = currentIndex;
    let attempts = 0;
    const maxAttempts = playlist.length;

    while (attempts < maxAttempts) {
      searchIndex++;
      if (searchIndex >= playlist.length) {
        searchIndex = 0; // Loop back to start
      }
      
      if (playlist[searchIndex]?.preview) {
        currentIndex = searchIndex;
        loadTrack(currentIndex);
        setTimeout(() => play(), 100);
        return;
      }
      
      attempts++;
      if (searchIndex === currentIndex) break; // Checked all tracks
    }
    
    // No tracks with previews found - redirect to home
    trackName.textContent = '⚠️ No Playable Tracks';
    artistName.textContent = 'These songs have no preview URLs. Try different tracks!';
    
    // Show alert and redirect after 3 seconds
    setTimeout(() => {
      if (confirm('No tracks in this playlist have preview URLs. Return to home to search for different songs?')) {
        window.location.href = 'index.html';
      }
    }, 1000);
  }

  function prevTrack() {
    if (currentIndex > 0) {
      currentIndex--;
      loadTrack(currentIndex);
    }
  }

  function nextTrack() {
    if (currentIndex < playlist.length - 1) {
      currentIndex++;
      loadTrack(currentIndex);
    }
  }

  function updateProgress() {
    if (!audio || isSeeking) return;
    
    currentTimeEl.textContent = formatTime(audio.currentTime);
    progressSlider.value = audio.currentTime;
    
    const percentage = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percentage + '%';
    
    // Save current playback position for resume
    if (isPlaying) {
      localStorage.setItem('currentPlaybackTime', audio.currentTime.toString());
    }
    
    // Update Media Session position
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime
        });
      } catch (e) {
        // Position state not supported
      }
    }
  }

  function seekTo(time) {
    if (!audio) return;
    audio.currentTime = time;
  }

  function setVolume(value) {
    if (!audio) return;
    audio.volume = value / 100;
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevTrackBtn.addEventListener('click', prevTrack);
    nextTrackBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    
    // Progress bar - allow scrubbing
    let isSeeking = false;
    
    progressSlider.addEventListener('mousedown', () => {
      isSeeking = true;
    });
    
    progressSlider.addEventListener('mouseup', () => {
      isSeeking = false;
    });
    
    progressSlider.addEventListener('input', (e) => {
      if (audio) {
        const time = parseFloat(e.target.value);
        currentTimeEl.textContent = formatTime(time);
        progressFill.style.width = ((time / audio.duration) * 100) + '%';
      }
    });
    
    progressSlider.addEventListener('change', (e) => {
      seekTo(parseFloat(e.target.value));
    });

    volumeSlider.addEventListener('input', (e) => {
      setVolume(parseFloat(e.target.value));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevTrack();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextTrack();
      }
    });

    // Setup Media Session API for browser controls
    setupMediaSession();
  }

  // Media Session API for browser media controls
  function setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audio) {
          seekTo(details.seekTime);
        }
      });
    }
  }

  function updateMediaSession() {
    if ('mediaSession' in navigator && playlist[currentIndex]) {
      const track = playlist[currentIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name || 'Unknown Track',
        artist: track.artists || 'Unknown Artist',
        album: track.album || 'Crazy Musics',
        artwork: [
          { src: track.cover || 'https://placehold.co/96x96/0f172a/ffffff?text=CM', sizes: '96x96', type: 'image/png' },
          { src: track.cover || 'https://placehold.co/128x128/0f172a/ffffff?text=CM', sizes: '128x128', type: 'image/png' },
          { src: track.cover || 'https://placehold.co/256x256/0f172a/ffffff?text=CM', sizes: '256x256', type: 'image/png' },
          { src: track.cover || 'https://placehold.co/512x512/0f172a/ffffff?text=CM', sizes: '512x512', type: 'image/png' }
        ]
      });

      // Update playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
