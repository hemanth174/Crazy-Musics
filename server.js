// ============================================================================
// CRAZY MUSICS SERVER - Main backend server
// ============================================================================
// This Express.js server handles:
// - User authentication (login/signup with JWT tokens)
// - MongoDB database operations
// - JioSaavn API integration for music streaming
// - Session tracking across devices
// - Serving static frontend files
// ============================================================================

// Load environment variables from .env file
// PATH: .env file is in MAIN folder (go up one level from Servers, then into MAIN)
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, 'MAIN', '.env') });

// Import required dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const axios = require('axios');
// path already imported above

// Initialize Express application
const app = express();

// ========== CORS Configuration ==========
// Enable Cross-Origin Resource Sharing for API access
app.use(cors({
  origin: '*',                    // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// ========== Static File Serving ==========
// Serve frontend files from MAIN folder and Forentend folder
// PATH: MAIN folder contains index.html, player.html, etc.
// PATH: Forentend folder contains Templates and Static subfolders
// PATH: Admin folder contains admin panel files
const staticOptions = { fallthrough: true };
app.use(express.static(path.join(__dirname, 'MAIN'), staticOptions));
// Also mount the MAIN folder under the /MAIN path to support frontend links
app.use('/MAIN', express.static(path.join(__dirname, 'MAIN'), staticOptions));
app.use('/Forentend', express.static(path.join(__dirname, 'Forentend'), staticOptions));
app.use('/Admin', express.static(path.join(__dirname, 'Admin'), staticOptions));

// ========== MongoDB Database Connection ==========
// Connect to MongoDB Atlas using connection string from environment variables
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,  // Timeout for initial server selection
  socketTimeoutMS: 45000,          // Timeout for socket operations
})
  .then(() => {
    // Successfully connected to database
  })
  .catch(err => {
    // Failed to connect - exit application
    process.exit(1);
  });

// Handle MongoDB connection lifecycle events
mongoose.connection.on('disconnected', () => {
  // Database connection lost
});
mongoose.connection.on('error', (err) => {
  // Database error occurred
});

// ========== Database Models ==========
// Import User model for authentication
// PATH: User model is in MAIN/models folder (go up one level from Servers, then into MAIN/models)
const User = require("./MAIN/models/User");

// ========== Session Schema ==========
// Tracks user login sessions across different devices
// Sessions automatically expire after 7 days
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userAgent: { type: String },     // Full user agent string
  browser: { type: String },       // Parsed browser name and version
  os: { type: String },            // Operating system
  device: { type: String },        // Device type (Mobile/Desktop)
  ip: { type: String },            // IP address
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, expires: 604800 } // Auto-delete after 7 days (604800 seconds)
});

const Session = mongoose.model('Session', SessionSchema);

// ========== Parse User Agent String ==========
// Extracts browser, OS, and device type from user agent string
// Used for session tracking and device management
function parseUserAgent(userAgent) {
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/\/(\d+)/);
  const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
  const isMobile = /Mobile|Android|iPhone/.test(userAgent);

  return {
    browser: browser ? `${browser[1]} ${browser[2]}` : 'Unknown Browser',
    os: os ? os[1] : 'Unknown OS',
    device: isMobile ? 'Mobile' : 'Desktop'
  };
}

// ========== Health Check Endpoint ==========
// Simple endpoint to test if server is running
app.get("/ping", (req, res) => {
  res.send("pong");
});

// ========== Global Error Handlers ==========
// Catch unhandled errors to prevent server crashes
process.on('uncaughtException', (err) => {
  // Log uncaught exceptions
});
process.on('unhandledRejection', (reason, promise) => {
  // Log unhandled promise rejections
});

// ========== JWT Authentication Middleware ==========
// Protects routes by verifying JWT tokens
// Extracts token from Authorization header and validates it
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN" format

  if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

  // Verify token signature and expiration
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or Expired Token" });
    req.user = user;  // Attach user data to request
    next();           // Continue to route handler
  });
};

// ========== Combined Authentication Middleware ==========
// Accepts both user and admin tokens
const authenticateAny = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or Expired Token" });
    }

    // Set user or admin based on role
    if (decoded.role === 'admin') {
      req.admin = decoded;
    } else {
      req.user = decoded;
    }
    next();
  });
};

