/*
================================================================================
  CRAZY MUSICS - MUSIC PLAYER
================================================================================
  This is the main music player for the app.
  
  WHAT IT DOES:
  1. Plays songs from JioSaavn or Spotify
  2. Shows song info (name, artist, cover image)
  3. Let you control: play, pause, next, previous
  4. Shows progress bar and lets you skip to any part
  5. Controls volume
  6. Remembers where you stopped (so you can continue later)
  7. Saves your listening history
  
================================================================================
*/


// ==========================================
// STEP 1: GET ALL THE HTML ELEMENTS WE NEED
// ==========================================

// Get URL parameters (like ?index=0&source=jiosaavn)
var urlParams = new URLSearchParams(window.location.search);
var startIndex = parseInt(urlParams.get('index')) || 0;

// These store our data
var songList = [];           // All songs in playlist
var currentSongNumber = 0;   // Which song we're on (0, 1, 2...)
var audioPlayer = null;      // The actual audio player
var songIsPlaying = false;   // Is music playing right now?

// Get album images from HTML
var previousAlbumImage = document.getElementById('prevAlbum');
var currentAlbumImage = document.getElementById('currentAlbum');
var nextAlbumImage = document.getElementById('nextAlbum');

// Get song info elements
var songNameText = document.getElementById('trackName');
var artistNameText = document.getElementById('artistName');

// Get all the buttons
var playPauseButton = document.getElementById('playPauseBtn');
var playIconSvg = document.getElementById('playIcon');
var pauseIconSvg = document.getElementById('pauseIcon');
var previousSongButton = document.getElementById('prevTrackBtn');
var nextSongButton = document.getElementById('nextTrackBtn');
var previousArrowButton = document.getElementById('prevBtn');
var nextArrowButton = document.getElementById('nextBtn');

// Get progress bar elements
var progressSliderInput = document.getElementById('progressSlider');
var progressBarFill = document.getElementById('progressFill');
var currentTimeText = document.getElementById('currentTime');
var totalTimeText = document.getElementById('duration');
var volumeSliderInput = document.getElementById('volumeSlider');

// Default image if no cover art
var defaultCoverImage = 'https://placehold.co/400x400/0f172a/ffffff?text=Crazy+Musics';

// Check which music service we're using
var musicService = localStorage.getItem('musicSource') || 'jiosaavn';


// ==========================================
// STEP 2: START THE PLAYER
// ==========================================

function startPlayer() {
  // Try to get song list from browser storage
  var savedSongList = localStorage.getItem('currentPlaylist');
  var savedSongNumber = localStorage.getItem('currentIndex');
  
  if (savedSongList) {
    songList = JSON.parse(savedSongList);
    currentSongNumber = parseInt(savedSongNumber) || startIndex;
  }
  
  // If no songs, go back to home page
  if (songList.length === 0) {
    window.location.href = 'index.html';
    return;
  }
  
  // Load the current song
  loadSong(currentSongNumber);
  
  // Setup all button clicks
  setupAllButtons();
  
  // Check if we should auto-play
  var wasPlayingBefore = localStorage.getItem('isCurrentlyPlaying') === 'true';
  if (wasPlayingBefore) {
    // Wait 1 second then play
    setTimeout(function() {
      if (audioPlayer && !songIsPlaying) {
        playSong();
      }
    }, 1000);
  }
}


// ==========================================
// STEP 3: LOAD A SONG
// ==========================================

function loadSong(songNumber) {
  // Check if song number is valid
  if (songNumber < 0 || songNumber >= songList.length) {
    return;
  }
  
  // Get the song data
  var song = songList[songNumber];
  var wasPlayingBefore = songIsPlaying;
  
  // Stop current song if playing
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer = null;
  }
  
  // Reset to paused state
  songIsPlaying = false;
  showPlayButton();
  
  // Show song name and artist
  songNameText.textContent = song.name || 'Unknown Song';
  artistNameText.textContent = song.artists || 'Unknown Artist';
  
  // Show album cover images
  updateAlbumImages(songNumber, song);
  
  // Create the audio player based on music service
  if (musicService === 'jiosaavn') {
    loadJioSaavnSong(song, wasPlayingBefore);
  } else {
    loadSpotifySong(song, wasPlayingBefore);
  }
  
  // Save current position
  localStorage.setItem('currentIndex', currentSongNumber);
  
  // Add to listening history
  addToHistory(song);
}


// ==========================================
// STEP 4: UPDATE ALBUM COVER IMAGES
// ==========================================

