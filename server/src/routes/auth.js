const express = require('express');
const router = express.Router();
const ShopifyService = require('../services/shopify');
const { Store } = require('../models');

/**
 * GET /auth
 * Initiate OAuth flow
 */
router.get('/', (req, res) => {
    const { shop } = req.query;

    if (!shop) {
        return res.status(400).json({ error: 'Shop parameter is required' });
    }

    // Validate shop format
    if (!shop.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
        return res.status(400).json({ error: 'Invalid shop domain format' });
    }

    // Check if Shopify credentials are configured
    if (!process.env.SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY.includes('your_')) {
        return res.status(500).json({
            error: 'Shopify API credentials not configured',
            message: 'Please set SHOPIFY_API_KEY and SHOPIFY_API_SECRET in your .env file'
        });
    }

    const scopes = process.env.SHOPIFY_SCOPES;
    const redirectUri = process.env.REDIRECT_URI;

    const { installUrl, nonce } = ShopifyService.generateInstallUrl(shop, scopes, redirectUri);

    // Debug logging
    console.log('🔐 OAuth Installation Request:');
    console.log('  Shop:', shop);
    console.log('  API Key:', process.env.SHOPIFY_API_KEY?.substring(0, 8) + '...');
    console.log('  Scopes:', scopes);
    console.log('  Redirect URI:', redirectUri);
    console.log('  Install URL:', installUrl);

    // Store nonce in session for verification
    req.session.nonce = nonce;
    req.session.shop = shop;

    res.redirect(installUrl);
});

/**
 * GET /auth/callback
 * Handle OAuth callback
 */
router.get('/callback', async (req, res) => {
    const { shop, code, state } = req.query;

    // Verify state matches nonce
    if (state !== req.session.nonce) {
        return res.status(403).json({ error: 'Invalid state parameter' });
    }

    // Verify HMAC
    if (!ShopifyService.verifyHmac(req.query)) {
        return res.status(403).json({ error: 'HMAC verification failed' });
    }

    try {
        // Exchange code for access token
        const tokenData = await ShopifyService.getAccessToken(shop, code);

        // Save or update store in database
        const [store, created] = await Store.upsert({
            shopDomain: shop,
            accessToken: tokenData.access_token,
            scope: tokenData.scope,
            isInstalled: true,
            installedAt: new Date()
        });

        // Clear session
        req.session.nonce = null;
        req.session.shop = null;

        res.json({
            success: true,
            message: created ? 'Store connected successfully' : 'Store updated successfully',
            store: {
                id: store.id,
                shopDomain: store.shopDomain,
                isInstalled: store.isInstalled
            }
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({ error: 'Failed to complete OAuth flow' });
    }
});

/**
 * GET /auth/status
 * Get list of connected stores
 */
router.get('/status', async (req, res) => {
    try {
        const stores = await Store.findAll({
            where: { isInstalled: true },
            attributes: ['id', 'shopDomain', 'isInstalled', 'installedAt']
        });

        res.json({
            success: true,
            stores
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Failed to fetch connected stores' });
    }
});

module.exports = router;
