const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    vendor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    productType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'product_type'
    },
    tags: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('tags');
            return rawValue ? rawValue.split(',') : [];
        },
        set(value) {
            this.setDataValue('tags', Array.isArray(value) ? value.join(',') : value);
        }
    },
    variants: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('active', 'draft', 'archived'),
        defaultValue: 'draft'
    }
}, {
    tableName: 'products',
    timestamps: true,
    underscored: true
});

module.exports = Product;
