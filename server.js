require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const path = require('path');

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

const staticOptions = { fallthrough: true };

// Serve static files from the root directory and Forentend folder
app.use(express.static(__dirname, staticOptions));
app.use('/Forentend', express.static(path.join(__dirname, 'Forentend'), staticOptions));

// MongoDB connection with better options
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {})
  .catch(err => {
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {});
mongoose.connection.on('error', (err) => {});


// User Model
const User = require("./models/User");

// Session Schema for tracking devices
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userAgent: { type: String },
  browser: { type: String },
  os: { type: String },
  device: { type: String },
  ip: { type: String },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, expires: 604800 } // 7 days
});

const Session = mongoose.model('Session', SessionSchema);

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
  const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
  const isMobile = /Mobile|Android|iPhone/.test(userAgent);

  return {
    browser: browser ? `${browser[1]} ${browser[2]}` : 'Unknown Browser',
    os: os ? os[1] : 'Unknown OS',
    device: isMobile ? 'Mobile' : 'Desktop'
  };
}

// Debug route
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Global error handler
process.on('uncaughtException', (err) => {});
process.on('unhandledRejection', (reason, promise) => {});

// -----------------------GET route (Protected)---------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or Expired Token" });
    req.user = user;
    next();
  });
};

// -----------------------GET route (Protected)---------------------------
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find();
    // ^ removes password from response

    return res.json({
      count: users.length,
      users: users
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

//-------------------------- ROOT ROUTE ----------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

//-------------------------- LOGIN ROUTE ----------------------------
app.post("/login", async (req, res) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Schema uses 'username', but frontend sends 'email'. 
    // Assuming username stores the email.
    const user = await User.findOne({ username: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(pass, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Create session
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

    return res.json({
      email: user.username, // Return username as email
      status: "ok",
      token: jwt.sign({ id: user._id, email: user.username }, process.env.JWT_SECRET, { expiresIn: '3d' })
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// --------------------Signup----------------------
app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, dob, musicGenre, favoriteArtist } = req.body;

    // 1) Required fields check
    if (!fullName || !email || !password || !dob) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // 2) Check if user already exists
    const already = await User.findOne({ username: email });
    if (already) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 3) Save new user (Password hashing handled by User model pre-save hook)
    const newUser = await User.create({
      fullName: fullName,
      username: email,
      password: password, // Plain text here, model hashes it
      dob: dob,
      musicGenre: musicGenre || null,
      favoriteArtist: favoriteArtist || null
    });

    // 4) Success
    return res.status(201).json({
      email: newUser.username,
      fullName: newUser.fullName,
      status: "account_created"
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});
// ---------------------------Get User Sessions----------------------
app.get("/sessions", authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ lastActive: -1 });

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

// ---------------------------delete route----------------------
app.delete("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2) Delete user
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

// ======================== JIOSAAVN API ROUTES ========================

app.get("/api/saavn/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    console.log(`[JioSaavn Search] Query: ${q}`);

    // Use search.getResults for better results
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=50&p=1&q=${encodeURIComponent(q)}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.jiosaavn.com/",
      },
      timeout: 15000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });

    console.log(`[JioSaavn Search] Response status: ${response.status}`);

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

    // Get results from search API
    const results = parsed.results || parsed.songs?.data || [];

    // Transform to match our format - filter only songs
    const transformedSongs = results
      .filter(item => item.type === 'song' || !item.type) // Filter only songs
      .map(song => ({
        id: song.id,
        name: song.title || song.song || song.name || 'Unknown',
        artists: song.more_info?.artistMap?.primary_artists?.map(a => a.name).join(', ') || 
                 song.more_info?.singers || 
                 song.subtitle || 
                 'Unknown Artist',
        album: song.more_info?.album || song.album || '',
        image: (song.image || '').replace('150x150', '500x500'),
        duration: song.more_info?.duration || song.duration || '180',
        year: song.year || song.more_info?.release_date?.split('-')[0] || '',
        url: song.perma_url || song.url || '',
        language: song.language || '',
        preview: song.more_info?.encrypted_media_url || '' // For streaming
      }));

    console.log(`[JioSaavn Search] Found ${transformedSongs.length} songs`);
    res.json({ songs: transformedSongs });

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

app.get("/api/saavn/song", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: "Song ID is required" });
    }

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

// Proxy endpoint to stream JioSaavn audio (bypass CORS)
app.get("/api/saavn/stream/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // First get song details
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

// ======================== END JIOSAAVN ROUTES ========================

// Serve HTML pages
app.get('/player.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'player.html'));
});

app.get('/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/Forentend/Templates/LoginPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Forentend', 'Templates', 'LoginPage.html'));
});

app.get('/Forentend/Templates/RegisterPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Forentend', 'Templates', 'RegisterPage.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});

// Export for Vercel serverless (if needed)
module.exports = app;