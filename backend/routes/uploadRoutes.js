
const express = require('express');
const multer = require('multer');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const {
    cloudinary,
    isCloudinaryConfigured
} = require('../utils/cloudinary');

const router = express.Router();

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

// Store files temporarily in memory.
const storage = multer.memoryStorage();

// Validate uploaded image formats and sizes.
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_IMAGES
    },
    fileFilter: (req, file, callback) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
                new Error('Only JPEG, PNG, and WebP images are allowed.')
            );
        }

        callback(null, true);
    }
});

// Upload one image buffer to Cloudinary.
function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'EventEase/events',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    width: result.width,
                    height: result.height
                });
            }
        );

        stream.end(file.buffer);
    });
}

// POST /api/uploads/images
// Organizer-only image upload endpoint.
router.post(
    '/images',
    authMiddleware,
    roleMiddleware('organizer'),
    (req, res, next) => {
        upload.array('images', MAX_IMAGES)(req, res, async error => {
            if (error) {
                if (error instanceof multer.MulterError) {
                    return res.status(400).json({
                        success: false,
                        message: error.code === 'LIMIT_FILE_SIZE'
                            ? 'Each image must be 5 MB or smaller.'
                            : 'You can upload a maximum of 8 images.'
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            try {
                if (!isCloudinaryConfigured()) {
                    return res.status(500).json({
                        success: false,
                        message: 'Image upload service is not configured.'
                    });
                }

                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please select at least one image.'
                    });
                }

                const results = await Promise.all(
                    req.files.map(uploadToCloudinary)
                );

                return res.status(200).json({
                    success: true,
                    message: 'Images uploaded successfully.',
                    images: results
                });

            } catch (uploadError) {
                console.error(
                    'Cloudinary upload error:',
                    uploadError.message
                );

                return res.status(500).json({
                    success: false,
                    message: 'One or more images could not be uploaded.'
                });
            }
        });
    }
);

module.exports = router;
