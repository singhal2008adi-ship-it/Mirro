const express = require('express');
const axios = require('axios');
const db = require('../db');

const router = express.Router();
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// POST /generate-tryon
router.post('/', async (req, res) => {
    const { userId, clothingImageId, personImageId } = req.body;

    if (!clothingImageId || !personImageId) {
        return res.status(400).json({ error: 'clothingImageId and personImageId are required' });
    }

    try {
        // 1. Fetch image URLs from DB
        const clothingRes = await db.query('SELECT image_url FROM ClothingImages WHERE id = $1', [clothingImageId]);
        const personRes = await db.query('SELECT image_url FROM UserImages WHERE id = $1', [personImageId]);

        if (clothingRes.rows.length === 0 || personRes.rows.length === 0) {
            return res.status(404).json({ error: 'Images not found' });
        }

        const clothingImageUrl = clothingRes.rows[0].image_url;
        const personImageUrl = personRes.rows[0].image_url;

        // 2. Call Python AI Microservice
        // const response = await axios.post(`${PYTHON_SERVICE_URL}/try-on`, {
        //   clothing_image_url: clothingImageUrl,
        //   person_image_url: personImageUrl
        // });
        // const generatedImageUrl = response.data.generated_image_url;

        // Mock response for now
        const generatedImageUrl = 'https://via.placeholder.com/600x800?text=Try-On+Result';

        // 3. Save result to TryOnResults table
        let resultId = null;
        if (userId) {
            const dbResult = await db.query(
                'INSERT INTO TryOnResults (user_id, clothing_image, person_image, generated_image) VALUES ($1, $2, $3, $4) RETURNING id',
                [userId, clothingImageUrl, personImageUrl, generatedImageUrl]
            );
            resultId = dbResult.rows[0].id;
        }

        res.status(201).json({
            id: resultId,
            clothing_image: clothingImageUrl,
            person_image: personImageUrl,
            generated_image: generatedImageUrl
        });
    } catch (error) {
        console.error('Try-On error:', error);
        res.status(500).json({ error: 'Failed to generate try-on result' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM TryOnResults WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Result not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Fetch try-on result error:', error);
        res.status(500).json({ error: 'Failed to fetch try-on result' });
    }
});

module.exports = router;
