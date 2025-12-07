# Shopify Multi-Store Product Management Platform

A centralized backend platform to manage products across multiple Shopify stores with a single click. Built with Node.js, Express, Sequelize, and MySQL.

## Features

- 🔐 **OAuth2 Authentication** - Secure Shopify app installation flow
- 🏪 **Multi-Store Management** - Connect and manage multiple Shopify stores
- 📦 **Centralized Products** - Create products once, sync to all stores
- 🔄 **Sync Tracking** - Monitor sync status across all stores
- 🎯 **Selective Sync** - Push products to specific stores or all at once
- ✅ **Error Handling** - Track failed syncs with detailed error messages

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Shopify Partner Account
- Custom Shopify App created in Partner Dashboard

## Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Configure environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `DB_*` - MySQL database credentials
- `SHOPIFY_API_KEY` - Your Shopify app's Client ID
- `SHOPIFY_API_SECRET` - Your Shopify app's Client Secret
- `SHOPIFY_SCOPES` - Required scopes (default: `write_products,read_products`)
- `REDIRECT_URI` - OAuth callback URL (must match your app settings)

3. **Create MySQL database**

```sql
CREATE DATABASE shopify_multi_store;
```

4. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Authentication Endpoints

#### Install App
```
GET /auth?shop=yourstore.myshopify.com
```
Redirects to Shopify OAuth installation page.

#### OAuth Callback
```
GET /auth/callback
```
Handles OAuth callback and stores access token.

#### Get Connected Stores
```
GET /auth/status
```
Returns list of all connected stores.

### Store Management

#### List Stores
```
GET /api/stores
```

#### Get Store Details
```
GET /api/stores/:id
```

#### Remove Store
```
DELETE /api/stores/:id
```

### Product Management

#### Create Product
```
POST /api/products
```
**Body:**
```json
{
  "title": "Product Name",
  "description": "Product description",
  "vendor": "Your Brand",
  "productType": "Category",
  "tags": ["tag1", "tag2"],
  "variants": [
    {
      "option1": "Default Title",
      "price": "29.99",
      "sku": "SKU123"
    }
  ],
  "images": [
    {
      "src": "https://example.com/image.jpg"
    }
  ],
  "status": "active"
}
```

#### List Products
```
GET /api/products
```

#### Get Product
```
GET /api/products/:id
```

#### Update Product
```
PUT /api/products/:id
```

#### Sync Product to Stores
```
POST /api/products/:id/sync
```
**Body (optional):**
```json
{
  "storeIds": [1, 2, 3]
}
```
If `storeIds` is not provided, syncs to all connected stores.

#### Get Sync Status
```
GET /api/products/:id/sync-status
```

#### Delete Product
```
DELETE /api/products/:id
```

## Database Schema

### Stores Table
- `id` - Primary key
- `shop_domain` - Shopify store domain
- `access_token` - OAuth access token
- `scope` - Granted permissions
- `is_installed` - Installation status
- `installed_at` - Installation timestamp

### Products Table
- `id` - Primary key
- `title` - Product title
- `description` - Product description
- `vendor` - Product vendor
- `product_type` - Product category
- `tags` - Comma-separated tags
- `variants` - JSON array of variants
- `images` - JSON array of images
- `status` - Product status (active/draft/archived)

### Product Syncs Table
- `id` - Primary key
- `product_id` - Reference to products table
- `store_id` - Reference to stores table
- `shopify_product_id` - Shopify's product ID
- `sync_status` - Status (pending/synced/failed/out_of_sync)
- `last_synced_at` - Last sync timestamp
- `error_message` - Error details if failed

## Workflow

1. **Connect Stores**
   - Navigate to `/auth?shop=yourstore.myshopify.com`
   - Complete OAuth flow
   - Repeat for each store

2. **Create Product**
   - POST to `/api/products` with product data
   - Product saved centrally in your database

3. **Sync to Stores**
   - POST to `/api/products/:id/sync`
   - Product created/updated in all connected Shopify stores
   - Sync status tracked in database

4. **Monitor Status**
   - GET `/api/products/:id/sync-status`
   - View sync status across all stores

## Development

### Project Structure
```
├── src/
│   ├── config/
│   │   └── database.js       # Database configuration
│   ├── models/
│   │   ├── Store.js          # Store model
│   │   ├── Product.js        # Product model
│   │   ├── ProductSync.js    # Sync tracking model
│   │   └── index.js          # Model associations
│   ├── routes/
│   │   ├── auth.js           # OAuth routes
│   │   ├── stores.js         # Store management
│   │   └── products.js       # Product management
│   ├── services/
│   │   └── shopify.js        # Shopify API wrapper
│   └── server.js             # Application entry point
├── .env                       # Environment variables
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
└── README.md                 # This file
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists

### OAuth Errors
- Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
- Ensure `REDIRECT_URI` matches your Shopify app settings
- Check that your app has the required scopes

### Sync Failures
- Check store access token is valid
- Verify product data format matches Shopify requirements
- Review error messages in sync status endpoint

## Security Notes

- Never commit `.env` file to version control
- Store access tokens securely
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate all user inputs

## License

ISC
