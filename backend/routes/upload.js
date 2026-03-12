const express = require('express');
const multer = require('multer');
const { getDriveClient } = require('../googleClient');
const db = require('../db');
const { Readable } = require('stream');
require('dotenv').config();

const router = express.Router();
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadMiddleware = upload.single('image');

const uploadToDrive = async (fileBuffer, originalname, mimetype) => {
  if (!DRIVE_FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not set');
  }

  const drive = getDriveClient();
  const fileMetadata = {
    name: `${Date.now()}_${originalname}`,
    parents: [DRIVE_FOLDER_ID],
  };
  const media = {
    mimeType: mimetype,
    body: Readable.from(fileBuffer),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  // Make it public
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Return a direct link if possible or the webViewLink
  // For images, webContentLink is often better but can be unreliable for direct embedding without certain tweaks
  // However, Drive API doesn't give a "direct" static URL like S3 easily. 
  // We'll return a structured ID-based link that is commonly used for thumbnails/previews.
  return `https://lh3.googleusercontent.com/u/0/d/${file.data.id}`;
};

router.post('/user-image', uploadMiddleware, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const { type, userId } = req.body;
  try {
    const imageUrl = await uploadToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);
    const result = await db.query(
      'INSERT INTO UserImages (user_id, image_url, type) VALUES ($1, $2, $3) RETURNING *',
      [userId || 'user-1', imageUrl, type || 'front']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Drive Upload Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/clothing-image', uploadMiddleware, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const { source, userId } = req.body;
  try {
    const imageUrl = await uploadToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);
    const result = await db.query(
      'INSERT INTO ClothingImages (user_id, image_url, source) VALUES ($1, $2, $3) RETURNING *',
      [userId || 'user-1', imageUrl, source || 'gallery']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Drive Upload Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
