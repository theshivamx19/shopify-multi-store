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
      ProductVariantOptionValue.belongsTo(models.ProductVariant, {
        foreignKey: 'productVariantId'
      });


      // ProductVariantOptionValue -> ProductOption
      ProductVariantOptionValue.belongsTo(models.ProductOption, {
        foreignKey: 'productOptionId',
        as: 'option'
      });

      // ProductVariantOptionValue -> ProductOptionValue
      ProductVariantOptionValue.belongsTo(models.ProductOptionValue, {
        foreignKey: 'productOptionValueId',
        as: 'value'
      });
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