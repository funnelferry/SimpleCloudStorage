const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Define the directory for uploads
const baseUploadDirectory = path.join(__dirname, '..', 'uploads');

// Ensure base upload directory exists
fs.mkdirSync(baseUploadDirectory, { recursive: true });

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const userUploadDirectory = path.join(baseUploadDirectory, req.user.username);

    // Ensure user's upload directory exists
    fs.mkdirSync(userUploadDirectory, { recursive: true });

    cb(null, userUploadDirectory)
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname)
  }
});

// Initialize upload
const upload = multer({
  storage: storage
});

module.exports = upload;
