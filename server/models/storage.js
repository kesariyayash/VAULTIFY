const mongoose = require('mongoose');

const storageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Assuming user IDs are MongoDB ObjectIds
    required: true,
    ref: 'User' // Reference to your User model
  },
  gridFsFileId: { // New field to store the ID of the file in GridFS
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true // Each entry points to a unique GridFS file
  },
  originalFileName: {
    type: String,
    required: true
  },
  encryptionType: {
    type: String,
    required: true,
    enum: ['AES'] // Only AES for now
  },
  encrypted: {
    type: Boolean,
    default: true // All files uploaded via this flow will be encrypted
  },
  iv: { // Store the Initialization Vector (IV) as a base64 string
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Storage', storageSchema);