function updateAlbumImages(songNumber, currentSong) {
  // Show current song's cover
  var currentCover = currentSong.cover || defaultCoverImage;
  currentAlbumImage.querySelector('img').src = currentCover;
  
  // Show previous song's cover (if exists)
  if (songNumber > 0) {
    var previousSong = songList[songNumber - 1];
    previousAlbumImage.querySelector('img').src = previousSong.cover || defaultCoverImage;
  } else {
    previousAlbumImage.querySelector('img').src = defaultCoverImage;
  }
  
  // Show next song's cover (if exists)
  if (songNumber < songList.length - 1) {
    var nextSong = songList[songNumber + 1];
    nextAlbumImage.querySelector('img').src = nextSong.cover || defaultCoverImage;
  } else {
    nextAlbumImage.querySelector('img').src = defaultCoverImage;
  }
}


// ==========================================
// STEP 5: LOAD JIOSAAVN SONG
// ==========================================

function loadJioSaavnSong(song, shouldAutoPlay) {
  artistNameText.textContent = 'Loading...';
  
  // Create the audio URL (through our server)
  var audioUrl = '/api/saavn/stream/' + song.id;
  
  // Save URL for later
  localStorage.setItem('currentAudioUrl', audioUrl);
  
  // Create audio player
  audioPlayer = new Audio(audioUrl);
  audioPlayer.volume = volumeSliderInput.value / 100;
  
  // When song info loads
  audioPlayer.onloadedmetadata = function() {
    var songLength = audioPlayer.duration || parseInt(song.duration) || 180;
    totalTimeText.textContent = formatTime(songLength);
    progressSliderInput.max = songLength;
    artistNameText.textContent = song.artists || 'Unknown Artist';
  };
  
  // Update progress bar while playing
  audioPlayer.ontimeupdate = updateProgressBar;
  
  // When song ends
  audioPlayer.onended = function() {
    localStorage.removeItem('currentPlaybackTime');
    if (currentSongNumber < songList.length - 1) {
      goToNextSong();
    } else {
      pauseSong();
      localStorage.setItem('isCurrentlyPlaying', 'false');
    }
  };
  
  // If error loading song
  audioPlayer.onerror = function() {
    artistNameText.textContent = 'Failed to load - trying next...';
    // Try next song after 2 seconds
    if (currentSongNumber < songList.length - 1) {
      setTimeout(function() {
        currentSongNumber++;
        loadSong(currentSongNumber);
      }, 2000);
    }
  };
  
  // Resume from where we left off
  resumeFromSavedPosition(song);
  
  // Auto-play if we were playing before
  if (shouldAutoPlay) {
    playSong();
  }
  
  // Connect to particle effects if available
  if (typeof window.initParticleAudio === 'function') {
    window.initParticleAudio(audioPlayer);
  }
}


// ==========================================
// STEP 6: LOAD SPOTIFY SONG
// ==========================================

function loadSpotifySong(song, shouldAutoPlay) {
  // Check if song has preview URL
  if (!song.preview) {
    artistNameText.textContent = 'No preview - trying next...';
    // Skip to next song
    if (shouldAutoPlay && currentSongNumber < songList.length - 1) {
      setTimeout(function() {
        currentSongNumber++;
        loadSong(currentSongNumber);
      }, 1500);
    }
    return;
  }
  
  // Save URL for later
  localStorage.setItem('currentAudioUrl', song.preview);
  
  // Create audio player
  audioPlayer = new Audio(song.preview);
  audioPlayer.volume = volumeSliderInput.value / 100;
  
  // When song info loads
  audioPlayer.onloadedmetadata = function() {
    totalTimeText.textContent = formatTime(audioPlayer.duration);
    progressSliderInput.max = audioPlayer.duration;
  };
  
  // Update progress bar while playing
  audioPlayer.ontimeupdate = updateProgressBar;
  
  // When song ends
  audioPlayer.onended = function() {
    if (currentSongNumber < songList.length - 1) {
      goToNextSong();
    } else {
      pauseSong();
    }
  };
  
  // If error loading song
  audioPlayer.onerror = function() {
    artistNameText.textContent = 'Error loading song';
  };
  
  // Resume from where we left off
  resumeFromSavedPosition(song);
  
  // Auto-play if we were playing before
  if (shouldAutoPlay) {
    playSong();
  }
  
  // Connect to particle effects if available
  if (typeof window.initParticleAudio === 'function') {
    window.initParticleAudio(audioPlayer);
  }
}


