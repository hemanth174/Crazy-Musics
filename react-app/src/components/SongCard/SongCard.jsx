/*
================================================================================
  SONG CARD COMPONENT
================================================================================
  A clickable card that displays song information.
  Shows: Cover image, Song name, Artist, Duration, Year
================================================================================
*/

import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { getSongDetails, getHighQualityImage, formatDuration } from '../../services/api';
import './SongCard.css';

function SongCard({ song, index, allSongs }) {
  const navigate = useNavigate();
  const { loadPlaylist, DEFAULT_IMAGE } = usePlayer();
  
  // Get song info
  const cover = getHighQualityImage(song.image || song.cover);
  const name = song.name || song.title || 'Unknown Song';
  const artist = song.artists || song.subtitle || 'Unknown Artist';
  const duration = song.duration || 180;
  const year = song.year || '';
  
  // Handle card click
  async function handleClick() {
    try {
      // Check if song is playable
      const songData = await getSongDetails(song.id);
      
      if (!songData.media_url_320 && !songData.media_url_160) {
        alert("This song can't be played. Try another one.");
        return;
      }
      
      // Create playlist from all songs
      const playlist = allSongs.map(s => ({
        id: s.id,
        name: s.name || s.title || 'Unknown',
        artists: s.artists || s.subtitle || 'Unknown Artist',
        cover: getHighQualityImage(s.image || s.cover),
        duration: s.duration || 180,
        preview: ''
      }));
      
      // Load playlist and go to player
      loadPlaylist(playlist, index, 'jiosaavn');
      navigate(`/player?index=${index}&source=jiosaavn`);
      
    } catch (error) {
      console.error('Error loading song:', error);
      alert('Error loading song: ' + error.message);
    }
  }
  
  return (
    <article className="song-card" onClick={handleClick}>
      {/* Cover Image */}
      <div className="song-card-cover">
        <img src={cover} alt={name} loading="lazy" />
        <button className="play-overlay" title={`Play ${name}`}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
      
      {/* Song Info */}
      <div className="song-meta">
        <h3>{name}</h3>
        <p>{artist}</p>
      </div>
      
      {/* Footer with year and duration */}
      <div className="song-footer">
        {year && <span className="pill-label">{year}</span>}
        <span className="pill-label">{formatDuration(duration)}</span>
      </div>
    </article>
  );
}

export default SongCard;
