const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const db = require('../db');
require('dotenv').config();

const router = express.Router();
const ZYTE_API_KEY = process.env.ZYTE_API_KEY;

// Helper to call Zyte AI script
const scrapeWithZyte = (url) => {
  return new Promise((resolve, reject) => {
    if (!ZYTE_API_KEY) {
      return reject(new Error('ZYTE_API_KEY not set'));
    }

    const scriptPath = path.join(__dirname, '../../scripts/fetch_product.py');
    const command = `python3 "${scriptPath}" "${ZYTE_API_KEY}" "${url}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Zyte Exec Error:', stderr);
        return reject(error);
      }
      try {
        // The script might print debug info, we need to find the JSON part
        const jsonMatch = stdout.match(/\{.*\}/s);
        if (jsonMatch) {
          resolve(JSON.parse(jsonMatch[0]));
        } else {
          reject(new Error('No JSON output from Zyte script'));
        }
      } catch (e) {
        reject(e);
      }
    });
  });
};

// POST /extract
router.post('/extract', async (req, res) => {
  const { url, userId } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const scrapedData = await scrapeWithZyte(url);
    
    const productData = {
      productName: scrapedData.name || 'Unknown Product',
      imageUrl: scrapedData.mainImage ? scrapedData.mainImage.url : '',
      scrapedPrice: scrapedData.price || '',
      source: 'link'
    };

    let savedImageId = null;
    if (userId) {
      const result = await db.query(
        'INSERT INTO ClothingImages (user_id, image_url, source) VALUES ($1, $2, $3) RETURNING id',
        [userId, productData.imageUrl, 'link']
      );
      savedImageId = result.rows[0].id;
    }

    res.json({ ...productData, id: savedImageId });
  } catch (error) {
    console.error('Extraction error:', error.message);
    res.status(500).json({ error: 'Failed to extract product using Zyte AI' });
  }
});

// GET /compare-prices?product_name=
router.get('/compare-prices', async (req, res) => {
  const { product_name } = req.query;
  if (!product_name) return res.status(400).json({ error: 'product_name required' });

  // For now, keeping the mock comparisons but they could be extended to use Zyte for real searches
  const basePrice = 1200;
  const comparisons = [
    { marketplace: 'Amazon India', price: `₹${basePrice + 50}`, shipping_cost: 'Free', product_url: '#', image_url: 'https://via.placeholder.com/150?text=Amazon' },
    { marketplace: 'Flipkart', price: `₹${basePrice - 20}`, shipping_cost: '₹40', product_url: '#', image_url: 'https://via.placeholder.com/150?text=Flipkart' },
    { marketplace: 'Myntra', price: `₹${basePrice + 100}`, shipping_cost: 'Free', product_url: '#', image_url: 'https://via.placeholder.com/150?text=Myntra' }
  ];
  res.json(comparisons);
});

// GET /similar-suggestions?product_name=
router.get('/similar-suggestions', async (req, res) => {
  const suggestions = [
    { id: '1', title: 'Alternative A', price: '₹899', marketplace: 'Myntra', image_url: 'https://via.placeholder.com/300x400', link: '#' },
    { id: '2', title: 'Alternative B', price: '₹1499', marketplace: 'Ajio', image_url: 'https://via.placeholder.com/300x400', link: '#' }
  ];
  res.json(suggestions);
});

module.exports = router;
