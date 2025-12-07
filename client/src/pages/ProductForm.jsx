import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../utils/api';

export default function ProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        vendor: '',
        productType: '',
        tags: '',
        status: 'draft',
    });

    useEffect(() => {
        if (isEdit) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/products/${id}`);
            const product = response.data.product;
            setFormData({
                title: product.title || '',
                description: product.description || '',
                vendor: product.vendor || '',
                productType: product.productType || '',
                tags: product.tags || '',
                status: product.status || 'draft',
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Failed to load product');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            if (isEdit) {
                await api.put(`/api/products/${id}`, formData);
                alert('Product updated successfully!');
            } else {
                await api.post('/api/products', formData);
                alert('Product created successfully!');
            }
            navigate('/products');
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setSaving(false);
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
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/products')}
                    className="p-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-4xl font-bold gradient-text">
                        {isEdit ? 'Edit Product' : 'Create Product'}
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {isEdit ? 'Update product details' : 'Add a new product to your catalog'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Product Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter product title"
                                className="input-glass"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter product description"
                                rows="4"
                                className="input-glass resize-none"
                            />
                        </div>

                        {/* Vendor and Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Vendor
                                </label>
                                <input
                                    type="text"
                                    name="vendor"
                                    value={formData.vendor}
                                    onChange={handleChange}
                                    placeholder="Enter vendor name"
                                    className="input-glass"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Product Type
                                </label>
                                <input
                                    type="text"
                                    name="productType"
                                    value={formData.productType}
                                    onChange={handleChange}
                                    placeholder="Enter product type"
                                    className="input-glass"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tags
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="Enter tags separated by commas"
                                className="input-glass"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Separate tags with commas (e.g., summer, sale, featured)
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="input-glass"
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/products')}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={saving}
                                className="flex-1"
                            >
                                <Save className="w-4 h-4" />
                                {isEdit ? 'Update Product' : 'Create Product'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}
