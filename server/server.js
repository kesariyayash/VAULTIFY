const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const storageRoutes = require('./routes/storageRoutes'); // This will now receive `gfsBucket` directly

// Load .env variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies (still needed for other routes)

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