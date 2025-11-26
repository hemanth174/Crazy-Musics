(function() {
  // Get track data from URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const playlistJSON = urlParams.get('playlist');
  const startIndex = parseInt(urlParams.get('index') || '0');

  let playlist = [];
  let currentIndex = 0;
  let audio = null;
  let isPlaying = false;

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
    console.log('Initializing player with source:', musicSource);
    
    // Try to get playlist from URL or localStorage
    if (playlistJSON) {
      try {
        playlist = JSON.parse(decodeURIComponent(playlistJSON));
        currentIndex = startIndex;
        localStorage.setItem('currentPlaylist', playlistJSON);
        localStorage.setItem('currentIndex', currentIndex);
      } catch (e) {
        console.error('Failed to parse playlist:', e);
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
  }

  function loadFromStorage() {
    const storedPlaylist = localStorage.getItem('currentPlaylist');
    const storedIndex = localStorage.getItem('currentIndex');
    
    if (storedPlaylist) {
      try {
        playlist = JSON.parse(storedPlaylist);
        currentIndex = parseInt(storedIndex || '0');
      } catch (e) {
        console.error('Failed to load from storage:', e);
      }
    }
  }

  function showError(message) {
    trackName.textContent = 'Error';
    artistName.textContent = message;
    console.error('Player error:', message);
  }

  async function loadJioSaavnTrack(track, wasPlaying) {
    try {
      artistName.textContent = 'Loading...';
      console.log('Loading JioSaavn song:', track.id);

      // Use proxy endpoint to stream audio (bypass CORS)
      const audioUrl = `/api/saavn/stream/${track.id}`;
      
      console.log('Streaming from:', audioUrl);

      // Create audio element
      audio = new Audio(audioUrl);
      audio.volume = volumeSlider.value / 100;

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration || parseInt(track.duration) || 180;
        durationEl.textContent = formatTime(duration);
        progressSlider.max = duration;
        artistName.textContent = track.artists || 'Unknown Artist';
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
        console.error('JioSaavn audio error:', e);
        artistName.textContent = 'Failed to load audio';
        
        // Try next track if available
        if (currentIndex < playlist.length - 1) {
          setTimeout(() => {
            currentIndex++;
            loadTrack(currentIndex);
          }, 2000);
        }
      });

      // Auto-play if was playing
      if (wasPlaying) {
        play();
      }
      
    } catch (err) {
      console.error('Error loading JioSaavn track:', err);
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
        audio = new Audio(track.preview);
        audio.volume = volumeSlider.value / 100;

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
          console.error('Audio loading error:', e);
          artistName.textContent = 'Error loading track';
        });

        // Auto-play if was playing
        if (wasPlaying) {
          play();
        }
        
        console.log('Track loaded:', track.name, 'Preview URL:', track.preview);
      } else {
        trackName.textContent = track.name || 'Unknown Track';
        artistName.textContent = 'No preview available - Try next track';
        console.warn('No preview URL for track:', track.name);
        
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
  }

  function play() {
    if (!audio) {
      console.warn('Play attempted but no audio object exists');
      return;
    }
    
    console.log('Playing audio...');
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isPlaying = true;
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        console.log('Playback started successfully');
      }).catch(err => {
        console.error('Playback error:', err);
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
    console.log('Searching for track with preview...');
    let searchIndex = currentIndex;
    let attempts = 0;
    const maxAttempts = playlist.length;

    while (attempts < maxAttempts) {
      searchIndex++;
      if (searchIndex >= playlist.length) {
        searchIndex = 0; // Loop back to start
      }
      
      if (playlist[searchIndex]?.preview) {
        console.log('Found track with preview:', playlist[searchIndex].name);
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
    console.warn('No tracks with preview URLs found in playlist');
    
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
    if (!audio) return;
    
    currentTimeEl.textContent = formatTime(audio.currentTime);
    progressSlider.value = audio.currentTime;
    
    const percentage = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percentage + '%';
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
    
    progressSlider.addEventListener('input', (e) => {
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
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
