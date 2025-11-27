/*
================================================================================
  HOME PAGE
================================================================================
  The main landing page of the app.
  Shows: Featured playlists, Search, Song results, History, Mini player
================================================================================
*/

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { searchSongs, getHighQualityImage } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import SearchBar from '../../components/SearchBar/SearchBar';
import SongCard from '../../components/SongCard/SongCard';
import MiniPlayer from '../../components/MiniPlayer/MiniPlayer';
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const { history, currentSong, loadPlaylist } = usePlayer();

    // State
    const [songs, setSongs] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Ready to fetch music.');
    const [searchQuery, setSearchQuery] = useState('');

    // Redirect to login if not logged in
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, authLoading, navigate]);

    // Don't render if still loading auth
    if (authLoading) {
        return <div className="loading">Loading...</div>;
    }

    // Handle search
    async function handleSearch(query) {
        setSearchQuery(query);
        setIsSearching(true);
        setStatusMessage(`Searching for "${query}"...`);

        try {
            const results = await searchSongs(query);

            if (results.length === 0) {
                setStatusMessage(`No songs found for "${query}".`);
                setSongs([]);
            } else {
                setStatusMessage(`Found ${results.length} songs for "${query}"`);
                setSongs(results);
            }
        } catch (error) {
            setStatusMessage(`Error: ${error.message}`);
            setSongs([]);
        } finally {
            setIsSearching(false);
        }
    }

    // Handle featured playlist click
    function handlePlaylistClick(query) {
        handleSearch(query);
    }

    // Handle history card click
    function handleHistoryClick(song, index) {
        // Create playlist from history
        const playlist = history.slice(0, 20).map(s => ({
            id: s.id,
            name: s.name || s.title || 'Unknown',
            artists: s.artists || s.subtitle || 'Unknown Artist',
            cover: getHighQualityImage(s.cover || s.image),
            duration: s.duration || 180,
            preview: ''
        }));

        loadPlaylist(playlist, index, 'jiosaavn');
        navigate(`/player?index=${index}&source=jiosaavn`);
    }

    // Suggestion chips for empty state
    const suggestions = [
        'arijit singh',
        'sid sriram tamil',
        'armaan malik',
        'shreya ghoshal',
        'atif aslam',
        'jubin nautiyal',
        'diljit dosanjh',
        'badshah'
    ];

    return (
        <div className="home-page">
            <Navbar />

            <main className="home">
                {/* Welcome Section */}
                <section className="welcome">
                    <h1>Welcome to Crazy Musics</h1>
                    <p>Discover, stream, and enjoy your favorite tracks.</p>
                </section>

                {/* Mini Player (if song is playing) */}
                {currentSong && <MiniPlayer />}

                {/* Listening History */}
                {history.length > 0 && (
                    <section className="playlists history-section">
                        <h2>📜 Listen History</h2>
                        <div className="playlist-grid">
                            {history.slice(0, 8).map((song, index) => (
                                <div
                                    key={song.id}
                                    className="playlist-card history-card"
                                    onClick={() => handleHistoryClick(song, index)}
                                >
                                    <div
                                        className="card-bg"
                                        style={{ backgroundImage: `url(${getHighQualityImage(song.cover || song.image)})` }}
                                    />
                                    <div className="card-info">
                                        <h3>{song.name || song.title || 'Unknown'}</h3>
                                        <p>{song.artists || song.subtitle || 'Unknown Artist'}</p>
                                        <span className="pill-label history-date">{song.date || 'Recently'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Featured Playlists */}
                <section className="playlists">
                    <h2>Featured Playlists</h2>
                    <div className="playlist-grid">
                        <div className="playlist-card" onClick={() => handlePlaylistClick('arijit singh romantic hits')}>
                            <div className="card-bg" style={{ backgroundImage: "url('https://picsum.photos/seed/1/300/300')" }} />
                            <div className="card-info">
                                <h3>Romantic Hits</h3>
                                <p>Arijit Singh • Hindi</p>
                            </div>
                        </div>
                        <div className="playlist-card" onClick={() => handlePlaylistClick('sid sriram tamil melody')}>
                            <div className="card-bg" style={{ backgroundImage: "url('https://picsum.photos/seed/2/300/300')" }} />
                            <div className="card-info">
                                <h3>Melody Magic</h3>
                                <p>Sid Sriram • Tamil</p>
                            </div>
                        </div>
                        <div className="playlist-card" onClick={() => handlePlaylistClick('diljit dosanjh punjabi')}>
                            <div className="card-bg" style={{ backgroundImage: "url('https://picsum.photos/seed/3/300/300')" }} />
                            <div className="card-info">
                                <h3>Punjabi Vibes</h3>
                                <p>Diljit Dosanjh • Punjabi</p>
                            </div>
                        </div>
                        <div className="playlist-card" onClick={() => handlePlaylistClick('a r rahman best songs')}>
                            <div className="card-bg" style={{ backgroundImage: "url('https://picsum.photos/seed/4/300/300')" }} />
                            <div className="card-info">
                                <h3>Legendary Classics</h3>
                                <p>A.R. Rahman • Multi</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Search Section */}
                <section className="spotify-section" id="live-tracks">
                    <div className="spotify-header">
                        <span className="pill-label">Live from JioSaavn</span>
                        <h2>Fresh drops for your vibe</h2>
                        <p>Search any Telugu, Hindi, Tamil, or English song — we pull full MP3 tracks directly from JioSaavn.</p>
                    </div>

                    <SearchBar onSearch={handleSearch} isLoading={isSearching} />

                    <p className="status-message">{statusMessage}</p>

                    {/* Song Results */}
                    <div className="song-grid">
                        {songs.length > 0 ? (
                            songs.slice(0, 12).map((song, index) => (
                                <SongCard
                                    key={song.id}
                                    song={song}
                                    index={index}
                                    allSongs={songs}
                                />
                            ))
                        ) : (
                            /* Empty State with Suggestions */
                            <div className="empty-state">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9 9h.01M15 9h.01M9.5 13a3.5 3.5 0 005 0"></path>
                                </svg>
                                <h3>Search for songs!</h3>
                                <p>Try these popular artists:</p>
                                <div className="suggestion-chips">
                                    {suggestions.map(artist => (
                                        <button
                                            key={artist}
                                            className="suggestion-chip"
                                            onClick={() => handleSearch(artist)}
                                        >
                                            {artist.charAt(0).toUpperCase() + artist.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;