// ========== Get All Users (Protected Route) ==========
// Returns list of all registered users
// Requires valid JWT token (user or admin) for access
app.get("/users", authenticateAny, async (req, res) => {
  try {
    const users = await User.find();  // Note: Password field excluded by User model

    return res.json({
      count: users.length,
      users: users
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ========== Root Route ==========
// Serves the main landing/home page
// PATH: index.html is in MAIN folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'MAIN', 'index.html'));
});

// ========== User Login Route ==========
// Authenticates user credentials and returns JWT token
// Also creates a session record for device tracking
app.post("/login", async (req, res) => {
  try {
    const { email, pass } = req.body;

    // Validate required fields
    if (!email || !pass) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Find user by email (stored in username field)
    const user = await User.findOne({ username: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password using bcrypt
    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(pass, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Create session record for this login
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(userAgent);
    const ip = req.ip || req.connection.remoteAddress;

    await Session.create({
      userId: user._id,
      userAgent,
      browser,
      os,
      device,
      ip
    });

    // Generate JWT token and return success response
    return res.json({
      email: user.username,
      status: "ok",
      token: jwt.sign({ id: user._id, email: user.username }, process.env.JWT_SECRET, { expiresIn: '3d' })
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ========== User Signup/Registration Route ==========
// Creates new user account with hashed password
// Password hashing is handled automatically by User model pre-save hook
app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, dob, musicGenre, favoriteArtist } = req.body;

    console.log('[Signup] Request received:', { fullName, email, dob, musicGenre, favoriteArtist });

    // Validate required fields
    if (!fullName || !email || !password || !dob) {
      console.log('[Signup] Missing required fields');
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Check for existing user
    const already = await User.findOne({ username: email });
    if (already) {
      console.log('[Signup] User already exists:', email);
      return res.status(409).json({ message: "User already exists" });
    }

    // Create new user (password will be hashed by User model)
    console.log('[Signup] Creating new user...');
    const newUser = await User.create({
      fullName: fullName,
      username: email,
      password: password,  // Plain text here - User model hashes it automatically
      dob: dob,
      musicGenre: musicGenre || null,
      favoriteArtist: favoriteArtist || null
    });

    console.log('[Signup] User created successfully:', newUser.username);

    // Return success response
    return res.status(201).json({
      email: newUser.username,
      fullName: newUser.fullName,
      status: "account_created"
    });

  } catch (err) {
    console.error('[Signup Error]:', err.message);
    console.error('[Signup Error Stack]:', err.stack);
    return res.status(500).json({ 
      message: "Server error",
      error: err.message 
    });
  }
});
// ========== Get User Sessions (Protected Route) ==========
// Returns all active login sessions for the authenticated user
// Shows device, browser, OS, and activity information
app.get("/sessions", authenticateToken, async (req, res) => {
  try {
    // Find all sessions for this user, sorted by most recent activity
    const sessions = await Session.find({ userId: req.user.id }).sort({ lastActive: -1 });

    // Format session data for response
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      device: session.device,
      browser: session.browser,
      os: session.os,
      ip: session.ip,
      lastActive: session.lastActive,
      createdAt: session.createdAt
    }));

    return res.json({
      count: formattedSessions.length,
      sessions: formattedSessions
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ========== Delete User Account ==========
// Permanently removes user account from database
// Note: Should ideally be protected with authentication
app.delete("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user exists before deletion
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user from database
    await User.findByIdAndDelete(id);

    return res.json({
      message: "User deleted successfully",
      deletedId: id
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============================================================================
// ADMIN AUTHENTICATION & USER MANAGEMENT
// ============================================================================
// Admin panel routes for managing users and system administration
// Admin credentials are validated against environment variables
// ============================================================================

// ========== Admin Login Route ==========
// Authenticates admin credentials and returns JWT token
// Admin email and password are stored in environment variables
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Check against environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Admin777@gmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin117';
    const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Generate JWT token for admin
    const adminToken = jwt.sign(
      { email: ADMIN_EMAIL, role: 'admin', name: ADMIN_NAME },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      status: "ok",
      token: adminToken
    });

  } catch (err) {
    console.error('[Admin Login Error]:', err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ========== Admin Middleware ==========
// Verifies admin JWT token for protected admin routes
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or Expired Token" });
    }

    // Check if token has admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Access Denied: Admin Only" });
    }

    req.admin = decoded;
    next();
  });
};

// ========== Update User (Admin Only) ==========
// Allows admin to update user information
app.put("/admin/users/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, dob, musicGenre, favoriteArtist, password } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (dob) user.dob = dob;
    if (musicGenre !== undefined) user.musicGenre = musicGenre;
    if (favoriteArtist !== undefined) user.favoriteArtist = favoriteArtist;
    
    // Update password if provided (will be hashed by pre-save hook)
    if (password) {
      user.password = password;
    }

    await user.save();

    return res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        dob: user.dob,
        musicGenre: user.musicGenre,
        favoriteArtist: user.favoriteArtist
      }
    });

  } catch (err) {
    console.error('[Admin Update User Error]:', err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============================================================================
// JIOSAAVN API INTEGRATION
// ============================================================================
// These routes act as a proxy to JioSaavn's API for music search and streaming
// Bypasses CORS restrictions and provides a clean API for the frontend
// ============================================================================

// ========== JioSaavn Search Endpoint ==========
// Searches JioSaavn catalog for songs matching the query
// Returns formatted list of tracks with metadata
app.get("/api/saavn/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    console.log(`[JioSaavn Search] Query: ${q}`);

    // Build JioSaavn API URL with search query
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=50&p=1&q=${encodeURIComponent(q)}`;

    // Make request to JioSaavn API with proper headers
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.jiosaavn.com/",
      },
      timeout: 15000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;  // Accept all non-server-error responses
      }
    });

    console.log(`[JioSaavn Search] Response status: ${response.status}`);

    // Parse response (may be JSON string or object)
    let parsed;
    if (typeof response.data === 'string') {
      const jsonStart = response.data.indexOf("{");
      if (jsonStart === -1) {
        throw new Error('Invalid response format from JioSaavn');
      }
      parsed = JSON.parse(response.data.slice(jsonStart));
    } else {
      parsed = response.data;
    }

    // Extract song results from response
    const results = parsed.results || parsed.songs?.data || [];

    // Transform JioSaavn response format to our standardized format
    // Filter out non-song results (albums, playlists, etc.)
    const transformedSongs = results
      .filter(item => item.type === 'song' || !item.type)
      .map(song => ({
        id: song.id,
        name: song.title || song.song || song.name || 'Unknown',
        artists: song.more_info?.artistMap?.primary_artists?.map(a => a.name).join(', ') || 
                 song.more_info?.singers || 
                 song.subtitle || 
                 'Unknown Artist',
        album: song.more_info?.album || song.album || '',
        image: (song.image || '').replace('150x150', '500x500'),  // Request higher quality image
        duration: song.more_info?.duration || song.duration || '180',
        year: song.year || song.more_info?.release_date?.split('-')[0] || '',
        url: song.perma_url || song.url || '',
        language: song.language || '',
        preview: song.more_info?.encrypted_media_url || ''  // Encrypted URL for streaming
      }));

    // Remove duplicate songs based on song ID
    const uniqueSongs = [];
    const seenIds = new Set();
    for (const song of transformedSongs) {
      if (!seenIds.has(song.id)) {
        seenIds.add(song.id);
        uniqueSongs.push(song);
      }
    }

    console.log(`[JioSaavn Search] Found ${uniqueSongs.length} unique songs (${transformedSongs.length} total)`);
    res.json({ songs: uniqueSongs });

  } catch (err) {
    console.error('[JioSaavn Search Error]:', err.message);
    console.error('[JioSaavn Search Error Details]:', err.response?.data || 'No details');
    
    return res.status(500).json({ 
      error: "JioSaavn search failed", 
      message: err.message,
      details: err.response?.data || 'Unknown error',
      query: req.query.q
    });
  }
});

// ========== JioSaavn Song Details Endpoint ==========
// Fetches detailed information for a specific song by ID
// Includes encrypted media URLs for streaming
app.get("/api/saavn/song", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: "Song ID is required" });
    }

    // Build JioSaavn song details API URL
    const url = `https://www.jiosaavn.com/api.php?_format=json&__call=song.getDetails&pids=${id}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.jiosaavn.com/",
      },
      timeout: 10000
    });

    let parsed;
    if (typeof response.data === 'string') {
      const jsonStart = response.data.indexOf("{");
      if (jsonStart === -1) {
        throw new Error('Invalid response format from JioSaavn');
      }
      parsed = JSON.parse(response.data.slice(jsonStart));
    } else {
      parsed = response.data;
    }

    const song = parsed[id] || parsed;
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const encryptedUrl = song.encrypted_media_url || song.media_url || '';
    
    // Try to decrypt using JioSaavn's own decryption endpoint
    let media_url_320 = '';
    let media_url_160 = '';
    let media_url_96 = '';
    
    if (encryptedUrl) {
      try {
        // Use JioSaavn API to decrypt the URL
        const decryptResponse = await axios.get(
          `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&url=${encodeURIComponent(encryptedUrl)}&bitrate=320&api_version=4&_format=json&ctx=web6dot0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Referer": "https://www.jiosaavn.com/",
            },
            timeout: 10000
          }
        );

        let decryptedData = decryptResponse.data;
        if (typeof decryptedData === 'string') {
          const jsonStart = decryptedData.indexOf("{");
          if (jsonStart !== -1) {
            decryptedData = JSON.parse(decryptedData.slice(jsonStart));
          }
        }
        
        if (decryptedData.auth_url) {
          media_url_320 = decryptedData.auth_url;
          media_url_160 = media_url_320.replace('_320.mp4', '_160.mp4');
          media_url_96 = media_url_320.replace('_320.mp4', '_96.mp4');
        }
        
      } catch (decryptErr) {
        // Fallback: try direct construction
        media_url_320 = `https://aac.saavncdn.com${encryptedUrl}`.replace('_96.mp4', '_320.mp4');
      }
    }
    
    const songDetails = {
      id: song.id,
      name: song.song || song.title,
      album: song.album,
      year: song.year,
      duration: song.duration,
      label: song.label,
      primary_artists: song.primary_artists,
      singers: song.singers,
      image: song.image,
      media_url_320,
      media_url_160,
      media_url_96,
      perma_url: song.perma_url,
      language: song.language,
      encrypted_media_url: encryptedUrl // Include for debugging
    };

    return res.json(songDetails);

  } catch (err) {
    return res.status(500).json({ 
      error: "Failed to fetch song details", 
      message: err.message,
      details: err.response?.data || 'Unknown error'
    });
  }
});

// ========== JioSaavn Audio Streaming Proxy ==========
// Streams audio files from JioSaavn through our server
// Bypasses CORS restrictions by acting as a proxy
// Decrypts the media URL and pipes the audio stream to client
app.get("/api/saavn/stream/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Fetch song details to get encrypted media URL
    const songUrl = `https://www.jiosaavn.com/api.php?_format=json&__call=song.getDetails&pids=${id}`;
    
    const songResponse = await axios.get(songUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.jiosaavn.com/",
      },
      timeout: 10000
    });

    let parsed = songResponse.data;
    if (typeof songResponse.data === 'string') {
      const jsonStart = songResponse.data.indexOf("{");
      if (jsonStart !== -1) {
        parsed = JSON.parse(songResponse.data.slice(jsonStart));
      }
    }

    const song = parsed[id] || parsed;
    
    if (!song || !song.encrypted_media_url) {
      return res.status(404).json({ error: 'Song not found or no media URL' });
    }

    // Decrypt the media URL
    const encryptedUrl = song.encrypted_media_url;
    const decryptUrl = `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&url=${encodeURIComponent(encryptedUrl)}&bitrate=320&api_version=4&_format=json&ctx=web6dot0&_marker=0`;
    
    const decryptResponse = await axios.get(decryptUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://www.jiosaavn.com/",
      }
    });

    let audioUrl = decryptResponse.data;
    if (typeof audioUrl === 'object') {
      audioUrl = audioUrl.auth_url || audioUrl.url;
    }
    if (typeof audioUrl === 'string' && audioUrl.includes('{')) {
      const jsonStart = audioUrl.indexOf("{");
      const parsed = JSON.parse(audioUrl.slice(jsonStart));
      audioUrl = parsed.auth_url || parsed.url;
    }

    // Stream the audio file
    const audioResponse = await axios({
      method: 'GET',
      url: audioUrl,
      responseType: 'stream',
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.jiosaavn.com/",
        "Accept": "*/*",
      }
    });

    // Set appropriate headers
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Pipe the audio stream to response
    audioResponse.data.pipe(res);

  } catch (err) {
    return res.status(500).json({ 
      error: "Failed to stream audio", 
      message: err.message
    });
  }
});

// ============================================================================
// END JIOSAAVN API ROUTES
// ============================================================================

// ========== HTML Page Routes ==========
// Serve static HTML pages for the application

// Music player page
// PATH: player.html is in MAIN folder
app.get('/player.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'MAIN', 'player.html'));
});

// User settings page
// PATH: settings.html is in MAIN folder
app.get('/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'MAIN', 'settings.html'));
});

// Login page
// PATH: LoginPage.html is in Forentend/Templates folder
app.get('/Forentend/Templates/LoginPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Forentend', 'Templates', 'LoginPage.html'));
});

// Registration page
// PATH: RegisterPage.html is in Forentend/Templates folder
app.get('/Forentend/Templates/RegisterPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Forentend', 'Templates', 'RegisterPage.html'));
});
app.get('/Forentend/Templates/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Forentend', 'Templates', 'index.html'));
});
 
// ========== Server Startup ==========
// Start the Express server on specified port
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ========== Error Handlers ==========
// Handle server-level errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// ========== Graceful Shutdown ==========
// Handle SIGTERM signal for graceful shutdown (e.g., from hosting platforms)
process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});

// ========== Export for Serverless Deployment ==========
// Export app for serverless platforms like Vercel
module.exports = app;