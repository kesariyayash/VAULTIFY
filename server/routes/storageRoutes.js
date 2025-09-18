const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = (GridFSBucket) => {
  router.post('/upload', verifyToken, upload.single('imageFile'), (req, res, next) => {
    req.GridFSBucket = GridFSBucket;
    storageController.uploadImage(req, res, next);
  });

  router.get('/my-images', verifyToken, storageController.getUserImages);

  router.post('/view/:id', verifyToken, (req, res, next) => {
    req.GridFSBucket = GridFSBucket;
    storageController.viewImage(req, res, next);
  });

  // NEW: DELETE route for images
  router.delete('/:id', verifyToken, (req, res, next) => { // :id will be the gridFsFileId
    req.GridFSBucket = GridFSBucket;
    storageController.deleteImage(req, res, next);
  });

  return router;
};