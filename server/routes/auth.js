const express = require('express');
const router = express.Router();
const ShopifyService = require('../services/shopify');
const { Store, OAuthState } = require('../models');


const nonceStore = new Map()
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
    const callbackAuthData = {
        nonce,
        used: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
    nonceStore.set(shop, callbackAuthData)
    try {
        // Store state in database (expires in 10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);


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
        if (nonceStore.get(shop).nonce !== state) {
            console.error('❌ State not found in database');
            console.error('  Received state:', state);
            console.error('  Shop:', shop);
            return res.status(403).json({
                error: 'Invalid state parameter',
                message: 'State not found or shop mismatch. Please restart the OAuth flow.'
            });
        }

        console.log('✅ State found in nonce store');

        // Check if state has expired
        if (new Date() > nonceStore.get(shop).expiresAt) {
            console.error('❌ State has expired');
            console.error('  Expired at:', nonceStore.get(shop));
            console.error('  Current time:', new Date());
            return res.status(403).json({
                error: 'State has expired',
                message: 'OAuth state expired. Please restart the OAuth flow.'
            });
        }
        console.log('✅ State has not expired');

        if (nonceStore.get(shop).used) {
            console.error('❌ State has already been used');
            return res.status(403).json({
                error: 'State already used',
                message: 'This authorization link has already been used.'
            });
        }

        console.log('✅ State has not been used');

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
        const storeDetails = await Store.upsert({
            storeName: shop.split('.')[0],
            storeDomain: shop,
            accessToken: tokenData.access_token,
            isActive: true,
            installedAt: new Date()
        });
        const [storeData, created] = storeDetails;

        // Clean up used state
        const setCallbackStateValues = {
            nonce: null,
            used: true,
            expiresAt: null
        }
        nonceStore.set(shop, setCallbackStateValues)
        console.log('✅ OAuth state cleaned up');

        console.log('🎉 OAuth flow completed successfully!');

        res.json({
            success: true,
            message: storeData?.createdAt ? 'Store connected successfully' : 'Store updated successfully',
            store: {
                id: storeData?.id,
                storeDomain: storeData?.storeDomain,
                isActive: storeData?.isActive
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
