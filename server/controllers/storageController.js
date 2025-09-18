const Storage = require('../models/storage'); // This model will now store metadata, not the image itself
const crypto = require('crypto');
const mongoose = require('mongoose'); // Import mongoose to use mongoose.Types.ObjectId

// Helper function for AES Encryption
const encryptBuffer = (buffer, key, iv) => {
    const algorithm = 'aes-256-cbc'; // Or another mode like GCM for authenticated encryption
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
};

// Upload and store image metadata
exports.uploadImage = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming verifyToken middleware sets req.user.userId
    const { encryptionType, encryptionKey } = req.body; // Other form fields
    const imageFile = req.file; // The file buffer from multer

    if (!imageFile) {
      return res.status(400).json({ message: 'No image file provided.' });
    }
    if (!encryptionKey || encryptionKey.length === 0) {
      return res.status(400).json({ message: 'Encryption key is required.' });
    }
    if (encryptionType !== 'AES') { // Basic check, expand as needed
      return res.status(400).json({ message: 'Unsupported encryption type. Only AES is supported.' });
    }

    // --- Key Derivation (CRITICAL for security and proper key length) ---
    const encryptionKeyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();

    // Generate a unique IV for each encryption (16 bytes for AES CBC)
    const iv = crypto.randomBytes(16);

    // Encrypt the image buffer
    const encryptedImageBuffer = encryptBuffer(imageFile.buffer, encryptionKeyBuffer, iv);

    // Get GridFSBucket from req (attached in storageRoutes)
    const GridFSBucket = req.GridFSBucket;

    // --- Store encrypted image in GridFS ---
    const uploadStream = GridFSBucket.openUploadStream(imageFile.originalname, {
        contentType: 'application/octet-stream', // Store encrypted data as generic binary
        metadata: {
            userId: userId,
            encryptionType: encryptionType,
            iv: iv.toString('base64'), // Store IV as base64 string (essential for decryption)
            originalFileName: imageFile.originalname,
            originalMimeType: imageFile.mimetype, // Store original MIME type for later display
            uploadedAt: new Date()
        }
    });

    uploadStream.end(encryptedImageBuffer); // Write the encrypted buffer to the stream

    uploadStream.on('finish', async () => {
        // After successful GridFS upload, save metadata to your Storage model
        const newEntry = await Storage.create({
            user: userId,
            gridFsFileId: uploadStream.id, // Store the GridFS file ID
            originalFileName: imageFile.originalname,
            encryptionType: encryptionType,
            encrypted: true, // Always true since we just encrypted it
            iv: iv.toString('base64') // Store IV here too for easy access
        });

        res.status(201).json({
          message: 'Image uploaded and encrypted successfully!',
          data: newEntry,
          fileId: uploadStream.id // Return GridFS file ID
        });
    });

    uploadStream.on('error', (error) => {
        console.error('Error writing to GridFS:', error);
        res.status(500).json({ message: 'Failed to save encrypted image to storage.', error: error.message });
    });

  } catch (err) {
    console.error('Error during image upload:', err);
    res.status(500).json({ message: 'Internal server error during image upload.', error: err.message });
  }
};

// Get all images for a user (now fetches metadata from Storage model)
exports.getUserImages = async (req, res) => {
  try {
    const { userId } = req.user;
    // We now fetch metadata from our Storage model
    const images = await Storage.find({ user: userId }).sort({ uploadedAt: -1 });
    res.status(200).json({ images });
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: 'Error fetching images', error: err.message });
  }
};

// View a single image (requires decryption logic)
exports.viewImage = async (req, res) => {
  try {
    const { id } = req.params; // This 'id' should be the gridFsFileId
    const { encryptionKey } = req.body; // User provides the key for decryption
    const { userId } = req.user;

    const GridFSBucket = req.GridFSBucket;

    // Find the metadata in your Storage model first
    const imageMetadata = await Storage.findOne({ gridFsFileId: id, user: userId });
    if (!imageMetadata) {
        return res.status(404).json({ message: 'Image metadata not found or unauthorized.' });
    }
    if (!imageMetadata.encrypted) {
        return res.status(400).json({ message: 'Image is not encrypted.' });
    }
    if (!encryptionKey) {
        return res.status(400).json({ message: 'Decryption key is required.' });
    }
    if (!imageMetadata.iv) {
        return res.status(500).json({ message: 'Image IV not found for decryption.' });
    }

    // Derive the key from the user-provided string (same method as encryption)
    const decryptionKeyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();
    const ivBuffer = Buffer.from(imageMetadata.iv, 'base64');

    // Fetch the encrypted image from GridFS
    const downloadStream = GridFSBucket.openDownloadStream(new mongoose.Types.ObjectId(id)); // Use new ObjectId for lookup
    let encryptedChunks = [];

    downloadStream.on('data', (chunk) => {
        encryptedChunks.push(chunk);
    });

    downloadStream.on('error', (error) => {
        console.error('Error downloading from GridFS:', error);
        return res.status(500).json({ message: 'Failed to retrieve encrypted image.', error: error.message });
    });

    downloadStream.on('end', () => {
        const encryptedBuffer = Buffer.concat(encryptedChunks);

        try {
            const algorithm = 'aes-256-cbc';
            const decipher = crypto.createDecipheriv(algorithm, decryptionKeyBuffer, ivBuffer);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            // Set appropriate headers for image display
            res.set('Content-Type', imageMetadata.originalMimeType);
            res.send(decrypted); // Send the decrypted image buffer
        } catch (decryptError) {
            console.error('Decryption failed:', decryptError);
            return res.status(403).json({ message: 'Decryption failed. Invalid key or corrupted data.' });
        }
    });

  } catch (err) {
    console.error('Error viewing image:', err);
    res.status(500).json({ message: 'Error viewing image', error: err.message });
  }
};

// NEW: Delete Image function
exports.deleteImage = async (req, res) => {
  try {
    const { userId } = req.user; // Get userId from authenticated token
    const { id } = req.params; // This 'id' is expected to be the gridFsFileId from the frontend

    const GridFSBucket = req.GridFSBucket;

    // 1. Find the metadata in your Storage model first AND verify ownership
    const imageMetadata = await Storage.findOne({ gridFsFileId: id, user: userId });

    if (!imageMetadata) {
      return res.status(404).json({ message: 'Image not found or unauthorized to delete.' });
    }

    // 2. Delete the file from GridFS
    // GridFSBucket.delete expects an ObjectId
    await GridFSBucket.delete(new mongoose.Types.ObjectId(id));
    console.log(`GridFS file ${id} deleted.`);

    // 3. Delete the corresponding metadata from your Storage model
    await Storage.deleteOne({ _id: imageMetadata._id }); // Delete using the metadata document's _id
    console.log(`Storage metadata for ${id} deleted.`);

    res.status(200).json({ message: 'Image deleted successfully.' });

  } catch (err) {
    console.error('Error deleting image:', err);
    // Specific error handling for GridFS delete failure
    if (err.code === 'ENOENT') { // File not found in GridFS (can happen if already deleted)
        return res.status(404).json({ message: 'Error: File not found in storage.' });
    }
    res.status(500).json({ message: 'Error deleting image', error: err.message });
  }
};