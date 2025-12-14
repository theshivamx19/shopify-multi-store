const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/db');
const { Store, Product, ProductSync, OAuthState } = require('./models');


// Import routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for ngrok and other reverse proxies
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for ngrok/HTTPS tunnels
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.REDIRECT_URI?.startsWith('https'), // Auto-detect based on redirect URI
        httpOnly: true,
        sameSite: process.env.REDIRECT_URI?.startsWith('https') ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'shopify.sid'
}));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Shopify Multi-Store Product Management API',
        version: '1.0.0',
        endpoints: {
            auth: {
                install: 'GET /auth?shop=mark-store99.myshopify.com',
                callback: 'GET /auth/callback',
                status: 'GET /auth/status'
            },
            stores: {
                list: 'GET /api/stores',
                details: 'GET /api/stores/:id',
                remove: 'DELETE /api/stores/:id'
            },
            products: {
                create: 'POST /api/products',
                list: 'GET /api/products',
                details: 'GET /api/products/:id',
                update: 'PUT /api/products/:id',
                sync: 'POST /api/products/:id/sync',
                syncStatus: 'GET /api/products/:id/sync-status',
                delete: 'DELETE /api/products/:id'
            }
        }
    });
});

app.use('/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Sync database models
        // await sequelize.sync({ alter: true });
        // console.log('✅ Database models synchronized');

        // Start listening
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n📚 API Documentation available at http://localhost:${PORT}\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
