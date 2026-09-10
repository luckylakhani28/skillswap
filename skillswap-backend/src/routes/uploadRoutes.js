const express = require('express');
const { protect } = require('../middleware/auth');
const { upload, uploadImage } = require('../controllers/uploadController');

const router = express.Router();

router.post('/image', protect, upload.single('image'), uploadImage);

module.exports = router;
