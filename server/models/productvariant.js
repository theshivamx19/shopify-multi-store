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
      // define association here
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