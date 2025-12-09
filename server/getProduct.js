const axios = require('axios');

/**
 * Fetch products from Shopify using GraphQL Admin API (2025-10)
 * This is the latest recommended approach by Shopify
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.shopDomain - Your Shopify store domain (e.g., 'your-store.myshopify.com')
 * @param {string} config.accessToken - Your Shopify Admin API access token
 * @param {number} config.first - Number of products to fetch (default: 50, max: 250)
 * @param {string} config.query - Search query filter (optional)
 * @param {string} config.sortKey - Sort key (TITLE, CREATED_AT, UPDATED_AT, etc.)
 * @returns {Promise<Object>} Products data with pageInfo
 */
async function fetchShopifyProducts(config) {
    const {
        shopDomain,
        accessToken,
        first = 50,
        query = '',
        sortKey = 'CREATED_AT'
    } = config;

    if (!shopDomain || !accessToken) {
        throw new Error('shopDomain and accessToken are required');
    }

    const graphqlQuery = `
    query getProducts($first: Int!, $query: String, $sortKey: ProductSortKeys) {
      products(first: $first, query: $query, sortKey: $sortKey) {
        edges {
          node {
            id
            title
            description
            handle
            status
            vendor
            productType
            tags
            createdAt
            updatedAt
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  compareAtPrice
                  inventoryQuantity
                  availableForSale
                }
              }
            }
            images(first: 10) {
              edges {
                node {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            featuredImage {
              url
              altText
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

    try {
        const response = await axios.post(
            `https://${shopDomain}/admin/api/2025-10/graphql.json`,
            {
                query: graphqlQuery,
                variables: {
                    first,
                    query: query || null,
                    sortKey
                }
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

        return response.data.data.products;
    } catch (error) {
        if (error.response) {
            console.error('Shopify API Error:', error.response.status, error.response.data);
            throw new Error(`Shopify API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error('No response received:', error.request);
            throw new Error('No response from Shopify API');
        } else {
            console.error('Error:', error.message);
            throw error;
        }
    }
}

/**
 * Fetch all products with cursor-based pagination (supports 2048+ variants per product)
 * @param {Object} config - Configuration object (same as fetchShopifyProducts)
 * @returns {Promise<Array>} Array of all products
 */
async function fetchAllShopifyProducts(config) {
    const { shopDomain, accessToken, query = '', sortKey = 'CREATED_AT' } = config;

    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;

    const graphqlQuery = `
    query getProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys) {
      products(first: $first, after: $after, query: $query, sortKey: $sortKey) {
        edges {
          node {
            id
            title
            description
            handle
            status
            vendor
            productType
            tags
            createdAt
            updatedAt
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  compareAtPrice
                  inventoryQuantity
                  availableForSale
                }
              }
            }
            images(first: 10) {
              edges {
                node {
                  id
                  url
                  altText
                }
              }
            }
            featuredImage {
              url
              altText
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    while (hasNextPage) {
        try {
            const response = await axios.post(
                `https://${shopDomain}/admin/api/2025-10/graphql.json`,
                {
                    query: graphqlQuery,
                    variables: {
                        first: 250, // Maximum per page
                        after: cursor,
                        query: query || null,
                        sortKey
                    }
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

            const productsData = response.data.data.products;
            const products = productsData.edges.map(edge => edge.node);
            allProducts = allProducts.concat(products);

            hasNextPage = productsData.pageInfo.hasNextPage;
            cursor = productsData.pageInfo.endCursor;

            console.log(`Fetched ${products.length} products. Total: ${allProducts.length}`);
        } catch (error) {
            console.error('Error fetching products:', error.message);
            throw error;
        }
    }

    return allProducts;
}

/**
 * Fetch a single product by ID
 * @param {Object} config - Configuration object
 * @param {string} config.shopDomain - Your Shopify store domain
 * @param {string} config.accessToken - Your Shopify Admin API access token
 * @param {string} config.productId - Product ID (e.g., 'gid://shopify/Product/123456789')
 * @returns {Promise<Object>} Product data
 */
async function fetchShopifyProductById(config) {
    const { shopDomain, accessToken, productId } = config;

    if (!shopDomain || !accessToken || !productId) {
        throw new Error('shopDomain, accessToken, and productId are required');
    }

    const graphqlQuery = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        descriptionHtml
        handle
        status
        vendor
        productType
        tags
        createdAt
        updatedAt
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 250) {
          edges {
            node {
              id
              title
              sku
              price
              compareAtPrice
              inventoryQuantity
              availableForSale
              selectedOptions {
                name
                value
              }
            }
          }
        }
        images(first: 50) {
          edges {
            node {
              id
              url
              altText
              width
              height
            }
          }
        }
        featuredImage {
          url
          altText
        }
        options {
          id
          name
          values
          position
        }
      }
    }
  `;

    try {
        const response = await axios.post(
            `https://${shopDomain}/admin/api/2025-10/graphql.json`,
            {
                query: graphqlQuery,
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

        return response.data.data.product;
    } catch (error) {
        console.error('Error fetching product:', error.message);
        throw error;
    }
}

// Example usage
async function main() {
    const config = {
        shopDomain: 'your-store.myshopify.com',
        accessToken: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxx'
    };

    try {
        // Fetch first 50 products
        console.log('Fetching products...');
        const productsData = await fetchShopifyProducts(config);
        console.log(`Fetched ${productsData.edges.length} products`);
        console.log('First product:', productsData.edges[0]?.node);

        // Fetch products with filters
        // const activeProducts = await fetchShopifyProducts({
        //   ...config,
        //   query: 'status:ACTIVE',
        //   first: 10
        // });

        // Fetch all products with pagination
        // const allProducts = await fetchAllShopifyProducts(config);
        // console.log(`Total products: ${allProducts.length}`);

        // Fetch single product by ID
        // const product = await fetchShopifyProductById({
        //   ...config,
        //   productId: 'gid://shopify/Product/123456789'
        // });
    } catch (error) {
        console.error('Failed to fetch products:', error.message);
    }
}

// Uncomment to run
// main();

module.exports = {
    fetchShopifyProducts,
    fetchAllShopifyProducts,
    fetchShopifyProductById
};

// https://claude.ai/public/artifacts/3f0fd2f8-b0dd-4154-842b-6014947424f7