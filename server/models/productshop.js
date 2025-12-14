'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductShop extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProductShop.init({
    productId: DataTypes.INTEGER,
    storeId: DataTypes.INTEGER,
    shopifyProductGid: DataTypes.STRING,
    lastSyncedAt: DataTypes.DATE,
    syncStatus: DataTypes.STRING,
    syncErrorMessage: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'ProductShop',
  });
  return ProductShop;
};