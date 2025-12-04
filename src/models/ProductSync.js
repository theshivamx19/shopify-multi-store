const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductSync = sequelize.define('ProductSync', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id',
        references: {
            model: 'products',
            key: 'id'
        }
    },
    storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'store_id',
        references: {
            model: 'stores',
            key: 'id'
        }
    },
    shopifyProductId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'shopify_product_id'
    },
    syncStatus: {
        type: DataTypes.ENUM('pending', 'synced', 'failed', 'out_of_sync'),
        defaultValue: 'pending',
        field: 'sync_status'
    },
    lastSyncedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_synced_at'
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message'
    }
}, {
    tableName: 'product_syncs',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['product_id', 'store_id']
        }
    ]
});

module.exports = ProductSync;