// ==========================================
// STEP 7: PLAY AND PAUSE CONTROLS
// ==========================================

function playSong() {
  if (!audioPlayer) return;
  
  var playAttempt = audioPlayer.play();
  
  if (playAttempt !== undefined) {
    playAttempt.then(function() {
      // Success! Update UI
      songIsPlaying = true;
      showPauseButton();
      localStorage.setItem('isCurrentlyPlaying', 'true');
      updateBrowserMediaControls();
    }).catch(function(error) {
      // Failed to play
      songIsPlaying = false;
      showPlayButton();
      if (error.name === 'NotAllowedError') {
        artistNameText.textContent = 'Click play to start';
      } else {
        artistNameText.textContent = 'Cannot play this song';
      }
    });
  }
}

function pauseSong() {
  if (!audioPlayer) return;
  
  audioPlayer.pause();
  songIsPlaying = false;
  showPlayButton();
  localStorage.setItem('isCurrentlyPlaying', 'false');
  
  // Update browser controls
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'paused';
  }
}

function togglePlayPause() {
  if (songIsPlaying) {
    pauseSong();
  } else {
    if (!audioPlayer) {
      // No song loaded, try to find one
      findPlayableSong();
    } else {
      playSong();
    }
  }
}


// ==========================================
// STEP 8: NEXT AND PREVIOUS CONTROLS
// ==========================================

function goToPreviousSong() {
  if (currentSongNumber > 0) {
    currentSongNumber--;
    loadSong(currentSongNumber);
  }
}

function goToNextSong() {
  if (currentSongNumber < songList.length - 1) {
    currentSongNumber++;
    loadSong(currentSongNumber);
  }
}

function findPlayableSong() {
  // Search for a song that has audio
  var searchIndex = currentSongNumber;
  var tries = 0;
  
  while (tries < songList.length) {
    searchIndex++;
    if (searchIndex >= songList.length) {
      searchIndex = 0;
    }
    
    if (songList[searchIndex] && songList[searchIndex].preview) {
      currentSongNumber = searchIndex;
      loadSong(currentSongNumber);
      setTimeout(playSong, 100);
      return;
    }
    
    tries++;
    if (searchIndex === currentSongNumber) break;
  }
  
  // No playable songs found
  songNameText.textContent = '⚠️ No Songs Available';
  artistNameText.textContent = 'Try different songs!';
  
  setTimeout(function() {
    if (confirm('No songs can be played. Go back home?')) {
      window.location.href = 'index.html';
    }
  }, 1000);
}


// ==========================================
// STEP 9: PROGRESS BAR FUNCTIONS
// ==========================================

function updateProgressBar() {
  if (!audioPlayer) return;
  
  // Update time text
  currentTimeText.textContent = formatTime(audioPlayer.currentTime);
  
  // Update slider position
  progressSliderInput.value = audioPlayer.currentTime;
  
  // Update fill bar width
  var percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressBarFill.style.width = percent + '%';
  
  // Save position so we can resume later
  if (songIsPlaying) {
    localStorage.setItem('currentPlaybackTime', audioPlayer.currentTime.toString());
  }
  
  // Update browser media position
  updateBrowserMediaPosition();
}

function jumpToTime(newTime) {
  if (!audioPlayer) return;
  audioPlayer.currentTime = newTime;
}

function changeVolume(newVolume) {
  if (!audioPlayer) return;
  audioPlayer.volume = newVolume / 100;
}


// ==========================================
// STEP 10: HELPER FUNCTIONS
// ==========================================

// Convert seconds to "M:SS" format (like 3:45)
function formatTime(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '0:00';
  
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = Math.floor(totalSeconds % 60);
  
  // Add leading zero to seconds if needed (5 becomes 05)
  var secondsText = seconds < 10 ? '0' + seconds : seconds;
  
  return minutes + ':' + secondsText;
}

// Show play button (hide pause)
function showPlayButton() {
  playIconSvg.style.display = 'block';
  pauseIconSvg.style.display = 'none';
}

// Show pause button (hide play)
function showPauseButton() {
  playIconSvg.style.display = 'none';
  pauseIconSvg.style.display = 'block';
}

