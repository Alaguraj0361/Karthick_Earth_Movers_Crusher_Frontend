'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Swal from 'sweetalert2';

interface Supplier {
    _id: string;
    name: string;
    mobile?: string;
    defaultRatePerTon?: number;
}

interface ProductType {
    _id: string;
    name: string;
    unit: string;
}

interface WeighmentSlip {
    _id: string;
    slipNumber: string;
    netWeight: number;
    slipDate: string;
    vehicleNumber: string;
}

interface PurchaseOrder {
    _id: string;
    poNumber: string;
    date: string;
    entryTime?: string;
    weighmentTime?: string;
    vehicleNumber?: string;
    supplierId?: Supplier;
    material?: ProductType;
    orderedQty: number;
    receivedQty: number;
    ratePerTon: number;
    totalAmount: number;
    amountPaid: number;
    balance: number;
    paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
    weighmentSlips?: WeighmentSlip[];
    status: 'Open' | 'Closed' | 'Cancelled';
    notes?: string;
}

const PurchasesPage = () => {
    const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPoId, setEditingPoId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        supplierId: '',
        material: '',
        orderedQty: 0,
        receivedQty: 0,
        ratePerTon: 0,
        amountPaid: 0,
        notes: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [poRes, suppRes, prodRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/suppliers?status=active'),
                api.get('/products?status=active&category=Input')
            ]);
            setPurchases(poRes.data.data || []);
            setSuppliers(suppRes.data.data || []);
            setProducts(prodRes.data.data || []);
        } catch (err) {
            console.error('Error fetching purchases data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingPoId(null);
        setForm({
            supplierId: '',
            material: '',
            orderedQty: 0,
            receivedQty: 0,
            ratePerTon: 0,
            amountPaid: 0,
            notes: '',
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (po: PurchaseOrder) => {
        setEditingPoId(po._id);
        setForm({
            supplierId: po.supplierId?._id || '',
            material: po.material?._id || '',
            orderedQty: po.orderedQty || 0,
            receivedQty: po.receivedQty || 0,
            ratePerTon: po.ratePerTon || 0,
            amountPaid: po.amountPaid || 0,
            notes: po.notes || '',
        });
        setShowModal(true);
    };

    const handleSavePO = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.supplierId) return Swal.fire('Error', 'Please select a supplier', 'error');
        if (!form.material) return Swal.fire('Error', 'Please select material', 'error');
        if (form.ratePerTon <= 0) return Swal.fire('Error', 'Rate per ton must be greater than 0', 'error');

        setSaving(true);
        try {
            if (editingPoId) {
                await api.put(`/purchases/${editingPoId}`, form);
                Swal.fire({ icon: 'success', title: 'Purchase Order Updated!', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/purchases', form);
                Swal.fire({ icon: 'success', title: 'Purchase Order Created!', timer: 1500, showConfirmButton: false });
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to save Purchase Order', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRecordPayment = async (po: PurchaseOrder) => {
        const { value: amount } = await Swal.fire({
            title: `Record Payment for ${po.poNumber}`,
            html: `
                <div style="text-align:left; font-size:14px; margin-bottom:8px">
                    <b>Total Amount:</b> ₹${po.totalAmount.toLocaleString('en-IN')}<br/>
                    <b>Paid:</b> ₹${po.amountPaid.toLocaleString('en-IN')}<br/>
                    <b style="color:red">Balance: ₹${po.balance.toLocaleString('en-IN')}</b>
                </div>
            `,
            input: 'number',
            inputLabel: 'Enter payment amount (₹)',
            inputPlaceholder: '0.00',
            showCancelButton: true,
            confirmButtonText: 'Record Payment',
        });

        if (!amount || parseFloat(amount) <= 0) return;

        try {
            await api.post(`/purchases/${po._id}/payment`, { amount: parseFloat(amount) });
            Swal.fire({ icon: 'success', title: 'Payment Recorded!', timer: 1500, showConfirmButton: false });
            fetchData();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to record payment', 'error');
        }
    };

    const handleDelete = async (id: string, poNumber: string) => {
        const confirm = await Swal.fire({
            title: `Delete ${poNumber}?`,
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        try {
            await api.delete(`/purchases/${id}`);
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
            fetchData();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to delete PO', 'error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl shadow">
                        🛒
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Raw Material Purchase Orders</h1>
                        <p className="text-xs text-gray-500">Buy ROM, Granite Stone &amp; Boulders from suppliers — linked with inward weighments</p>
                    </div>
                </div>
                <button onClick={handleOpenCreateModal} className="btn btn-primary text-sm font-bold shadow-md">
                    + New Purchase Order
                </button>
            </div>

            {/* Table */}
            <div className="panel p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">PO Number</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Supplier</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Material</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Rate / Ton</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Received (MT)</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Total (₹)</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Balance (₹)</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Payment</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-gray-400">
                                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Loading purchase orders...
                                    </td>
                                </tr>
                            ) : purchases.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-gray-400">
                                        No Purchase Orders found. Click "+ New Purchase Order" to create one.
                                    </td>
                                </tr>
                            ) : (
                                purchases.map((po, idx) => (
                                    <tr
                                        key={po._id}
                                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                            idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                            {po.poNumber}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                                            <div>{new Date(po.date).toLocaleDateString('en-IN')}</div>
                                            {po.entryTime && (
                                                <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded text-[10px]">
                                                    ⏱️ {po.entryTime}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {po.supplierId?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {po.material?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                                            ₹{(po.ratePerTon || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                                            {(po.receivedQty || 0).toFixed(3)} MT
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                            ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                                            ₹{(po.balance || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    po.paymentStatus === 'Paid'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                        : po.paymentStatus === 'Partial'
                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                                }`}
                                            >
                                                {po.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(po)}
                                                    className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded hover:bg-blue-100 transition"
                                                    title="Edit Purchase Order"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                {po.paymentStatus !== 'Paid' && (
                                                    <button
                                                        onClick={() => handleRecordPayment(po)}
                                                        className="px-2.5 py-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold rounded hover:bg-green-100 transition"
                                                    >
                                                        💳 Pay
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(po._id, po.poNumber)}
                                                    className="px-2.5 py-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded hover:bg-red-100 transition"
                                                >
                                                    🗑️
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

            {/* Create / Edit PO Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="panel max-w-md w-full my-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingPoId ? '✏️ Edit Purchase Order' : 'Create Purchase Order'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSavePO} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.supplierId}
                                    onChange={e => {
                                        const suppId = e.target.value;
                                        const supp = suppliers.find(s => s._id === suppId);
                                        setForm(f => ({
                                            ...f,
                                            supplierId: suppId,
                                            ratePerTon: supp?.defaultRatePerTon || f.ratePerTon || 0
                                        }));
                                    }}
                                    className="form-select font-bold"
                                    required
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} {s.defaultRatePerTon ? `(₹${s.defaultRatePerTon}/MT)` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Raw Material <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.material}
                                    onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                                    className="form-select font-bold"
                                    required
                                >
                                    <option value="">-- Select Material --</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.unit})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Rate Per Ton (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={form.ratePerTon || ''}
                                        onChange={e => setForm(f => ({ ...f, ratePerTon: parseFloat(e.target.value) || 0 }))}
                                        placeholder="Enter rate per ton"
                                        className="form-input font-bold"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Received Qty (MT)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.receivedQty || ''}
                                        onChange={e => setForm(f => ({ ...f, receivedQty: parseFloat(e.target.value) || 0 }))}
                                        placeholder="MT received"
                                        className="form-input font-bold"
                                        step="0.001"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Notes / Terms</label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    placeholder="Optional notes"
                                    className="form-textarea font-medium"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline-secondary flex-1 py-2.5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5 font-bold">
                                    {saving ? 'Saving...' : (editingPoId ? 'Update PO' : 'Create PO')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchasesPage;
