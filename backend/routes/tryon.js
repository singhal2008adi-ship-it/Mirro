const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../db");
const { getDriveClient } = require("../googleClient");
const { Readable } = require("stream");
require("dotenv").config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const uploadBase64ToDrive = async (base64Data, filename) => {
  if (!DRIVE_FOLDER_ID) return null;
  
  const drive = getDriveClient();
  const buffer = Buffer.from(base64Data, 'base64');
  
  const fileMetadata = {
    name: filename,
    parents: [DRIVE_FOLDER_ID],
  };
  const media = {
    mimeType: 'image/jpeg',
    body: Readable.from(buffer),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });

  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return `https://lh3.googleusercontent.com/u/0/d/${file.data.id}`;
};

router.post(
  "/tryon",
  upload.fields([
    { name: "person_image", maxCount: 1 },
    { name: "clothing_image", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.person_image || !req.files.clothing_image) {
        return res.status(400).json({ success: false, error: "Missing images" });
      }

      const personBuffer = req.files.person_image[0].buffer;
      const clothingBuffer = req.files.clothing_image[0].buffer;
      const personBase64 = personBuffer.toString("base64");
      const clothingBase64 = clothingBuffer.toString("base64");
      const personMimeType = req.files.person_image[0].mimetype;
      const clothingMimeType = req.files.clothing_image[0].mimetype;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const result = await model.generateContent([
        { inlineData: { mimeType: personMimeType, data: personBase64 } },
        { inlineData: { mimeType: clothingMimeType, data: clothingBase64 } },
        "Generate a realistic virtual try-on image of the person wearing the clothing. Return ONLY the base64 data of the image if possible, or a detailed description."
      ]);

      const response = await result.response;
      const generatedContent = response.text();

      // Store in Sheets/Drive if folder is set
      let generatedImageUrl = "";
      if (generatedContent.length > 500) { // Simple check if it's base64 or text
         // If it looks like base64, save to Drive
         try {
           generatedImageUrl = await uploadBase64ToDrive(generatedContent.replace(/^data:image\/\w+;base64,/, ""), `tryon_${Date.now()}.jpg`);
         } catch (e) {
           console.warn("Failed to store generated image in Drive:", e.message);
         }
      }

      // Record in DB (Google Sheets)
      try {
        await db.query(
          'INSERT INTO TryOnResults (user_id, clothing_image, person_image, generated_image, product_name) VALUES ($1, $2, $3, $4, $5)',
          ['user-1', 'uploaded-to-drive', 'uploaded-to-drive', generatedImageUrl || 'base64-content', 'AI Result']
        );
      } catch (e) {
        console.warn("Failed to record result in Sheets:", e.message);
      }

      res.json({
        success: true,
        image: generatedContent
      });

    } catch (error) {
      console.error("Gemini try-on error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;
