const multer = require('multer');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Keep the file in memory; we stream the buffer straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, 'Only JPG, PNG, WEBP or GIF images are allowed'));
  },
});

// @route POST /api/uploads/image  (protected, multipart field: "image")
const uploadImage = asyncHandler(async (req, res) => {
  if (!isConfigured()) {
    throw new ApiError(503, 'Image uploads are not configured. Set the Cloudinary environment variables.');
  }
  if (!req.file) throw new ApiError(400, 'No image file provided');

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'skillswap', resource_type: 'image' },
      (err, uploaded) => (err ? reject(err) : resolve(uploaded))
    );
    stream.end(req.file.buffer);
  });

  res.status(201).json({ success: true, url: result.secure_url, publicId: result.public_id });
});

module.exports = { upload, uploadImage };
