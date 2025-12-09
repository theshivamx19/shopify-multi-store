const axios = require('axios');

/**
 * Create a simple product on Shopify using productCreate (Latest Method)
 * Best for: Simple products without variants or when you need basic product creation
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.shopDomain - Your Shopify store domain
 * @param {string} config.accessToken - Your Shopify Admin API access token
 * @param {Object} config.product - Product details
 * @returns {Promise<Object>} Created product data
 */
async function createSimpleProduct(config) {
  const { shopDomain, accessToken, product } = config;

  if (!shopDomain || !accessToken || !product) {
    throw new Error('shopDomain, accessToken, and product are required');
  }

  const mutation = `
    mutation createProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          title
          handle
          description
          status
          vendor
          productType
          tags
          createdAt
          variants(first: 10) {
            nodes {
              id
              title
              sku
              price
            }
          }
          images(first: 10) {
            nodes {
              id
              url
              altText
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    product: {
      title: product.title,
      descriptionHtml: product.description || '',
      vendor: product.vendor || '',
      productType: product.productType || '',
      tags: product.tags || [],
      status: product.status || 'ACTIVE', // ACTIVE, DRAFT, ARCHIVED
      productOptions: product.productOptions || []
    },
    media: product.media || []
  };

  try {
    const response = await axios.post(
      `https://${shopDomain}/admin/api/2025-10/graphql.json`,
      {
        query: mutation,
        variables
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
    }

    const { product: createdProduct, userErrors } = response.data.data.productCreate;

    if (userErrors && userErrors.length > 0) {
      throw new Error(`User Errors: ${JSON.stringify(userErrors)}`);
    }

    return createdProduct;
  } catch (error) {
    console.error('Error creating product:', error.message);
    throw error;
  }
}

/**
 * Create a complete product with variants using productSet (Recommended Method)
 * Best for: Products with multiple variants, complex options, inventory management
 * This is the most powerful and recommended approach for 2025
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.shopDomain - Your Shopify store domain
 * @param {string} config.accessToken - Your Shopify Admin API access token
 * @param {Object} config.productSet - Complete product details with variants
 * @returns {Promise<Object>} Created product data
 */
async function createProductWithVariants(config) {
  const { shopDomain, accessToken, productSet } = config;

  if (!shopDomain || !accessToken || !productSet) {
    throw new Error('shopDomain, accessToken, and productSet are required');
  }

  const mutation = `
    mutation createProduct($productSet: ProductSetInput!, $synchronous: Boolean!) {
      productSet(synchronous: $synchronous, input: $productSet) {
        product {
          id
          title
          handle
          description
          status
          vendor
          productType
          tags
          options(first: 10) {
            id
            name
            position
            optionValues {
              id
              name
              hasVariants
            }
          }
          variants(first: 100) {
            nodes {
              id
              title
              sku
              price
              compareAtPrice
              inventoryQuantity
              selectedOptions {
                name
                optionValue {
                  id
                  name
                }
              }
            }
          }
          images(first: 10) {
            nodes {
              id
              url
              altText
            }
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = {
    synchronous: true, // Set to false for large products (async processing)
    productSet: {
      title: productSet.title,
      descriptionHtml: productSet.description || '',
      vendor: productSet.vendor || '',
      productType: productSet.productType || '',
      status: productSet.status || 'ACTIVE',
      tags: productSet.tags || [],
      productOptions: productSet.productOptions || [],
      variants: productSet.variants || []
    }
  };

  try {
    const response = await axios.post(
      `https://${shopDomain}/admin/api/2025-10/graphql.json`,
      {
        query: mutation,
        variables
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
    }

    const { product, userErrors } = response.data.data.productSet;

    if (userErrors && userErrors.length > 0) {
      throw new Error(`User Errors: ${JSON.stringify(userErrors)}`);
    }

    return product;
  } catch (error) {
    console.error('Error creating product:', error.message);
    throw error;
  }
}

/**
 * Publish a product to sales channels
 * Products are created unpublished by default
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.shopDomain - Your Shopify store domain
 * @param {string} config.accessToken - Your Shopify Admin API access token
 * @param {string} config.productId - Product ID to publish
 * @returns {Promise<Object>} Result
 */
async function publishProduct(config) {
  const { shopDomain, accessToken, productId } = config;

  const mutation = `
    mutation publishProduct($id: ID!) {
      publishablePublishToCurrentChannel(id: $id) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      `https://${shopDomain}/admin/api/2025-10/graphql.json`,
      {
        query: mutation,
        variables: { id: productId }
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data.publishablePublishToCurrentChannel;
  } catch (error) {
    console.error('Error publishing product:', error.message);
    throw error;
  }
}

// Example Usage
async function main() {
  const config = {
    shopDomain: 'your-store.myshopify.com',
    accessToken: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxx'
  };

  try {
    // Example 1: Create a simple product (no variants)
    console.log('Creating simple product...');
    const simpleProduct = await createSimpleProduct({
      ...config,
      product: {
        title: 'Wireless Headphones',
        description: '<p>High-quality wireless headphones with noise cancellation</p>',
        vendor: 'AudioTech',
        productType: 'Electronics',
        tags: ['audio', 'wireless', 'electronics'],
        status: 'ACTIVE'
      }
    });
    console.log('Simple Product Created:', simpleProduct.id);

    // Example 2: Create product with variants (RECOMMENDED)
    console.log('\nCreating product with variants...');
    const productWithVariants = await createProductWithVariants({
      ...config,
      productSet: {
        title: 'Premium T-Shirt',
        description: '<p>Comfortable cotton t-shirt available in multiple sizes and colors</p>',
        vendor: 'Fashion Brand',
        productType: 'Apparel',
        tags: ['clothing', 'tshirt', 'cotton'],
        status: 'ACTIVE',
        productOptions: [
          {
            name: 'Size',
            position: 1,
            values: [
              { name: 'Small' },
              { name: 'Medium' },
              { name: 'Large' }
            ]
          },
          {
            name: 'Color',
            position: 2,
            values: [
              { name: 'Red' },
              { name: 'Blue' },
              { name: 'Green' }
            ]
          }
        ],
        variants: [
          {
            optionValues: [
              { optionName: 'Size', name: 'Small' },
              { optionName: 'Color', name: 'Red' }
            ],
            price: '19.99',
            compareAtPrice: '29.99',
            sku: 'TSHIRT-SM-RED'
          },
          {
            optionValues: [
              { optionName: 'Size', name: 'Small' },
              { optionName: 'Color', name: 'Blue' }
            ],
            price: '19.99',
            compareAtPrice: '29.99',
            sku: 'TSHIRT-SM-BLUE'
          },
          {
            optionValues: [
              { optionName: 'Size', name: 'Medium' },
              { optionName: 'Color', name: 'Red' }
            ],
            price: '21.99',
            compareAtPrice: '31.99',
            sku: 'TSHIRT-MD-RED'
          }
          // Add more variant combinations as needed
        ]
      }
    });
    console.log('Product with Variants Created:', productWithVariants.id);
    console.log('Total Variants:', productWithVariants.variants.nodes.length);

    // Example 3: Publish the product
    console.log('\nPublishing product...');
    await publishProduct({
      ...config,
      productId: productWithVariants.id
    });
    console.log('Product published successfully!');

  } catch (error) {
    console.error('Failed:', error.message);
  }
}

// Uncomment to run
// main();

module.exports = {
  createSimpleProduct,
  createProductWithVariants,
  publishProduct
};


// https://claude.ai/public/artifacts/8074e887-1d51-4408-8fad-d29854116862


// I'm ready to use these api's /functions or do i need to do any initial setup?