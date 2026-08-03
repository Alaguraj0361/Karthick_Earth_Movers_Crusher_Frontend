'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Swal from 'sweetalert2';

interface ProductType {
    _id: string;
    name: string;
    unit: string;
}

interface Supplier {
    _id: string;
    name: string;
    contactPerson?: string;
    mobile?: string;
    altMobile?: string;
    address?: string;
    gstin?: string;
    panNumber?: string;
    materialSupplied?: ProductType[] | string[];
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    defaultRatePerTon?: number;
    openingBalance?: number;
    notes?: string;
    status: 'active' | 'inactive';
}

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        contactPerson: '',
        mobile: '',
        altMobile: '',
        address: '',
        gstin: '',
        panNumber: '',
        materialSupplied: [] as string[],
        defaultRatePerTon: 0,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        openingBalance: 0,
        notes: '',
        status: 'active' as 'active' | 'inactive',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [suppRes, prodRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/products?status=active')
            ]);
            setSuppliers(suppRes.data.data || []);
            setProducts(prodRes.data.data || []);
        } catch (err) {
            console.error('Error loading supplier data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setForm({
                name: supplier.name || '',
                contactPerson: supplier.contactPerson || '',
                mobile: supplier.mobile || '',
                altMobile: supplier.altMobile || '',
                address: supplier.address || '',
                gstin: supplier.gstin || '',
                panNumber: supplier.panNumber || '',
                materialSupplied: (supplier.materialSupplied || []).map((m: any) => typeof m === 'object' ? m._id : m),
                defaultRatePerTon: supplier.defaultRatePerTon || 0,
                bankName: supplier.bankName || '',
                accountNumber: supplier.accountNumber || '',
                ifscCode: supplier.ifscCode || '',
                openingBalance: supplier.openingBalance || 0,
                notes: supplier.notes || '',
                status: supplier.status || 'active',
            });
        } else {
            setEditingSupplier(null);
            setForm({
                name: '',
                contactPerson: '',
                mobile: '',
                altMobile: '',
                address: '',
                gstin: '',
                panNumber: '',
                materialSupplied: [],
                defaultRatePerTon: 0,
                bankName: '',
                accountNumber: '',
                ifscCode: '',
                openingBalance: 0,
                notes: '',
                status: 'active',
            });
        }
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleMaterialToggle = (prodId: string) => {
        setForm(f => {
            const exists = f.materialSupplied.includes(prodId);
            return {
                ...f,
                materialSupplied: exists
                    ? f.materialSupplied.filter(id => id !== prodId)
                    : [...f.materialSupplied, prodId]
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            return Swal.fire('Error', 'Supplier name is required', 'error');
        }

        setSaving(true);
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier._id}`, form);
                Swal.fire({ icon: 'success', title: 'Supplier updated!', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/suppliers', form);
                Swal.fire({ icon: 'success', title: 'Supplier created!', timer: 1500, showConfirmButton: false });
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to save supplier', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const confirm = await Swal.fire({
            title: `Delete ${name}?`,
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        try {
            await api.delete(`/suppliers/${id}`);
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
            fetchData();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to delete supplier', 'error');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (s.mobile && s.mobile.includes(search)) ||
        (s.gstin && s.gstin.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow">
                        🏭
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Supplier Master</h1>
                        <p className="text-xs text-gray-500">Manage raw material suppliers (ROM, Granite Stone, Boulders)</p>
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary text-sm font-bold shadow-md">
                    + Add New Supplier
                </button>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="panel col-span-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by supplier name, contact person, phone or GSTIN..."
                            className="form-input pl-10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                </div>
                <div className="panel bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-between px-6">
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Total Suppliers</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{suppliers.length}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-semibold uppercase">Active</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {suppliers.filter(s => s.status === 'active').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Supplier List Table */}
            <div className="panel p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Supplier Name</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Contact Person</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Phone</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">GSTIN</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Materials</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Rate / Ton (₹)</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Opening Bal.</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Loading suppliers...
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        No suppliers found matching your query
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier, idx) => (
                                    <tr
                                        key={supplier._id}
                                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                            idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                            {supplier.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                            {supplier.contactPerson || '—'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                                            {supplier.mobile || '—'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                                            {supplier.gstin || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(supplier.materialSupplied || []).map((m: any, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                                        {typeof m === 'object' ? m.name : m}
                                                    </span>
                                                ))}
                                                {(!supplier.materialSupplied || supplier.materialSupplied.length === 0) && (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                            ₹{(supplier.defaultRatePerTon || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                                            ₹{(supplier.openingBalance || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    supplier.status === 'active'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                                }`}
                                            >
                                                {supplier.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(supplier)}
                                                    className="px-2.5 py-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded hover:bg-indigo-100 transition"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier._id, supplier.name)}
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
                    <div className="panel max-w-2xl w-full my-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Supplier Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Sri Lakshmi Minerals"
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={form.contactPerson}
                                        onChange={handleChange}
                                        placeholder="e.g. Ramesh Kumar"
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        placeholder="9876543210"
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        name="gstin"
                                        value={form.gstin}
                                        onChange={handleChange}
                                        placeholder="33AAAAA0000A1Z5"
                                        className="form-input uppercase"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">PAN Number</label>
                                    <input
                                        type="text"
                                        name="panNumber"
                                        value={form.panNumber}
                                        onChange={handleChange}
                                        placeholder="ABCDE1234F"
                                        className="form-input uppercase"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Quarry / Office Address"
                                        className="form-textarea"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Materials Supplied</label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        {products.length === 0 ? (
                                            <span className="text-xs text-gray-400">No products configured yet</span>
                                        ) : (
                                            products.map(p => {
                                                const checked = form.materialSupplied.includes(p._id);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={p._id}
                                                        onClick={() => handleMaterialToggle(p._id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                                            checked
                                                                ? 'bg-indigo-600 text-white shadow'
                                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {checked ? '✓ ' : ''}{p.name}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Agreed Rate Per Ton (₹/MT)
                                    </label>
                                    <input
                                        type="number"
                                        name="defaultRatePerTon"
                                        value={form.defaultRatePerTon}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        placeholder="e.g. 250"
                                        className="form-input text-indigo-600 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Opening Balance (₹)</label>
                                    <input
                                        type="number"
                                        name="openingBalance"
                                        value={form.openingBalance}
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

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                                    <input type="text" name="bankName" value={form.bankName} onChange={handleChange} className="form-input" placeholder="Bank Name" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                                    <input type="text" name="accountNumber" value={form.accountNumber} onChange={handleChange} className="form-input" placeholder="Account No." />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline-secondary flex-1 py-2.5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5 font-bold">
                                    {saving ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersPage;
