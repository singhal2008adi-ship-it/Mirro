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
                'INSERT INTO ClothingImages (user_id, image_url, product_name, source) VALUES ($1, $2, $3, $4) RETURNING id',
                [userId, productData.imageUrl, productData.productName, 'link']
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
        const basePrice = Math.floor(Math.random() * 2000) + 500;

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
            },
            {
                marketplace: 'Nykaa Fashion',
                price: `₹${basePrice + Math.floor(Math.random() * 150)}`,
                shipping_cost: 'Free Delivery',
                product_url: `https://www.nykaafashion.com/search?q=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Nykaa'
            },
            {
                marketplace: 'Reliance Trends',
                price: `₹${basePrice - Math.floor(Math.random() * 100)}`,
                shipping_cost: '₹20 Delivery',
                product_url: `https://www.ajio.com/search/?text=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Trends'
            },
            {
                marketplace: 'Pantaloons',
                price: `₹${basePrice + Math.floor(Math.random() * 400)}`,
                shipping_cost: 'Free Delivery',
                product_url: `https://www.pantaloons.com/search?q=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Pantaloons'
            },
            {
                marketplace: 'Snapdeal',
                price: `₹${basePrice - Math.floor(Math.random() * 200)}`,
                shipping_cost: '₹49 Delivery',
                product_url: `https://www.snapdeal.com/search?keyword=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Snapdeal'
            },
            {
                marketplace: 'Meesho',
                price: `₹${basePrice - Math.floor(Math.random() * 300)}`,
                shipping_cost: 'Free Delivery',
                product_url: `https://www.meesho.com/search?q=${encodeURIComponent(product_name)}`,
                image_url: 'https://via.placeholder.com/150?text=Meesho'
            }
        ];

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

// GET /similar-suggestions?product_name=
router.get('/similar-suggestions', async (req, res) => {
    const { product_name } = req.query;

    if (!product_name) {
        return res.status(400).json({ error: 'Product name is required' });
    }

    const suggestions = [
        {
            id: 'sim-1',
            title: `Casual ${product_name} Alternative`,
            price: '₹999',
            marketplace: 'Myntra',
            image_url: 'https://via.placeholder.com/300x400?text=Suggestion+1',
            link: '#'
        },
        {
            id: 'sim-2',
            title: `Premium ${product_name} Style`,
            price: '₹2499',
            marketplace: 'Ajio',
            image_url: 'https://via.placeholder.com/300x400?text=Suggestion+2',
            link: '#'
        },
        {
            id: 'sim-3',
            title: `Budget ${product_name} Pick`,
            price: '₹599',
            marketplace: 'Flipkart',
            image_url: 'https://via.placeholder.com/300x400?text=Suggestion+3',
            link: '#'
        },
        {
            id: 'sim-4',
            title: `Designer ${product_name}`,
            price: '₹4599',
            marketplace: 'Tata Cliq',
            image_url: 'https://via.placeholder.com/300x400?text=Suggestion+4',
            link: '#'
        }
    ];

    res.json(suggestions);
});

module.exports = router;
