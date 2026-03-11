const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const db = require('../db');

const router = express.Router();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure multer for memory storage with validation
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
        }
    }
});

// Helper for multer error handling
const handleUpload = upload.single('image');
const uploadMiddleware = (req, res, next) => {
    handleUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

const uploadToStorage = async (fileBuffer, originalname, mimetype) => {
    // If Supabase isn't configured, fall back to mock
    if (supabaseUrl.includes('placeholder')) {
        console.warn("Supabase not configured. Returning mock image URL.");
        return `https://storage.placeholder.com/${Date.now()}_${originalname}`;
    }

    const filename = `${Date.now()}-${originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const { data, error } = await supabase.storage
        .from('mirro-images')
        .upload(filename, fileBuffer, {
            contentType: mimetype,
            upsert: false
        });

    if (error) {
        console.error("Supabase Upload Error:", error);
        throw new Error('Failed to upload to storage provider');
    }

    const { data: publicUrlData } = supabase.storage
        .from('mirro-images')
        .getPublicUrl(filename);

    return publicUrlData.publicUrl;
};

// Upload user image (front/side)
router.post('/user-image', uploadMiddleware, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
    }

    const { type, userId } = req.body;
    if (!['front', 'side'].includes(type)) {
        return res.status(400).json({ error: 'Type must be front or side' });
    }

    try {
        const imageUrl = await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype);

        const result = await db.query(
            'INSERT INTO UserImages (user_id, image_url, type) VALUES ($1, $2, $3) RETURNING *',
            [userId || 'mock-id', imageUrl, type]
        );

        res.status(201).json(result.rows[0] || { image_url: imageUrl, type });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload user image' });
    }
});

// Upload clothing image
router.post('/clothing-image', uploadMiddleware, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
    }

    const { source, userId } = req.body;
    if (!['camera', 'gallery', 'link'].includes(source)) {
        return res.status(400).json({ error: 'Source must be camera, gallery, or link' });
    }

    try {
        const imageUrl = await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype);

        const result = await db.query(
            'INSERT INTO ClothingImages (user_id, image_url, source) VALUES ($1, $2, $3) RETURNING *',
            [userId || 'mock-id', imageUrl, source]
        );

        res.status(201).json(result.rows[0] || { image_url: imageUrl, source });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload clothing image' });
    }
});

module.exports = router;
