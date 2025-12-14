// https://claude.ai/public/artifacts/e20a5340-339f-4c51-9d4c-e49269d6b2cb


// ==================== PACKAGE.JSON ====================
/*
{
  "name": "shopify-multistore-sync",
  "version": "1.0.0",
  "type": "module",
  "description": "Multi-store Shopify product sync system with Sequelize",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:migrate": "npx sequelize-cli db:migrate",
    "db:seed": "npx sequelize-cli db:seed:all"
  },
  "dependencies": {
    "@shopify/shopify-api": "^10.1.0",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "sequelize": "^6.35.0",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4"
  },
  "devDependencies": {
    "sequelize-cli": "^6.6.0",
    "nodemon": "^3.0.0"
  }
}
*/

// ==================== .ENV FILE ====================
/*
# Shopify API
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_SCOPES=write_products,read_products,write_inventory,read_inventory
HOST=https://your-domain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopify_multistore
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development
*/

// ==================== SEQUELIZE MODELS ====================

// models/index.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres', // or 'mysql'
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
import StoreModel from './Store.js';
import ProductModel from './Product.js';
import ProductOptionModel from './ProductOption.js';
import ProductOptionValueModel from './ProductOptionValue.js';
import ProductVariantModel from './ProductVariant.js';
import ProductVariantOptionValueModel from './ProductVariantOptionValue.js';
import ProductShopModel from './ProductShop.js';
import ProductVariantShopModel from './ProductVariantShop.js';

// Initialize models
const Store = StoreModel(sequelize);
const Product = ProductModel(sequelize);
const ProductOption = ProductOptionModel(sequelize);
const ProductOptionValue = ProductOptionValueModel(sequelize);
const ProductVariant = ProductVariantModel(sequelize);
const ProductVariantOptionValue = ProductVariantOptionValueModel(sequelize);
const ProductShop = ProductShopModel(sequelize);
const ProductVariantShop = ProductVariantShopModel(sequelize);

// Define Associations
// Product -> ProductOption (1:N)
Product.hasMany(ProductOption, {
  foreignKey: 'productId',
  as: 'options'
});
ProductOption.belongsTo(Product, {
  foreignKey: 'productId'
});

// ProductOption -> ProductOptionValue (1:N)
ProductOption.hasMany(ProductOptionValue, {
  foreignKey: 'productOptionId',
  as: 'values'
});
ProductOptionValue.belongsTo(ProductOption, {
  foreignKey: 'productOptionId'
});

// Product -> ProductVariant (1:N)
Product.hasMany(ProductVariant, {
  foreignKey: 'productId',
  as: 'variants'
});
ProductVariant.belongsTo(Product, {
  foreignKey: 'productId'
});

// ProductVariant -> ProductVariantOptionValue (1:N)
ProductVariant.hasMany(ProductVariantOptionValue, {
  foreignKey: 'productVariantId',
  as: 'optionValues'
});
ProductVariantOptionValue.belongsTo(ProductVariant, {
  foreignKey: 'productVariantId'
});

// ProductVariantOptionValue -> ProductOption
ProductVariantOptionValue.belongsTo(ProductOption, {
  foreignKey: 'productOptionId',
  as: 'option'
});

// ProductVariantOptionValue -> ProductOptionValue
ProductVariantOptionValue.belongsTo(ProductOptionValue, {
  foreignKey: 'productOptionValueId',
  as: 'value'
});

// Product -> ProductShop (1:N) - Sync tracking
Product.hasMany(ProductShop, {
  foreignKey: 'productId',
  as: 'shopMappings'
});
ProductShop.belongsTo(Product, {
  foreignKey: 'productId'
});
ProductShop.belongsTo(Store, {
  foreignKey: 'storeId',
  as: 'store'
});

// ProductVariant -> ProductVariantShop (1:N) - Variant sync tracking
ProductVariant.hasMany(ProductVariantShop, {
  foreignKey: 'productVariantId',
  as: 'shopMappings'
});
ProductVariantShop.belongsTo(ProductVariant, {
  foreignKey: 'productVariantId'
});
ProductVariantShop.belongsTo(Store, {
  foreignKey: 'storeId',
  as: 'store'
});

