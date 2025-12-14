'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Product.hasMany(models.ProductOption, {
        foreignKey: 'productId',
        as: 'options'
      });

      Product.hasMany(models.ProductVariant, {
        foreignKey: 'productId',
        as: 'variants'
      });

      // Product -> ProductShop (1:N) - Sync tracking
      Product.hasMany(models.ProductShop, {
        foreignKey: 'productId',
        as: 'shopMappings'
      });
    }
  }
  Product.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    productType: DataTypes.STRING,
    vendor: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};