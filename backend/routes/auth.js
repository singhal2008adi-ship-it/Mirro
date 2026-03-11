const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_for_development_only';

// Signup Route
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const newUser = await db.query(
            'INSERT INTO Users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, password_hash]
        );

        const user = newUser.rows[0];
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user
        const userCheck = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userCheck.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ user: { id: user.id, email: user.email }, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout Route (Client side handles token deletion, optional server blacklist)
router.post('/logout', (req, res) => {
    // In a stateless JWT setup, logout is mainly clearing the token on the client.
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