const db = {
  sequelize,
  Sequelize,
  Store,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionValue,
  ProductShop,
  ProductVariantShop
};

export default db;

// models/Store.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Store = sequelize.define('Store', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    storeName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    storeDomain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    installedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'stores',
    timestamps: true
  });

  return Store;
};

// models/Product.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    productType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'DRAFT', 'ARCHIVED']]
      }
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  return Product;
};

// models/ProductOption.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProductOption = sequelize.define('ProductOption', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    tableName: 'product_options',
    timestamps: false
  });

  return ProductOption;
};

// models/ProductOptionValue.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProductOptionValue = sequelize.define('ProductOptionValue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productOptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_options',
        key: 'id'
      }
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'product_option_values',
    timestamps: false
  });

  return ProductOptionValue;
};

// models/ProductVariant.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProductVariant = sequelize.define('ProductVariant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    inventoryQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'product_variants',
    timestamps: true
  });

  return ProductVariant;
};

// models/ProductVariantOptionValue.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProductVariantOptionValue = sequelize.define('ProductVariantOptionValue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productVariantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_variants',
        key: 'id'
      }
    },
    productOptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_options',
        key: 'id'
      }
    },
    productOptionValueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_option_values',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_variant_option_values',
    timestamps: false
  });

  return ProductVariantOptionValue;
};

// models/ProductShop.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProductShop = sequelize.define('ProductShop', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id'
      }
    },
    shopifyProductGid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    syncStatus: {
      type: DataTypes.STRING,
      defaultValue: 'SYNCED',
      validate: {
        isIn: [['PENDING', 'SYNCING', 'SYNCED', 'FAILED']]
      }
    },
    syncErrorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'product_shops',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['productId', 'storeId']
      }
    ]
  });

  return ProductShop;
};

// models/ProductVariantShop.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProductVariantShop = sequelize.define('ProductVariantShop', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productVariantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_variants',
        key: 'id'
      }
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id'
      }
    },
    shopifyVariantGid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    syncStatus: {
      type: DataTypes.STRING,
      defaultValue: 'SYNCED',
      validate: {
        isIn: [['PENDING', 'SYNCED', 'FAILED']]
      }
    },
    syncErrorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'product_variant_shops',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['productVariantId', 'storeId']
      }
    ]
  });

  return ProductVariantShop;
};

// ==================== SHOPIFY CONFIG ====================
// config/shopify.js
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import dotenv from 'dotenv';

dotenv.config();

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

// ==================== PRODUCT SERVICE ====================
// services/productService.js
import db from '../models/index.js';

const { Product, ProductOption, ProductOptionValue, ProductVariant, ProductVariantOptionValue } = db;

