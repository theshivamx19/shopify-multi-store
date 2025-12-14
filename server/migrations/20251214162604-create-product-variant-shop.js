'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductVariantShops', {
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
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stores',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      shopifyVariantGid: {
        type: Sequelize.STRING
      },
      lastSyncedAt: {
        type: Sequelize.DATE  
      },
      syncStatus: {
        type: Sequelize.STRING
      },
      syncErrorMessage: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('ProductVariantShops');
  }
};