const express = require('express');
const router = express.Router();
const { Store, ProductSync } = require('../models');

/**
 * GET /api/stores
 * Get all connected stores
 */
router.get('/', async (req, res) => {
    try {
        const stores = await Store.findAll({
            attributes: ['id', 'shopDomain', 'isInstalled', 'installedAt', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: stores.length,
            stores
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

/**
 * GET /api/stores/:id
 * Get store details with sync statistics
 */
router.get('/:id', async (req, res) => {
    try {
        const store = await Store.findByPk(req.params.id, {
            attributes: ['id', 'shopDomain', 'isInstalled', 'installedAt', 'createdAt'],
            include: [
                {
                    model: ProductSync,
                    as: 'syncs',
                    attributes: ['syncStatus']
                }
            ]
        });

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Calculate sync statistics
        const syncStats = {
            total: store.syncs.length,
            synced: store.syncs.filter(s => s.syncStatus === 'synced').length,
            pending: store.syncs.filter(s => s.syncStatus === 'pending').length,
            failed: store.syncs.filter(s => s.syncStatus === 'failed').length,
            outOfSync: store.syncs.filter(s => s.syncStatus === 'out_of_sync').length
        };

        res.json({
            success: true,
            store: {
                id: store.id,
                shopDomain: store.shopDomain,
                isInstalled: store.isInstalled,
                installedAt: store.installedAt,
                createdAt: store.createdAt,
                syncStats
            }
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({ error: 'Failed to fetch store details' });
    }
});

/**
 * DELETE /api/stores/:id
 * Remove a store connection
 */
router.delete('/:id', async (req, res) => {
    try {
        const store = await Store.findByPk(req.params.id);

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Delete all associated product syncs
        await ProductSync.destroy({
            where: { storeId: req.params.id }
        });

        // Delete the store
        await store.destroy();

        res.json({
            success: true,
            message: 'Store removed successfully'
        });
    } catch (error) {
        console.error('Error removing store:', error);
        res.status(500).json({ error: 'Failed to remove store' });
    }
});

module.exports = router;
