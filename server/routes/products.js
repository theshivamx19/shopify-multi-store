const express = require('express');
const router = express.Router();
const { Product, ProductSync, Store } = require('../models');
const ShopifyService = require('../services/shopify');

/**
 * POST /api/products
 * Create a new product (centralized)
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, vendor, productType, tags, variants, images, status } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Product title is required' });
        }

        const product = await Product.create({
            title,
            description,
            vendor,
            productType,
            tags,
            variants,
            images,
            status: status || 'draft'
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

/**
 * GET /api/products
 * Get all products
 */
router.get('/', async (req, res) => {
    try {
        const products = await Product.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * GET /api/products/:id
 * Get product details
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

/**
 * PUT /api/products/:id
 * Update a product
 */
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { title, description, vendor, productType, tags, variants, images, status } = req.body;

        await product.update({
            title,
            description,
            vendor,
            productType,
            tags,
            variants,
            images,
            status
        });

        // Mark all syncs as out of sync
        await ProductSync.update(
            { syncStatus: 'out_of_sync' },
            { where: { productId: product.id, syncStatus: 'synced' } }
        );

        res.json({
            success: true,
            message: 'Product updated successfully. Run sync to push changes to stores.',
            product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

/**
 * POST /api/products/:id/sync
 * Sync product to stores
 */
router.post('/:id/sync', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { storeIds } = req.body; // Optional: specific store IDs to sync to

        // Get stores to sync to
        let stores;
        if (storeIds && storeIds.length > 0) {
            stores = await Store.findAll({
                where: { id: storeIds, isInstalled: true }
            });
        } else {
            stores = await Store.findAll({
                where: { isInstalled: true }
            });
        }

        if (stores.length === 0) {
            return res.status(400).json({ error: 'No installed stores found' });
        }

        const syncResults = [];

        // Sync to each store
        for (const store of stores) {
            try {
                const shopifyService = new ShopifyService(store.shopDomain, store.accessToken);

                // Check if product already synced to this store
                let productSync = await ProductSync.findOne({
                    where: {
                        productId: product.id,
                        storeId: store.id
                    }
                });

                let shopifyProduct;

                if (productSync && productSync.shopifyProductId) {
                    // Update existing product
                    shopifyProduct = await shopifyService.updateProduct(productSync.shopifyProductId, product);
                } else {
                    // Create new product
                    shopifyProduct = await shopifyService.createProduct(product);
                }

                // Update or create sync record
                if (productSync) {
                    await productSync.update({
                        shopifyProductId: shopifyProduct.product.id,
                        syncStatus: 'synced',
                        lastSyncedAt: new Date(),
                        errorMessage: null
                    });
                } else {
                    await ProductSync.create({
                        productId: product.id,
                        storeId: store.id,
                        shopifyProductId: shopifyProduct.product.id,
                        syncStatus: 'synced',
                        lastSyncedAt: new Date()
                    });
                }

                syncResults.push({
                    storeId: store.id,
                    shopDomain: store.shopDomain,
                    status: 'success',
                    shopifyProductId: shopifyProduct.product.id
                });
            } catch (error) {
                console.error(`Error syncing to store ${store.shopDomain}:`, error);

                // Update sync record with error
                await ProductSync.upsert({
                    productId: product.id,
                    storeId: store.id,
                    syncStatus: 'failed',
                    errorMessage: error.message,
                    lastSyncedAt: new Date()
                });

                syncResults.push({
                    storeId: store.id,
                    shopDomain: store.shopDomain,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Product sync completed',
            results: syncResults
        });
    } catch (error) {
        console.error('Error syncing product:', error);
        res.status(500).json({ error: 'Failed to sync product' });
    }
});

/**
 * GET /api/products/:id/sync-status
 * Get product sync status across all stores
 */
router.get('/:id/sync-status', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const syncs = await ProductSync.findAll({
            where: { productId: product.id },
            include: [
                {
                    model: Store,
                    as: 'store',
                    attributes: ['id', 'shopDomain', 'isInstalled']
                }
            ]
        });

        res.json({
            success: true,
            product: {
                id: product.id,
                title: product.title
            },
            syncs: syncs.map(sync => ({
                storeId: sync.storeId,
                shopDomain: sync.store.shopDomain,
                shopifyProductId: sync.shopifyProductId,
                syncStatus: sync.syncStatus,
                lastSyncedAt: sync.lastSyncedAt,
                errorMessage: sync.errorMessage
            }))
        });
    } catch (error) {
        console.error('Error fetching sync status:', error);
        res.status(500).json({ error: 'Failed to fetch sync status' });
    }
});

/**
 * DELETE /api/products/:id
 * Delete a product
 */
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete all associated syncs
        await ProductSync.destroy({
            where: { productId: product.id }
        });

        // Delete the product
        await product.destroy();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
