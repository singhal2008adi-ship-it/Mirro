const express = require('express');
const puppeteer = require('puppeteer');
const db = require('../db');

const router = express.Router();

// Helper to scrape basic product info
const scrapeProductInfo = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set a timeout of 10s so the API doesn't hang forever
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

        const productData = await page.evaluate(() => {
            // Look for standard Open Graph meta tags
            const getMeta = (prop) => {
                const el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop.replace('og:', '')}"]`);
                return el ? el.getAttribute('content') : null;
            };

            const title = getMeta('og:title') || document.title || 'Unknown Product';
            const image = getMeta('og:image') || 'https://via.placeholder.com/300x400?text=No+Image+Found';

            // Attempt to extract INR price from text (basic regex heuristics)
            const bodyText = document.body.innerText;
            const priceMatch = bodyText.match(/₹[\s]*([\d,]+(\.\d{1,2})?)/);
            const price = priceMatch ? priceMatch[0] : null;

            return { title, image, price };
        });

        return productData;
    } catch (error) {
        console.error('Puppeteer scraping error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
};

// POST /extract
router.post('/extract', async (req, res) => {
    const { url, userId } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Product URL is required' });
    }

    try {
        // 1. Actually Scrape the URL
        console.log(`Starting scrape for URL: ${url}`);
        const scrapedData = await scrapeProductInfo(url);

        if (!scrapedData) {
            return res.status(500).json({ error: 'Failed to extract data. Bot protection may have blocked the request.' });
        }

        const productData = {
            productName: scrapedData.title,
            imageUrl: scrapedData.image,
            scrapedPrice: scrapedData.price,
            source: 'link'
        };

        // 2. Optionally save the clothing image to DB
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
        console.error('Extraction error:', error);
        res.status(500).json({ error: 'Failed to extract product from link' });
    }
});

// GET /compare-prices?product_name=
router.get('/compare-prices', async (req, res) => {
    const { product_name } = req.query;

    if (!product_name) {
        return res.status(400).json({ error: 'Product name query parameter is required' });
    }

    try {
        // For the Indian market requirement, we mock the real-time search logic across 5 marketplaces.
        // In production, this would queue 5 separate Puppeteer/API jobs and aggregate the results.

        const basePrice = Math.floor(Math.random() * 2000) + 500; // Between ₹500 - ₹2500

        const comparisons = [
            {
                marketplace: 'Amazon India',
                price: `₹${basePrice + Math.floor(Math.random() * 100)}`,
                shipping_cost: 'Free Delivery',
                product_url: `https://www.amazon.in/s?k=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Amazon'
            },
            {
                marketplace: 'Flipkart',
                price: `₹${basePrice - Math.floor(Math.random() * 50)}`,
                shipping_cost: '₹40 Delivery',
                product_url: `https://www.flipkart.com/search?q=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Flipkart'
            },
            {
                marketplace: 'Myntra',
                price: `₹${basePrice + Math.floor(Math.random() * 200)}`,
                shipping_cost: 'Free Delivery',
                product_url: `https://www.myntra.com/${encodeURIComponent(product_name.replace(/ /g, '-'))}`,
                image_url: 'https://via.placeholder.com/150?text=Myntra'
            },
            {
                marketplace: 'Ajio',
                price: `₹${basePrice + Math.floor(Math.random() * 50)}`,
                shipping_cost: 'Free Delivery',
                product_url: `https://www.ajio.com/search/?text=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Ajio'
            },
            {
                marketplace: 'Tata Cliq',
                price: `₹${basePrice + Math.floor(Math.random() * 300)}`,
                shipping_cost: '₹50 Delivery',
                product_url: `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Tata+Cliq'
            }
        ];

        // Sort by extracted numerical price heuristically
        comparisons.sort((a, b) => {
            const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
            const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
            return priceA - priceB;
        });

        res.json(comparisons);
    } catch (error) {
        console.error('Comparison error:', error);
        res.status(500).json({ error: 'Failed to fetch price comparisons' });
    }
});

module.exports = router;
