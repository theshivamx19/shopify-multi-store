const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Store = sequelize.define('Store', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shopDomain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'shop_domain',
        validate: {
            is: /^[a-zA-Z0-9-]+\.myshopify\.com$/
        }
    },
    accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'access_token'
    },
    scope: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isInstalled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_installed'
    },
    installedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'installed_at'
    }
}, {
    tableName: 'stores',
    timestamps: true,
    underscored: true
});

module.exports = Store;
