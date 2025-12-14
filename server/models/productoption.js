'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductOption extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProductOption.init({
    productId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    position: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductOption',
  });
  return ProductOption;
};