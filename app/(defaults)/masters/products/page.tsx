'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Swal from 'sweetalert2';

interface ProductType {
    _id: string;
    name: string;
    category: 'Input' | 'Output' | 'Both';
    hsnCode?: string;
    gstPercentage: number;
    unit: string;
    baseRate: number;
    description?: string;
    status: 'active' | 'inactive';
}

const ProductsPage = () => {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        category: 'Output' as 'Input' | 'Output' | 'Both',
        hsnCode: '',
        gstPercentage: 5,
        unit: 'MT',
        baseRate: 0,
        description: '',
        status: 'active' as 'active' | 'inactive',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            setProducts(res.data.data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product?: ProductType) => {
        if (product) {
            setEditingProduct(product);
            setForm({
                name: product.name || '',
                category: product.category || 'Output',
                hsnCode: product.hsnCode || '',
                gstPercentage: product.gstPercentage ?? 5,
                unit: product.unit || 'MT',
                baseRate: product.baseRate || 0,
                description: product.description || '',
                status: product.status || 'active',
            });
        } else {
            setEditingProduct(null);
            setForm({
                name: '',
                category: 'Output',
                hsnCode: '',
                gstPercentage: 5,
                unit: 'MT',
                baseRate: 0,
                description: '',
                status: 'active',
            });
        }
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(f => ({
            ...f,
            [name]: name === 'gstPercentage' || name === 'baseRate' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return Swal.fire('Error', 'Product name is required', 'error');

        setSaving(true);
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, form);
                Swal.fire({ icon: 'success', title: 'Product updated!', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/products', form);
                Swal.fire({ icon: 'success', title: 'Product created!', timer: 1500, showConfirmButton: false });
            }
            setShowModal(false);
            fetchProducts();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to save product', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const confirm = await Swal.fire({
            title: `Delete product "${name}"?`,
            text: 'This will affect linked weighments & stock records.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        try {
            await api.delete(`/products/${id}`);
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
            fetchProducts();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to delete product', 'error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl shadow">
                        🧱
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Product Master</h1>
                        <p className="text-xs text-gray-500">Crusher output materials (M-Sand, 12mm, 20mm, Dust) &amp; input raw materials (ROM)</p>
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary text-sm font-bold shadow-md">
                    + Add New Product
                </button>
            </div>

            {/* Product Cards Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="panel bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
                    <p className="text-xs text-green-700 dark:text-green-400 font-semibold uppercase">Output Products (Selling)</p>
                    <p className="text-2xl font-black text-green-600 dark:text-green-400">
                        {products.filter(p => p.category === 'Output' || p.category === 'Both').length}
                    </p>
                </div>
                <div className="panel bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase">Input Raw Materials (Purchasing)</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {products.filter(p => p.category === 'Input' || p.category === 'Both').length}
                    </p>
                </div>
                <div className="panel bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
                    <p className="text-xs text-purple-700 dark:text-purple-400 font-semibold uppercase">Total Products</p>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{products.length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="panel p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Product Name</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">HSN Code</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">GST %</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Unit</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Default Rate / Ton</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Loading products...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        No products configured. Click "+ Add New Product" to create your first product (e.g. M-Sand, 20mm).
                                    </td>
                                </tr>
                            ) : (
                                products.map((product, idx) => (
                                    <tr
                                        key={product._id}
                                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                            idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    product.category === 'Output'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                        : product.category === 'Input'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                                                }`}
                                            >
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                                            {product.hsnCode || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                                            {product.gstPercentage}%
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-400">
                                            {product.unit}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                            ₹{(product.baseRate || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    product.status === 'active'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                                }`}
                                            >
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(product)}
                                                    className="px-2.5 py-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded hover:bg-indigo-100 transition"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id, product.name)}
                                                    className="px-2.5 py-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded hover:bg-red-100 transition"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="panel max-w-lg w-full my-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. M-Sand, 20mm, 12mm, Dust, ROM Stone"
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select name="category" value={form.category} onChange={handleChange} className="form-select">
                                        <option value="Output">Output (Crushed Product Sold)</option>
                                        <option value="Input">Input (Raw Material Purchased)</option>
                                        <option value="Both">Both (Purchased &amp; Sold)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                                    <select name="unit" value={form.unit} onChange={handleChange} className="form-select">
                                        <option value="MT">MT (Metric Tons)</option>
                                        <option value="Tons">Tons</option>
                                        <option value="CFT">CFT</option>
                                        <option value="Loads">Loads</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">HSN Code</label>
                                    <input
                                        type="text"
                                        name="hsnCode"
                                        value={form.hsnCode}
                                        onChange={handleChange}
                                        placeholder="e.g. 2517"
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">GST Percentage (%)</label>
                                    <input
                                        type="number"
                                        name="gstPercentage"
                                        value={form.gstPercentage}
                                        onChange={handleChange}
                                        step="0.1"
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Base Selling Rate / Ton (₹)</label>
                                    <input
                                        type="number"
                                        name="baseRate"
                                        value={form.baseRate}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select name="status" value={form.status} onChange={handleChange} className="form-select">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Optional notes or specifications"
                                    className="form-textarea"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline-secondary flex-1 py-2.5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5 font-bold">
                                    {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
