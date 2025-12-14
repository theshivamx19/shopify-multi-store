// ==================== PRODUCT ROUTES ====================
// routes/products.js
const express = require('express');
const ProductService = require('../services/productService.js');
const ShopifySyncService = require('../services/shopifySyncService.js');
const db = require('../models/index.js');

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

module.exports = router;