'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductVariantOptionValues', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productVariantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ProductVariants',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      productOptionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ProductOptions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      productOptionValueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ProductOptionValues',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProductVariantOptionValues');
  }
};