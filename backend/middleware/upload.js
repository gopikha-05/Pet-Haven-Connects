import multer from 'multer';

// Memory storage keeps files as buffers in memory so we can upload them directly to S3
const storage = multer.memoryStorage();

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// File filter validation
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP formats are allowed.'), false);
  }
};

// Reusable upload middleware configured with memory storage, file filter, and 5MB size limit
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});
