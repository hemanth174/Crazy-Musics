require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');

const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());

// Serve static files from the root directory and Forentend folder
app.use(express.static(__dirname));
app.use('/Forentend', express.static(path.join(__dirname, 'Forentend')));

// MongoDB connection with better options
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log("MongoDB Connected ✔"))
  .catch(err => {
    console.error("Mongo Error ❌:", err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});


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
  console.log("Ping received");
  res.send("pong");
});

// Global error handler
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

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

//-------------------------- LOGIN ROUTE ----------------------------
app.post("/login", async (req, res) => {
  try {
    const { email, pass } = req.body;
    console.log("Login attempt for:", email);

    if (!email || !pass) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Schema uses 'username', but frontend sends 'email'. 
    // Assuming username stores the email.
    const user = await User.findOne({ username: email });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(pass, user.password);

    if (!valid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Incorrect password" });
    }

    console.log("Login successful");
    
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
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// --------------------Signup----------------------
app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, dob, musicGenre, favoriteArtist } = req.body;
    console.log("Signup attempt for:", email);

    // 1) Required fields check
    if (!fullName || !email || !password || !dob) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // 2) Check if user already exists
    const already = await User.findOne({ username: email });
    if (already) {
      console.log("User already exists");
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

    console.log("User created:", newUser.username);

    // 4) Success
    return res.status(201).json({
      email: newUser.username,
      fullName: newUser.fullName,
      status: "account_created"
    });

  } catch (err) {
    console.error("Signup Error:", err);
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
    console.error("Sessions Error:", err);
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



// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server Running on Port ${PORT}`));

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
