/*
================================================================================
  MINI PLAYER COMPONENT
================================================================================
  A small player that shows at the bottom of pages when music is playing.
  Shows: Cover, Song name, Artist, Play/Pause, Next/Prev buttons
================================================================================
*/

import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import './MiniPlayer.css';

function MiniPlayer() {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    nextSong,
    prevSong,
    currentIndex,
    playlist,
    DEFAULT_IMAGE
  } = usePlayer();
  
  // Don't show if no song is playing
  if (!currentSong) {
    return null;
  }
  
  // Get song info
  const cover = currentSong.cover || DEFAULT_IMAGE;
  const name = currentSong.name || 'Unknown Song';
  const artist = currentSong.artists || 'Unknown Artist';
  
  // Go to full player
  function goToPlayer() {
    navigate(`/player?index=${currentIndex}&source=jiosaavn`);
  }
  
  return (
    <div className="mini-player">
      {/* Now Playing indicator */}
      <div className="now-playing-indicator">
        <span className="pulse-dot"></span>
        <span className="now-playing-text">NOW PLAYING</span>
      </div>
      
      {/* Content */}
      <div className="mini-player-content">
        {/* Cover image */}
        <img src={cover} alt={name} className="mini-cover" />
        
        {/* Song info */}
        <div className="mini-info">
          <h3>{name}</h3>
          <p>{artist}</p>
          
          {/* Controls */}
          <div className="mini-controls">
            {/* Previous button */}
            <button 
              className="mini-btn" 
              onClick={prevSong}
              disabled={currentIndex === 0}
              title="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            {/* Play/Pause button */}
            <button className="mini-btn play-pause" onClick={togglePlayPause} title="Play/Pause">
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            {/* Next button */}
            <button 
              className="mini-btn" 
              onClick={nextSong}
              disabled={currentIndex >= playlist.length - 1}
              title="Next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            
            {/* Open full player button */}
            <button className="open-player-btn" onClick={goToPlayer}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                <path d="M10 8v8l6-4z"/>
              </svg>
              Open Player
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiniPlayer;