export class ProductService {
  /**
   * Create complete product with options and variants
   */
  async createProduct(productData, transaction = null) {
    const t = transaction || await db.sequelize.transaction();

    try {
      // 1. Create product
      const product = await Product.create({
        title: productData.title,
        description: productData.description,
        productType: productData.productType,
        vendor: productData.vendor,
        status: productData.status || 'ACTIVE'
      }, { transaction: t });

      // 2. Create options
      const optionMap = {}; // Map option name to option ID
      const valueMap = {}; // Map "optionName:value" to value ID

      if (productData.options && productData.options.length > 0) {
        for (let i = 0; i < productData.options.length; i++) {
          const optData = productData.options[i];
          
          const option = await ProductOption.create({
            productId: product.id,
            name: optData.name,
            position: i + 1
          }, { transaction: t });

          optionMap[optData.name] = option.id;

          // Create option values
          for (const val of optData.values) {
            const optionValue = await ProductOptionValue.create({
              productOptionId: option.id,
              value: val
            }, { transaction: t });

            valueMap[`${optData.name}:${val}`] = optionValue.id;
          }
        }
      }

      // 3. Create variants
      if (productData.variants && productData.variants.length > 0) {
        for (let i = 0; i < productData.variants.length; i++) {
          const varData = productData.variants[i];

          const variant = await ProductVariant.create({
            productId: product.id,
            sku: varData.sku,
            barcode: varData.barcode,
            price: varData.price,
            compareAtPrice: varData.compareAtPrice,
            cost: varData.cost,
            inventoryQuantity: varData.inventoryQuantity || 0,
            position: i + 1
          }, { transaction: t });

          // Link variant to option values
          if (varData.optionValues) {
            for (const [optionName, value] of Object.entries(varData.optionValues)) {
              const optionId = optionMap[optionName];
              const valueId = valueMap[`${optionName}:${value}`];

              if (optionId && valueId) {
                await ProductVariantOptionValue.create({
                  productVariantId: variant.id,
                  productOptionId: optionId,
                  productOptionValueId: valueId
                }, { transaction: t });
              }
            }
          }
        }
      }

      if (!transaction) await t.commit();
      return product;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  /**
   * Get complete product with all relationships
   */
  async getProductComplete(productId) {
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductOption,
          as: 'options',
          include: [{
            model: ProductOptionValue,
            as: 'values'
          }]
        },
        {
          model: ProductVariant,
          as: 'variants',
          include: [{
            model: ProductVariantOptionValue,
            as: 'optionValues',
            include: [
              {
                model: ProductOption,
                as: 'option'
              },
              {
                model: ProductOptionValue,
                as: 'value'
              }
            ]
          }]
        }
      ]
    });

    return product;
  }

  /**
   * Get all products with pagination
   */
  async getProducts(filters = {}) {
    const { page = 1, limit = 50, status, vendor, search } = filters;

    const where = {};
    if (status) where.status = status;
    if (vendor) where.vendor = vendor;
    if (search) {
      where.title = { [db.Sequelize.Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    return {
      products: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }
}

// ==================== SHOPIFY SYNC SERVICE ====================
// services/shopifySyncService.js
import { shopify } from '../config/shopify.js';
import db from '../models/index.js';
import { ProductService } from './productService.js';

const { Store, ProductShop, ProductVariantShop, ProductOption, ProductOptionValue } = db;
const productService = new ProductService();

export class ShopifySyncService {
  /**
   * Create product on single Shopify store
   */
  async syncProductToStore(productId, storeId) {
    const product = await productService.getProductComplete(productId);
    if (!product) throw new Error('Product not found');

    const store = await Store.findByPk(storeId);
    if (!store) throw new Error('Store not found');

    // Create Shopify session
    const session = new shopify.session.Session({
      id: `offline_${store.storeDomain}`,
      shop: store.storeDomain,
      state: 'unused',
      isOnline: false,
      accessToken: store.accessToken,
    });

    const client = new shopify.clients.Graphql({ session });

    try {
      // Step 1: Create base product with options
      const productOptions = product.options.map(opt => ({
        name: opt.name,
        values: opt.values.map(v => ({ name: v.value }))
      }));

      const createMutation = `
        mutation CreateProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              options(first: 10) {
                id
                name
                values
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const createResponse = await client.request(createMutation, {
        variables: {
          input: {
            title: product.title,
            descriptionHtml: product.description,
            vendor: product.vendor,
            productType: product.productType,
            status: product.status,
            productOptions
          }
        }
      });

      if (createResponse.data.productCreate.userErrors?.length) {
        throw new Error(JSON.stringify(createResponse.data.productCreate.userErrors));
      }

      const shopifyProduct = createResponse.data.productCreate.product;

      // Map Shopify option IDs
      const optionIdMap = {};
      shopifyProduct.options.forEach(opt => {
        optionIdMap[opt.name] = opt.id;
      });

      // Step 2: Create variants
      const variantsInput = product.variants.map(variant => {
        // Build option values from relationships
        const optionValues = variant.optionValues.map(ov => ({
          optionId: optionIdMap[ov.option.name],
          name: ov.value.value
        }));

        return {
          price: variant.price.toString(),
          compareAtPrice: variant.compareAtPrice?.toString(),
          sku: variant.sku,
          barcode: variant.barcode,
          optionValues,
          inventoryItem: { tracked: true },
          inventoryQuantities: [{
            availableQuantity: variant.inventoryQuantity || 0,
            locationId: "gid://shopify/Location/1"
          }]
        };
      });

      const variantMutation = `
        mutation CreateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) {
          productVariantsBulkCreate(
            productId: $productId,
            variants: $variants,
            strategy: $strategy
          ) {
            productVariants {
              id
              sku
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variantResponse = await client.request(variantMutation, {
        variables: {
          productId: shopifyProduct.id,
          variants: variantsInput,
          strategy: 'REMOVE_STANDALONE_VARIANT'
        }
      });

      if (variantResponse.data.productVariantsBulkCreate.userErrors?.length) {
        throw new Error(JSON.stringify(variantResponse.data.productVariantsBulkCreate.userErrors));
      }

      const shopifyVariants = variantResponse.data.productVariantsBulkCreate.productVariants;

      // Save sync mappings
      await ProductShop.create({
        productId: product.id,
        storeId: store.id,
        shopifyProductGid: shopifyProduct.id,
        syncStatus: 'SYNCED',
        lastSyncedAt: new Date()
      });

      // Save variant mappings
      for (let i = 0; i < shopifyVariants.length; i++) {
        await ProductVariantShop.create({
          productVariantId: product.variants[i].id,
          storeId: store.id,
          shopifyVariantGid: shopifyVariants[i].id,
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date()
        });
      }

      return {
        success: true,
        shopifyProductId: shopifyProduct.id,
        variantsCreated: shopifyVariants.length
      };
    } catch (error) {
      // Save failed sync
      await ProductShop.upsert({
        productId: product.id,
        storeId: store.id,
        shopifyProductGid: 'FAILED',
        syncStatus: 'FAILED',
        syncErrorMessage: error.message,
        lastSyncedAt: new Date()
      });

      throw error;
    }
  }

  /**
   * Sync product to all active stores
   */
  async syncProductToAllStores(productId) {
    const stores = await Store.findAll({
      where: { isActive: true }
    });

    if (stores.length === 0) {
      throw new Error('No active stores found');
    }

    const results = [];

    for (const store of stores) {
      try {
        const result = await this.syncProductToStore(productId, store.id);
        results.push({
          storeId: store.id,
          storeDomain: store.storeDomain,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          storeId: store.id,
          storeDomain: store.storeDomain,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

// ==================== AUTH ROUTES ====================
// routes/auth.js
import express from 'express';
import { shopify } from '../config/shopify.js';
import db from '../models/index.js';

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

export default router;

// ==================== PRODUCT ROUTES ====================
// routes/products.js
import express from 'express';
import { ProductService } from '../services/productService.js';
import { ShopifySyncService } from '../services/shopifySyncService.js';
import db from '../models/index.js';

const router = express.Router();
const productService = new ProductService();
const syncService = new ShopifySyncService();
const { Store, ProductShop } = db;

// Create and sync product
router.post('/sync', async (req, res) => {
  try {
    const productData = req.body;

    // Create product
    const product = await productService.createProduct(productData);

    // Sync to all stores
    const results = await syncService.syncProductToAllStores(product.id);

    res.json({
      message: 'Product created and synced',
      productId: product.id,
      results
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await productService.getProducts(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product details
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProductComplete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const syncStatus = await ProductShop.findAll({
      where: { productId: product.id },
      include: [{ model: Store, as: 'store' }]
    });

    res.json({
      product,
      syncStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stores
router.get('/stores/list', async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { isActive: true },
      attributes: { exclude: ['accessToken'] }
    });

    res.json({ stores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

// ==================== MAIN SERVER ====================
// server.js
import express from 'express';
import dotenv from 'dotenv';
import db from './models/index.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const initDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database synced');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

initDatabase();

// Routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📖 API Endpoints:');
  console.log('   - Install store: GET /auth/install?shop=SHOP');
  console.log('   - Sync product: POST /products/sync');
  console.log('   - Get products: GET /products');
  console.log('   - Get stores: GET /products/stores/list');
});

// ==================== DATABASE MIGRATION ====================
// migrations/001-create-tables.js
/*
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create stores table
    await queryInterface.createTable('stores', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      storeName: Sequelize.STRING,
      storeDomain: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      accessToken: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      installedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });

    // Create products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      productType: Sequelize.STRING,
      vendor: Sequelize.STRING,
      status: {
        type: Sequelize.STRING,
        defaultValue: 'ACTIVE'
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });

    // Create product_options table
    await queryInterface.createTable('product_options', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: Sequelize.STRING,
      position: Sequelize.INTEGER
    });

    // Create product_option_values table
    await queryInterface.createTable('product_option_values', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productOptionId: {
        type: Sequelize.INTEGER,
        references: { model: 'product_options', key: 'id' },
        onDelete: 'CASCADE'
      },
      value: Sequelize.STRING
    });

    // Create product_variants table
    await queryInterface.createTable('product_variants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE'
      },
      sku: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      barcode: Sequelize.STRING,
      price: Sequelize.DECIMAL(10, 2),
      compareAtPrice: Sequelize.DECIMAL(10, 2),
      cost: Sequelize.DECIMAL(10, 2),
      inventoryQuantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      position: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });

    // Create product_variant_option_values table
    await queryInterface.createTable('product_variant_option_values', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productVariantId: {
        type: Sequelize.INTEGER,
        references: { model: 'product_variants', key: 'id' },
        onDelete: 'CASCADE'
      },
      productOptionId: {
        type: Sequelize.INTEGER,
        references: { model: 'product_options', key: 'id' }
      },
      productOptionValueId: {
        type: Sequelize.INTEGER,
        references: { model: 'product_option_values', key: 'id' }
      }
    });

    // Create product_shops table
    await queryInterface.createTable('product_shops', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE'
      },
      storeId: {
        type: Sequelize.INTEGER,
        references: { model: 'stores', key: 'id' },
        onDelete: 'CASCADE'
      },
      shopifyProductGid: Sequelize.STRING,
      lastSyncedAt: Sequelize.DATE,
      syncStatus: {
        type: Sequelize.STRING,
        defaultValue: 'SYNCED'
      },
      syncErrorMessage: Sequelize.TEXT,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });

    // Create product_variant_shops table
    await queryInterface.createTable('product_variant_shops', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productVariantId: {
        type: Sequelize.INTEGER,
        references: { model: 'product_variants', key: 'id' },
        onDelete: 'CASCADE'
      },
      storeId: {
        type: Sequelize.INTEGER,
        references: { model: 'stores', key: 'id' },
        onDelete: 'CASCADE'
      },
      shopifyVariantGid: Sequelize.STRING,
      lastSyncedAt: Sequelize.DATE,
      syncStatus: {
        type: Sequelize.STRING,
        defaultValue: 'SYNCED'
      },
      syncErrorMessage: Sequelize.TEXT,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });

    // Add indexes
    await queryInterface.addIndex('product_shops', ['productId', 'storeId'], {
      unique: true,
      name: 'unique_product_store'
    });

    await queryInterface.addIndex('product_variant_shops', ['productVariantId', 'storeId'], {
      unique: true,
      name: 'unique_variant_store'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_variant_shops');
    await queryInterface.dropTable('product_shops');
    await queryInterface.dropTable('product_variant_option_values');
    await queryInterface.dropTable('product_variants');
    await queryInterface.dropTable('product_option_values');
    await queryInterface.dropTable('product_options');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('stores');
  }
};
*/

// ==================== USAGE EXAMPLES ====================
/*

SETUP DATABASE:
===============
1. Create PostgreSQL database:
   createdb shopify_multistore

2. Run migration:
   npm run db:migrate

EXAMPLE 1: Connect Store
=========================
http://localhost:3000/auth/install?shop=mystore.myshopify.com

EXAMPLE 2: Create and Sync Product
===================================
POST http://localhost:3000/products/sync
Content-Type: application/json

{
  "title": "Premium T-Shirt",
  "description": "High quality cotton t-shirt",
  "productType": "Apparel",
  "vendor": "Your Brand",
  "status": "ACTIVE",
  "options": [
    {
      "name": "Color",
      "values": ["Red", "Blue", "Black"]
    },
    {
      "name": "Size",
      "values": ["S", "M", "L", "XL"]
    }
  ],
  "variants": [
    {
      "sku": "TS-RED-S",
      "price": "29.99",
      "compareAtPrice": "39.99",
      "cost": "15.00",
      "barcode": "1234567890",
      "inventoryQuantity": 100,
      "optionValues": {
        "Color": "Red",
        "Size": "S"
      }
    },
    {
      "sku": "TS-RED-M",
      "price": "29.99",
      "compareAtPrice": "39.99",
      "cost": "15.00",
      "barcode": "1234567891",
      "inventoryQuantity": 150,
      "optionValues": {
        "Color": "Red",
        "Size": "M"
      }
    },
    {
      "sku": "TS-BLUE-L",
      "price": "29.99",
      "compareAtPrice": "39.99",
      "cost": "15.00",
      "inventoryQuantity": 120,
      "optionValues": {
        "Color": "Blue",
        "Size": "L"
      }
    }
  ]
}

Response:
{
  "message": "Product created and synced",
  "productId": 1,
  "results": [
    {
      "storeId": 1,
      "storeDomain": "store1.myshopify.com",
      "success": true,
      "shopifyProductId": "gid://shopify/Product/7234567890",
      "variantsCreated": 3
    },
    {
      "storeId": 2,
      "storeDomain": "store2.myshopify.com",
      "success": true,
      "shopifyProductId": "gid://shopify/Product/7234567891",
      "variantsCreated": 3
    }
  ]
}

EXAMPLE 3: Get All Products
============================
GET http://localhost:3000/products?page=1&limit=50

Response:
{
  "products": [
    {
      "id": 1,
      "title": "Premium T-Shirt",
      "status": "ACTIVE",
      "vendor": "Your Brand",
      "createdAt": "2024-12-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}

EXAMPLE 4: Get Product with Sync Status
========================================
GET http://localhost:3000/products/1

Response:
{
  "product": {
    "id": 1,
    "title": "Premium T-Shirt",
    "options": [
      {
        "id": 1,
        "name": "Color",
        "position": 1,
        "values": [
          {"id": 1, "value": "Red"},
          {"id": 2, "value": "Blue"}
        ]
      }
    ],
    "variants": [
      {
        "id": 1,
        "sku": "TS-RED-S",
        "price": "29.99",
        "optionValues": [
          {
            "option": {"name": "Color"},
            "value": {"value": "Red"}
          }
        ]
      }
    ]
  },
  "syncStatus": [
    {
      "productId": 1,
      "storeId": 1,
      "shopifyProductGid": "gid://shopify/Product/7234567890",
      "syncStatus": "SYNCED",
      "lastSyncedAt": "2024-12-14T10:00:00.000Z",
      "store": {
        "storeDomain": "store1.myshopify.com"
      }
    }
  ]
}

EXAMPLE 5: Get All Stores
==========================
GET http://localhost:3000/products/stores/list

Response:
{
  "stores": [
    {
      "id": 1,
      "storeName": "store1",
      "storeDomain": "store1.myshopify.com",
      "isActive": true,
      "installedAt": "2024-12-14T09:00:00.000Z"
    }
  ]
}

KEY FEATURES:
=============
✅ Normalized relational database schema
✅ Proper foreign key relationships
✅ Transaction support for data integrity
✅ Unique SKU constraint
✅ Cascade deletes
✅ Sync status tracking per store
✅ Error logging for failed syncs
✅ Proper Sequelize associations
✅ Migration support

*/