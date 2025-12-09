const express = require('express');
const router = express.Router();
const ShopifyService = require('../services/shopify');
const { Store, OAuthState } = require('../models');

/**
 * GET /auth
 * Initiate OAuth flow
 */
router.get('/', async (req, res) => {
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

    try {
        // Store state in database (expires in 10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OAuthState.create({
            state: nonce,
            shop: shop,
            expiresAt: expiresAt,
            used: false
        });

        // Debug logging
        console.log('🔐 OAuth Installation Request:');
        console.log('  Shop:', shop);
        console.log('  Generated Nonce:', nonce);
        console.log('  ✅ State stored in database');
        console.log('  Expires at:', expiresAt.toISOString());
        console.log('  Redirect URI:', redirectUri);
        console.log('  Install URL:', installUrl);

        res.redirect(installUrl);
    } catch (error) {
        console.error('❌ Error storing OAuth state:', error);
        res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }
});

/**
 * GET /auth/callback
 * Handle OAuth callback
 */
router.get('/callback', async (req, res) => {
    const { shop, code, state } = req.query;

    // Debug logging
    console.log('🔄 OAuth Callback Received:');
    console.log('  Shop:', shop);
    console.log('  State:', state);
    console.log('  Code:', code ? code.substring(0, 10) + '...' : 'missing');

    try {
        // Verify state from database
        const oauthState = await OAuthState.findOne({
            where: {
                state: state,
                shop: shop
            }
        });

        if (!oauthState) {
            console.error('❌ State not found in database');
            console.error('  Received state:', state);
            console.error('  Shop:', shop);
            return res.status(403).json({
                error: 'Invalid state parameter',
                message: 'State not found or shop mismatch. Please restart the OAuth flow.'
            });
        }

        console.log('✅ State found in database');

        // Check if state has expired
        if (new Date() > oauthState.expiresAt) {
            console.error('❌ State has expired');
            console.error('  Expired at:', oauthState.expiresAt);
            console.error('  Current time:', new Date());
            await oauthState.destroy();
            return res.status(403).json({
                error: 'State has expired',
                message: 'OAuth state expired. Please restart the OAuth flow.'
            });
        }

        console.log('✅ State has not expired');

        // Check if state has already been used (prevent replay attacks)
        if (oauthState.used) {
            console.error('❌ State has already been used');
            return res.status(403).json({
                error: 'State already used',
                message: 'This authorization link has already been used.'
            });
        }

        console.log('✅ State has not been used');

        // Mark state as used
        await oauthState.update({ used: true });
        console.log('✅ State marked as used');

        // Verify HMAC
        if (!ShopifyService.verifyHmac(req.query)) {
            console.error('❌ HMAC verification failed');
            return res.status(403).json({ error: 'HMAC verification failed' });
        }

        console.log('✅ HMAC verified');

        // Exchange code for access token
        const tokenData = await ShopifyService.getAccessToken(shop, code);
        console.log('✅ Access token obtained');

        // Save or update store in database
        const [store, created] = await Store.upsert({
            shopDomain: shop,
            accessToken: tokenData.access_token,
            scope: tokenData.scope,
            isInstalled: true,
            installedAt: new Date()
        });

        // Clean up used state
        await oauthState.destroy();
        console.log('✅ OAuth state cleaned up');

        console.log('🎉 OAuth flow completed successfully!');

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
        console.error('❌ OAuth callback error:', error);
        res.status(500).json({
            error: 'Failed to complete OAuth flow',
            message: error.message
        });
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
