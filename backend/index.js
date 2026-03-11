const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const productRoutes = require('./routes/products');
const tryonRoutes = require('./routes/tryon');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/products', productRoutes);
app.use('/generate-tryon', tryonRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