// Resume from where we stopped before
function resumeFromSavedPosition(song) {
  var savedTime = parseFloat(localStorage.getItem('currentPlaybackTime') || '0');
  var songLength = parseInt(song.duration) || 180;
  
  if (savedTime > 0 && savedTime < songLength) {
    audioPlayer.onloadedmetadata = function() {
      if (audioPlayer.duration > savedTime) {
        audioPlayer.currentTime = savedTime;
      }
      // Show correct time
      var duration = audioPlayer.duration || songLength;
      totalTimeText.textContent = formatTime(duration);
      progressSliderInput.max = duration;
      artistNameText.textContent = song.artists || 'Unknown Artist';
    };
  }
}


// ==========================================
// STEP 11: LISTENING HISTORY
// ==========================================

function addToHistory(song) {
  try {
    // Get existing history
    var history = JSON.parse(localStorage.getItem('listenHistory') || '[]');
    
    // Create new entry with date
    var today = new Date();
    var dateText = today.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    var newEntry = {
      id: song.id,
      name: song.name,
      artists: song.artists,
      cover: song.cover,
      duration: song.duration,
      playedAt: today.toISOString(),
      date: dateText
    };
    
    // Remove this song if already in history
    history = history.filter(function(item) {
      return item.id !== song.id;
    });
    
    // Add to beginning
    history.unshift(newEntry);
    
    // Keep only 50 songs
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    // Save
    localStorage.setItem('listenHistory', JSON.stringify(history));
  } catch (e) {
    // Ignore errors
  }
}


// ==========================================
// STEP 12: SETUP ALL BUTTON CLICKS
// ==========================================

function setupAllButtons() {
  // Play/Pause button
  playPauseButton.onclick = togglePlayPause;
  
  // Previous buttons
  previousSongButton.onclick = goToPreviousSong;
  previousArrowButton.onclick = goToPreviousSong;
  
  // Next buttons
  nextSongButton.onclick = goToNextSong;
  nextArrowButton.onclick = goToNextSong;
  
  // Progress slider
  progressSliderInput.oninput = function(e) {
    var newTime = parseFloat(e.target.value);
    currentTimeText.textContent = formatTime(newTime);
    if (audioPlayer) {
      progressBarFill.style.width = ((newTime / audioPlayer.duration) * 100) + '%';
    }
  };
  
  progressSliderInput.onchange = function(e) {
    jumpToTime(parseFloat(e.target.value));
  };
  
  // Volume slider
  volumeSliderInput.oninput = function(e) {
    changeVolume(parseFloat(e.target.value));
  };
  
  // Keyboard shortcuts
  document.onkeydown = function(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      goToPreviousSong();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      goToNextSong();
    }
  };
  
  // Browser media controls
  setupBrowserMediaControls();
}


// ==========================================
// STEP 13: BROWSER MEDIA CONTROLS
// ==========================================

function setupBrowserMediaControls() {
  if (!('mediaSession' in navigator)) return;
  
  navigator.mediaSession.setActionHandler('play', playSong);
  navigator.mediaSession.setActionHandler('pause', pauseSong);
  navigator.mediaSession.setActionHandler('previoustrack', goToPreviousSong);
  navigator.mediaSession.setActionHandler('nexttrack', goToNextSong);
  navigator.mediaSession.setActionHandler('seekto', function(details) {
    if (details.seekTime && audioPlayer) {
      jumpToTime(details.seekTime);
    }
  });
}

function updateBrowserMediaControls() {
  if (!('mediaSession' in navigator)) return;
  if (!songList[currentSongNumber]) return;
  
  var song = songList[currentSongNumber];
  var coverImage = song.cover || defaultCoverImage;
  
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.name || 'Unknown Song',
    artist: song.artists || 'Unknown Artist',
    album: 'Crazy Musics',
    artwork: [
      { src: coverImage, sizes: '96x96', type: 'image/png' },
      { src: coverImage, sizes: '128x128', type: 'image/png' },
      { src: coverImage, sizes: '256x256', type: 'image/png' },
      { src: coverImage, sizes: '512x512', type: 'image/png' }
    ]
  });
  
  navigator.mediaSession.playbackState = songIsPlaying ? 'playing' : 'paused';
}

function updateBrowserMediaPosition() {
  if (!('mediaSession' in navigator)) return;
  if (!('setPositionState' in navigator.mediaSession)) return;
  if (!audioPlayer) return;
  
  try {
    navigator.mediaSession.setPositionState({
      duration: audioPlayer.duration,
      playbackRate: 1,
      position: audioPlayer.currentTime
    });
  } catch (e) {
    // Ignore errors
  }
}


// ==========================================
// STEP 14: START EVERYTHING!
// ==========================================

// Wait for page to load, then start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPlayer);
} else {
  startPlayer();
}
