import React, { useState, useEffect } from 'react';
import { Store, Plus, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../utils/api';

export default function Stores() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [shopDomain, setShopDomain] = useState('');
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/stores');
            setStores(response.data.stores || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectStore = async (e) => {
        e.preventDefault();
        if (!shopDomain) return;

        try {
            setConnecting(true);
            // Redirect to OAuth flow
            window.location.href = `http://localhost:3000/auth?shop=${shopDomain}`;
        } catch (error) {
            console.error('Error connecting store:', error);
            setConnecting(false);
        }
    };

    const handleDeleteStore = async (storeId) => {
        if (!confirm('Are you sure you want to remove this store?')) return;

        try {
            await api.delete(`/api/stores/${storeId}`);
            fetchStores();
        } catch (error) {
            console.error('Error deleting store:', error);
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
                    <h1 className="text-4xl font-bold gradient-text">Stores</h1>
                    <p className="text-gray-400 mt-2">Manage your connected Shopify stores</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={fetchStores} variant="secondary">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowConnectModal(true)}>
                        <Plus className="w-4 h-4" />
                        Connect Store
                    </Button>
                </div>
            </div>

            {/* Stores Grid */}
            {stores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stores.map((store) => (
                        <Card key={store.id} className="animate-slide-up">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-primary-500/20 rounded-xl">
                                    <Store className="w-8 h-8 text-primary-400" />
                                </div>
                                <Badge variant={store.isInstalled ? 'success' : 'danger'}>
                                    {store.isInstalled ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-bold mb-2">{store.shopDomain}</h3>

                            <div className="space-y-2 text-sm text-gray-400 mb-4">
                                <p>Connected: {new Date(store.installedAt).toLocaleDateString()}</p>
                                <p>Store ID: #{store.id}</p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => window.open(`https://${store.shopDomain}`, '_blank')}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Visit
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteStore(store.id)}
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
                        <div className="p-4 bg-primary-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <Store className="w-10 h-10 text-primary-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">No Stores Connected</h3>
                        <p className="text-gray-400 mb-6">
                            Connect your first Shopify store to start managing products
                        </p>
                        <Button onClick={() => setShowConnectModal(true)}>
                            <Plus className="w-4 h-4" />
                            Connect Store
                        </Button>
                    </div>
                </Card>
            )}

            {/* Connect Store Modal */}
            <Modal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                title="Connect Shopify Store"
                size="md"
            >
                <form onSubmit={handleConnectStore} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Shop Domain
                        </label>
                        <input
                            type="text"
                            value={shopDomain}
                            onChange={(e) => setShopDomain(e.target.value)}
                            placeholder="your-store.myshopify.com"
                            className="input-glass"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Enter your Shopify store domain (e.g., your-store.myshopify.com)
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowConnectModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            loading={connecting}
                        >
                            Connect
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
