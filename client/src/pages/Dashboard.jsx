import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Package, RefreshCw, TrendingUp, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../utils/api';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalStores: 0,
        totalProducts: 0,
        syncedProducts: 0,
        pendingSync: 0,
    });
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [storesRes, productsRes] = await Promise.all([
                api.get('/api/stores'),
                api.get('/api/products'),
            ]);

            setStores(storesRes.data.stores || []);
            setProducts(productsRes.data.products || []);

            // Calculate stats
            setStats({
                totalStores: storesRes.data.count || 0,
                totalProducts: productsRes.data.count || 0,
                syncedProducts: productsRes.data.products?.filter(p => p.status === 'active').length || 0,
                pendingSync: productsRes.data.products?.filter(p => p.status === 'draft').length || 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
                    <p className="text-gray-400 mt-2">Welcome to your Shopify multi-store manager</p>
                </div>
                <Button onClick={fetchDashboardData} variant="secondary">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="animate-slide-up">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Stores</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalStores}</p>
                        </div>
                        <div className="p-4 bg-primary-500/20 rounded-xl">
                            <Store className="w-8 h-8 text-primary-400" />
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Products</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
                        </div>
                        <div className="p-4 bg-accent-500/20 rounded-xl">
                            <Package className="w-8 h-8 text-accent-400" />
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Active Products</p>
                            <p className="text-3xl font-bold mt-2">{stats.syncedProducts}</p>
                        </div>
                        <div className="p-4 bg-green-500/20 rounded-xl">
                            <TrendingUp className="w-8 h-8 text-green-400" />
                        </div>
                    </div>
                </Card>

                <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Draft Products</p>
                            <p className="text-3xl font-bold mt-2">{stats.pendingSync}</p>
                        </div>
                        <div className="p-4 bg-yellow-500/20 rounded-xl">
                            <RefreshCw className="w-8 h-8 text-yellow-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/stores">
                        <div className="glass-hover p-6 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-primary-500/20 rounded-lg">
                                <Store className="w-6 h-6 text-primary-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Connect Store</h3>
                                <p className="text-sm text-gray-400">Add a new Shopify store</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/products/new">
                        <div className="glass-hover p-6 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-accent-500/20 rounded-lg">
                                <Plus className="w-6 h-6 text-accent-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Create Product</h3>
                                <p className="text-sm text-gray-400">Add a new product</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </Card>

            {/* Recent Stores */}
            {stores.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Connected Stores</h2>
                        <Link to="/stores">
                            <Button variant="ghost" size="sm">View All</Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stores.slice(0, 3).map((store) => (
                            <div key={store.id} className="glass-hover p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-500/20 rounded-lg">
                                        <Store className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{store.shopDomain}</p>
                                        <p className="text-xs text-gray-400">
                                            Connected {new Date(store.installedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={store.isInstalled ? 'success' : 'danger'}>
                                    {store.isInstalled ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Recent Products */}
            {products.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Recent Products</h2>
                        <Link to="/products">
                            <Button variant="ghost" size="sm">View All</Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {products.slice(0, 3).map((product) => (
                            <div key={product.id} className="glass-hover p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-accent-500/20 rounded-lg">
                                        <Package className="w-5 h-5 text-accent-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{product.title}</p>
                                        <p className="text-xs text-gray-400">{product.vendor || 'No vendor'}</p>
                                    </div>
                                </div>
                                <Badge variant={product.status === 'active' ? 'success' : 'warning'}>
                                    {product.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Empty State */}
            {stores.length === 0 && products.length === 0 && (
                <Card className="text-center py-12">
                    <div className="max-w-md mx-auto">
                        <div className="p-4 bg-primary-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <Store className="w-10 h-10 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Get Started</h3>
                        <p className="text-gray-400 mb-6">
                            Connect your first Shopify store to start managing products across multiple stores
                        </p>
                        <Link to="/stores">
                            <Button>
                                <Plus className="w-4 h-4" />
                                Connect Store
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}
        </div>
    );
}
