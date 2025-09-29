const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/userRoutes');
const storageRoutes = require('./routes/storageRoutes'); // This will now receive `gfsBucket` directly

// Load .env variables
dotenv.config();
const corsOrigin = process.env.CORS_ORIGIN;

// Initialize app
const app = express();

// Security middleware
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors({
  origin: corsOrigin, // Restrict to frontend origin
  credentials: true
}));

// Rate limiting to prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' })); // Limit request body size
app.disable('x-powered-by'); // Hide Express

// MongoDB Connection
let GridFSBucket; // For the newer GridFS API

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('✅ MongoDB connected');

  const conn = mongoose.connection;

  // Initialize GridFSBucket directly from mongoose.mongo
  GridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads' // This is the name of your GridFS collection
  });
  app.locals.GridFSBucket = GridFSBucket; // Make it accessible in routes/controllers

  // Pass GridFSBucket to storageRoutes
  // We no longer need to pass ImageStorageModel here if it's only used for metadata,
  // as the Storage model is directly imported in the controller.
  app.use('/api/storage', storageRoutes(GridFSBucket)); // Pass GridFSBucket
  app.use('/api/users', userRoutes);

})
.catch((err) => console.error('❌ MongoDB connection error:', err));


// Root route (optional)
app.get('/', (req, res) => {
  res.send('🚀 StorageBox Server is Running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});