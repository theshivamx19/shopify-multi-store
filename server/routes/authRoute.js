// ==================== AUTH ROUTES ====================
// routes/auth.js
const express = require('express');
const { shopify } = require('../config/shopify.js');
const db = require('../models/index.js');

const router = express.Router();
const { Store } = db;
const sessions = new Map();

router.get('/install', async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    sessions.set(shop, { timestamp: Date.now() });

    const authRoute = await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(shop, true),
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    res.redirect(authRoute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    // Save or update store
    await Store.upsert({
      storeDomain: session.shop,
      storeName: session.shop.split('.')[0],
      accessToken: session.accessToken,
      isActive: true,
      installedAt: new Date()
    });

    sessions.delete(session.shop);

    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Store Connected!</h1>
          <p><strong>${session.shop}</strong> is now connected.</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;