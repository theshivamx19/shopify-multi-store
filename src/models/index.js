const Store = require('./Store');
const Product = require('./Product');
const ProductSync = require('./ProductSync');

// Define associations
Product.hasMany(ProductSync, {
    foreignKey: 'product_id',
    as: 'syncs'
});

ProductSync.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

Store.hasMany(ProductSync, {
    foreignKey: 'store_id',
    as: 'syncs'
});

ProductSync.belongsTo(Store, {
    foreignKey: 'store_id',
    as: 'store'
});

module.exports = {
    Store,
    Product,
    ProductSync
};
