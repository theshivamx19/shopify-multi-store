'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductVariantShop extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProductVariantShop.belongsTo(models.ProductVariant, {
        foreignKey: 'productVariantId'
      });

      ProductVariantShop.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store'
      });
    }
  }
  ProductVariantShop.init({
    productVariantId: DataTypes.INTEGER,
    storeId: DataTypes.INTEGER,
    shopifyVariantGid: DataTypes.STRING,
    lastSyncedAt: DataTypes.DATE,
    syncStatus: DataTypes.STRING,
    syncErrorMessage: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'ProductVariantShop',
  });
  return ProductVariantShop;
};