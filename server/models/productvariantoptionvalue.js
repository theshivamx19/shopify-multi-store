'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductVariantOptionValue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProductVariantOptionValue.init({
    productVariantId: DataTypes.INTEGER,
    productOptionId: DataTypes.INTEGER,
    productOptionValueId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductVariantOptionValue',
  });
  return ProductVariantOptionValue;
};