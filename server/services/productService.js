// ==================== PRODUCT SERVICE ====================
// services/productService.js
const db = require('../models/index.js');

const { Product, ProductOption, ProductOptionValue, ProductVariant, ProductVariantOptionValue } = db;

class ProductService {
    /**
     * Create complete product with options and variants
     */
    async createProduct(productData, transaction = null) {
        const t = transaction || await db.sequelize.transaction();

        try {
            // 1. Create product
            const product = await Product.create({
                title: productData.title,
                description: productData.description,
                productType: productData.productType,
                vendor: productData.vendor,
                status: productData.status || 'ACTIVE'
            }, { transaction: t });

            // 2. Create options
            const optionMap = {}; // Map option name to option ID
            const valueMap = {}; // Map "optionName:value" to value ID

            if (productData.options && productData.options.length > 0) {
                for (let i = 0; i < productData.options.length; i++) {
                    const optData = productData.options[i];

                    const option = await ProductOption.create({
                        productId: product.id,
                        name: optData.name,
                        position: i + 1
                    }, { transaction: t });

                    optionMap[optData.name] = option.id;

                    // Create option values
                    for (const val of optData.values) {
                        const optionValue = await ProductOptionValue.create({
                            productOptionId: option.id,
                            value: val
                        }, { transaction: t });

                        valueMap[`${optData.name}:${val}`] = optionValue.id;
                    }
                }
            }

            // 3. Create variants
            if (productData.variants && productData.variants.length > 0) {
                for (let i = 0; i < productData.variants.length; i++) {
                    const varData = productData.variants[i];

                    const variant = await ProductVariant.create({
                        productId: product.id,
                        sku: varData.sku,
                        barcode: varData.barcode,
                        price: varData.price,
                        compareAtPrice: varData.compareAtPrice,
                        cost: varData.cost,
                        inventoryQuantity: varData.inventoryQuantity || 0,
                        position: i + 1
                    }, { transaction: t });

                    // Link variant to option values
                    if (varData.optionValues) {
                        for (const [optionName, value] of Object.entries(varData.optionValues)) {
                            const optionId = optionMap[optionName];
                            const valueId = valueMap[`${optionName}:${value}`];

                            if (optionId && valueId) {
                                await ProductVariantOptionValue.create({
                                    productVariantId: variant.id,
                                    productOptionId: optionId,
                                    productOptionValueId: valueId
                                }, { transaction: t });
                            }
                        }
                    }
                }
            }

            if (!transaction) await t.commit();
            return product;
        } catch (error) {
            if (!transaction) await t.rollback();
            throw error;
        }
    }

    /**
     * Get complete product with all relationships
     */
    async getProductComplete(productId) {
        const product = await Product.findByPk(productId, {
            include: [
                {
                    model: ProductOption,
                    as: 'options',
                    include: [{
                        model: ProductOptionValue,
                        as: 'values'
                    }]
                },
                {
                    model: ProductVariant,
                    as: 'variants',
                    include: [{
                        model: ProductVariantOptionValue,
                        as: 'optionValues',
                        include: [
                            {
                                model: ProductOption,
                                as: 'option'
                            },
                            {
                                model: ProductOptionValue,
                                as: 'value'
                            }
                        ]
                    }]
                }
            ]
        });

        return product;
    }

    /**
     * Get all products with pagination
     */
    async getProducts(filters = {}) {
        const { page = 1, limit = 50, status, vendor, search } = filters;

        const where = {};
        if (status) where.status = status;
        if (vendor) where.vendor = vendor;
        if (search) {
            where.title = { [db.Sequelize.Op.iLike]: `%${search}%` };
        }

        const { count, rows } = await Product.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['createdAt', 'DESC']]
        });

        return {
            products: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        };
    }
}

module.exports = ProductService;
