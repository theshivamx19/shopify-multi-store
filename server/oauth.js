// https://claude.ai/public/artifacts/e61c5a28-3f2d-4474-a090-abe68b3e2b81


// https://claude.ai/share/5d4c615e-9b34-46b3-9690-1541db06c98c




// Complete OAuth implementation for multiple Shopify stores
// Install dependencies: npm install express axios dotenv crypto

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration from .env file
const {
  SHOPIFY_API_KEY,        // Your API key from Partner Dashboard
  SHOPIFY_API_SECRET,     // Your API secret from Partner Dashboard
  SHOPIFY_SCOPES,         // e.g., 'read_products,write_products,read_orders'
  HOST                    // e.g., 'https://your-domain.com' or ngrok URL
} = process.env;

// Store access tokens (In production, use a database!)
const storeTokens = {};

// Store nonce values for CSRF protection
const nonces = {};

/**
 * Step 1: Installation/Auth Initiation Route
 * Visit: http://localhost:3000/auth?shop=store1.myshopify.com
 */
app.get('/auth', (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send('Missing shop parameter. Add ?shop=your-store.myshopify.com');
  }

  // Validate shop domain
  if (!isValidShopDomain(shop)) {
    return res.status(400).send('Invalid shop domain');
  }

  // Generate random nonce for CSRF protection
  const nonce = crypto.randomBytes(16).toString('hex');
  nonces[shop] = nonce;

  // Build authorization URL
  const authUrl = buildAuthorizationUrl(shop, nonce);

  console.log(`Redirecting to Shopify authorization for shop: ${shop}`);
  res.redirect(authUrl);
});

/**
 * Step 2: OAuth Callback Route
 * Shopify redirects here after user approves
 */
app.get('/auth/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;

  // Security checks
  try {
    // 1. Validate HMAC
    if (!validateHMAC(req.query)) {
      return res.status(403).send('Invalid HMAC signature');
    }

    // 2. Validate nonce (CSRF protection)
    if (!nonces[shop] || nonces[shop] !== state) {
      return res.status(403).send('Invalid state parameter');
    }

    // 3. Validate shop domain
    if (!isValidShopDomain(shop)) {
      return res.status(400).send('Invalid shop domain');
    }

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(shop, code);

    // Store the access token (Use database in production!)
    storeTokens[shop] = {
      accessToken,
      shop,
      installedAt: new Date().toISOString()
    };

    // Clean up nonce
    delete nonces[shop];

    console.log(`✅ Successfully installed on ${shop}`);
    console.log(`Access Token: ${accessToken}`);

    res.send(`
      <html>
        <head><title>Installation Success</title></head>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
          <h1>✅ App Successfully Installed!</h1>
          <p>Store: <strong>${shop}</strong></p>
          <p>Your access token has been saved.</p>
          <hr>
          <h3>Access Token (Save this securely!):</h3>
          <code style="background: #f4f4f4; padding: 10px; display: block; margin: 20px;">${accessToken}</code>
          <p><a href="/stores">View All Connected Stores</a></p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

/**
 * View all connected stores
 */
app.get('/stores', (req, res) => {
  const stores = Object.values(storeTokens);
  
  let html = `
    <html>
      <head><title>Connected Stores</title></head>
      <body style="font-family: Arial; padding: 50px;">
        <h1>Connected Shopify Stores</h1>
        <p>Total Stores: ${stores.length}</p>
        <hr>
  `;

  if (stores.length === 0) {
    html += '<p>No stores connected yet.</p>';
  } else {
    stores.forEach(store => {
      html += `
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3>${store.shop}</h3>
          <p><strong>Access Token:</strong> <code>${store.accessToken}</code></p>
          <p><strong>Installed:</strong> ${store.installedAt}</p>
          <button onclick="copyToClipboard('${store.accessToken}')">Copy Token</button>
        </div>
      `;
    });
  }

  html += `
        <hr>
        <p><a href="/auth/new">Connect Another Store</a></p>
        <script>
          function copyToClipboard(text) {
            navigator.clipboard.writeText(text);
            alert('Token copied to clipboard!');
          }
        </script>
      </body>
    </html>
  `;

  res.send(html);
});

/**
 * Start new installation flow
 */
app.get('/auth/new', (req, res) => {
  res.send(`
    <html>
      <head><title>Connect Store</title></head>
      <body style="font-family: Arial; padding: 50px;">
        <h1>Connect a Shopify Store</h1>
        <form action="/auth" method="GET">
          <label>Enter your store domain:</label><br>
          <input 
            type="text" 
            name="shop" 
            placeholder="your-store.myshopify.com"
            style="padding: 10px; width: 300px; margin: 10px 0;"
            required
          ><br>
          <button type="submit" style="padding: 10px 20px;">Connect Store</button>
        </form>
      </body>
    </html>
  `);
});

/**
 * Test API endpoint - Make authenticated request
 */
app.get('/test/:shop', async (req, res) => {
  const { shop } = req.params;
  const storeData = storeTokens[shop];

  if (!storeData) {
    return res.status(404).send('Store not connected');
  }

  try {
    // Test by fetching shop info
    const response = await axios.post(
      `https://${shop}/admin/api/2025-10/graphql.json`,
      {
        query: `
          query {
            shop {
              name
              email
              myshopifyDomain
              currencyCode
            }
          }
        `
      },
      {
        headers: {
          'X-Shopify-Access-Token': storeData.accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      shop,
      data: response.data.data.shop
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Helper Functions ============

/**
 * Build Shopify authorization URL
 */
function buildAuthorizationUrl(shop, nonce) {
  const redirectUri = `${HOST}/auth/callback`;
  
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state: nonce
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(shop, code) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;

  const response = await axios.post(tokenUrl, {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code
  });

  return response.data.access_token;
}

/**
 * Validate HMAC signature from Shopify
 */
function validateHMAC(query) {
  const { hmac, ...params } = query;

  // Build message
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Generate HMAC
  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  return generatedHash === hmac;
}

/**
 * Validate shop domain format
 */
function isValidShopDomain(shop) {
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return regex.test(shop);
}

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`
  ======================================
  🚀 Shopify OAuth Server Running
  ======================================
  
  Server: http://localhost:${PORT}
  
  To connect a store:
  1. Visit: http://localhost:${PORT}/auth/new
  2. Or directly: http://localhost:${PORT}/auth?shop=your-store.myshopify.com
  
  View connected stores:
  - http://localhost:${PORT}/stores
  
  Test API access:
  - http://localhost:${PORT}/test/your-store.myshopify.com
  
  ⚠️  For production use:
  - Use a proper database to store tokens
  - Enable HTTPS (required by Shopify)
  - Use ngrok for local development: ngrok http 3000
  ======================================
  `);
});

module.exports = app;


// # Shopify OAuth Configuration

// # Get these from Shopify Partner Dashboard > Apps > Your App > Overview
// SHOPIFY_API_KEY=your_api_key_here
// SHOPIFY_API_SECRET=your_api_secret_here

// # Scopes your app needs (comma-separated, no spaces)
// SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders

// # Your app's public URL
// # For local development, use ngrok: https://xxxx.ngrok.io
// # For production, use your actual domain: https://yourdomain.com
// HOST=https://xxxx.ngrok.io

// # Server port
// PORT=3000