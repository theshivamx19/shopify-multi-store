import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, RefreshCw, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import api from '../utils/api';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [stores, setStores] = useState([]);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchStores();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/products');
            setProducts(response.data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await api.get('/api/stores');
            setStores(response.data.stores || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/api/products/${productId}`);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleSyncProduct = async (product) => {
        setSelectedProduct(product);
        setShowSyncModal(true);
    };

    const handleConfirmSync = async () => {
        if (!selectedProduct) return;

        try {
            setSyncing(true);
            await api.post(`/api/products/${selectedProduct.id}/sync`);
            alert('Product synced successfully!');
            setShowSyncModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Error syncing product:', error);
            alert('Failed to sync product');
        } finally {
            setSyncing(false);
        }
    };

    const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold gradient-text">Products</h1>
                    <p className="text-gray-400 mt-2">Manage your products across all stores</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={fetchProducts} variant="secondary">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Link to="/products/new">
                        <Button>
                            <Plus className="w-4 h-4" />
                            New Product
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <Card>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-glass pl-12"
                    />
                </div>
            </Card>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <Card key={product.id} className="animate-slide-up">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-accent-500/20 rounded-xl">
                                    <Package className="w-8 h-8 text-accent-400" />
                                </div>
                                <Badge variant={product.status === 'active' ? 'success' : 'warning'}>
                                    {product.status}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-bold mb-2 line-clamp-2">{product.title}</h3>

                            <div className="space-y-2 text-sm text-gray-400 mb-4">
                                <p>Vendor: {product.vendor || 'N/A'}</p>
                                <p>Type: {product.productType || 'N/A'}</p>
                                {product.tags && (
                                    <div className="flex flex-wrap gap-1">
                                        {console.log(product)}
                                        {product.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-xs">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleSyncProduct(product)}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Sync
                                </Button>
                                <Link to={`/products/edit/${product.id}`} className="flex-1">
                                    <Button variant="secondary" size="sm" className="w-full">
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteProduct(product.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <div className="max-w-md mx-auto">
                        <div className="p-4 bg-accent-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <Package className="w-10 h-10 text-accent-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">
                            {searchQuery ? 'No Products Found' : 'No Products Yet'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Create your first product to get started'}
                        </p>
                        {!searchQuery && (
                            <Link to="/products/new">
                                <Button>
                                    <Plus className="w-4 h-4" />
                                    Create Product
                                </Button>
                            </Link>
                        )}
                    </div>
                </Card>
            )}

            {/* Sync Modal */}
            <Modal
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                title="Sync Product"
                size="md"
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Product: {selectedProduct?.title}</h3>
                        <p className="text-sm text-gray-400">
                            This will sync the product to all connected stores ({stores.length} stores)
                        </p>
                    </div>

                    {stores.length === 0 && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-300 text-sm">
                                No stores connected. Please connect a store first.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowSyncModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleConfirmSync}
                            loading={syncing}
                            disabled={stores.length === 0}
                        >
                            Sync Now
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
