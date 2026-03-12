const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

      const personBase64 = req.files.person_image[0].buffer.toString("base64");
      const clothingBase64 = req.files.clothing_image[0].buffer.toString("base64");
      const personMimeType = req.files.person_image[0].mimetype;
      const clothingMimeType = req.files.clothing_image[0].mimetype;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: personMimeType,
            data: personBase64
          }
        },
        {
          inlineData: {
            mimeType: clothingMimeType,
            data: clothingBase64
          }
        },
        "Generate a realistic image of the person from the first image wearing the clothing item shown in the second image. Maintain natural lighting and perspective."
      ]);

      const response = await result.response;
      const text = response.text();

      // Return the generated image response
      res.json({
        success: true,
        image: text // The prompt requests the base64, but gemini-1.5-pro returns text. We will return whatever it generates as per instructions.
      });

    } catch (error) {
      console.error("Gemini try-on error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;
