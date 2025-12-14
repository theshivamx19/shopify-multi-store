// ==================== SHOPIFY SYNC SERVICE ====================
// services/shopifySyncService.js
const { Session } = require('@shopify/shopify-api');
const shopify = require('../config/shopify.js');
const db = require('../models/index.js');
const ProductService = require('./productService.js');

const { Store, ProductShop, ProductVariantShop, ProductOption, ProductOptionValue } = db;
const productService = new ProductService();

class ShopifySyncService {
    /**
     * Create product on single Shopify store
     */
    async syncProductToStore(productId, storeId) {
        const product = await productService.getProductComplete(productId);
        if (!product) throw new Error('Product not found');

        const store = await Store.findByPk(storeId);
        if (!store) throw new Error('Store not found');

        // Create Shopify session
        const session = new Session({
            id: `offline_${store.storeDomain}`,
            shop: store.storeDomain,
            state: 'unused',
            isOnline: false,
            accessToken: store.accessToken,
        });

        const client = new shopify.clients.Graphql({ session });

        try {
            // Step 1: Create base product with options
            const productOptions = product.options.map(opt => ({
                name: opt.name,
                values: opt.values.map(v => ({ name: v.value }))
            }));

            const createMutation = `
        mutation CreateProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              options(first: 10) {
                id
                name
                values
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

            const createResponse = await client.request(createMutation, {
                variables: {
                    input: {
                        title: product.title,
                        descriptionHtml: product.description,
                        vendor: product.vendor,
                        productType: product.productType,
                        status: product.status,
                        productOptions
                    }
                }
            });

            if (createResponse.data.productCreate.userErrors?.length) {
                throw new Error(JSON.stringify(createResponse.data.productCreate.userErrors));
            }

            const shopifyProduct = createResponse.data.productCreate.product;

            // Map Shopify option IDs
            const optionIdMap = {};
            shopifyProduct.options.forEach(opt => {
                optionIdMap[opt.name] = opt.id;
            });

            // Fetch location ID
            const locationQuery = `
        query {
          locations(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      `;
            const locationResponse = await client.request(locationQuery);
            const locationId = locationResponse.data.locations.edges[0]?.node?.id;

            if (!locationId) {
                throw new Error('No location found for store');
            }

            // Step 2: Create variants
            const variantsInput = product.variants.map(variant => {
                // Build option values from relationships
                const optionValues = variant.optionValues.map(ov => ({
                    optionId: optionIdMap[ov.option.name],
                    name: ov.value.value
                }));

                return {
                    price: variant.price.toString(),
                    compareAtPrice: variant.compareAtPrice?.toString(),
                    optionValues,
                    inventoryItem: {
                        tracked: true,
                        sku: variant.sku,
                        measurement: {
                            weight: { value: 0.0, unit: 'KILOGRAMS' }
                        }
                    },
                    inventoryQuantities: [{
                        availableQuantity: variant.inventoryQuantity || 0,
                        locationId: locationId
                    }]
                };
            });

            const variantMutation = `
        mutation CreateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) {
          productVariantsBulkCreate(
            productId: $productId,
            variants: $variants,
            strategy: $strategy
          ) {
            productVariants {
              id
              sku
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

            const variantResponse = await client.request(variantMutation, {
                variables: {
                    productId: shopifyProduct.id,
                    variants: variantsInput,
                    strategy: 'REMOVE_STANDALONE_VARIANT'
                }
            });

            if (variantResponse.data.productVariantsBulkCreate.userErrors?.length) {
                throw new Error(JSON.stringify(variantResponse.data.productVariantsBulkCreate.userErrors));
            }

            const shopifyVariants = variantResponse.data.productVariantsBulkCreate.productVariants;

            // Save sync mappings
            await ProductShop.create({
                productId: product.id,
                storeId: store.id,
                shopifyProductGid: shopifyProduct.id,
                syncStatus: 'SYNCED',
                lastSyncedAt: new Date()
            });

            // Save variant mappings
            for (let i = 0; i < shopifyVariants.length; i++) {
                await ProductVariantShop.create({
                    productVariantId: product.variants[i].id,
                    storeId: store.id,
                    shopifyVariantGid: shopifyVariants[i].id,
                    syncStatus: 'SYNCED',
                    lastSyncedAt: new Date()
                });
            }

            return {
                success: true,
                shopifyProductId: shopifyProduct.id,
                variantsCreated: shopifyVariants.length
            };
        } catch (error) {
            // Save failed sync
            await ProductShop.upsert({
                productId: product.id,
                storeId: store.id,
                shopifyProductGid: 'FAILED',
                syncStatus: 'FAILED',
                syncErrorMessage: error.message,
                lastSyncedAt: new Date()
            });

            throw error;
        }
    }

    /**
     * Sync product to all active stores
     */
    async syncProductToAllStores(productId) {
        const stores = await Store.findAll({
            where: { isActive: true }
        });

        if (stores.length === 0) {
            throw new Error('No active stores found');
        }

        const results = [];

        for (const store of stores) {
            try {
                const result = await this.syncProductToStore(productId, store.id);
                results.push({
                    storeId: store.id,
                    storeDomain: store.storeDomain,
                    success: true,
                    ...result
                });
            } catch (error) {
                results.push({
                    storeId: store.id,
                    storeDomain: store.storeDomain,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }
}

module.exports = ShopifySyncService;
