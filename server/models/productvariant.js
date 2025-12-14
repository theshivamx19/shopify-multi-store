'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductVariant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProductVariant.belongsTo(models.Product, {
        foreignKey: 'productId'
      });

      // ProductVariant -> ProductVariantOptionValue (1:N)
      ProductVariant.hasMany(models.ProductVariantOptionValue, {
        foreignKey: 'productVariantId',
        as: 'optionValues'
      });

      // ProductVariant -> ProductVariantShop (1:N) - Variant sync tracking
      ProductVariant.hasMany(models.ProductVariantShop, {
        foreignKey: 'productVariantId',
        as: 'shopMappings'
      });
    }
  }
  ProductVariant.init({
    productId: DataTypes.INTEGER,
    sku: DataTypes.STRING,
    barcode: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    compareAtPrice: DataTypes.DECIMAL,
    cost: DataTypes.DECIMAL,
    inventoryQuantity: DataTypes.INTEGER,
    position: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductVariant',
  });
  return ProductVariant;
};