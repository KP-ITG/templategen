const multer = require('multer');
const path = require('path');

// Konfigurasi storage untuk multer
const storage = multer.memoryStorage();

// File filter untuk validasi tipe file
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Konfigurasi upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // Default 10MB
    files: 5 // Maksimal 5 file per request
  }
});

// Middleware untuk handle multer errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large',
        details: `Maximum file size is ${(parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024) / (1024 * 1024)}MB`
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        details: 'Maximum 5 files per request'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'File upload error',
      details: error.message
    });
  }

  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      details: error.message
    });
  }

  next(error);
};

module.exports = {
  upload,
  handleUploadError
};
