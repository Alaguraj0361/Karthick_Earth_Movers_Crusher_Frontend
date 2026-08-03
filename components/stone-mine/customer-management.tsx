'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconSearch from '@/components/icon/icon-search';
import IconSave from '@/components/icon/icon-save';
import IconX from '@/components/icon/icon-x';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import { useToast } from '@/components/stone-mine/toast-notification';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import api from '@/utils/api';
import Link from 'next/link';
import { canEditRecord } from '@/utils/permissions';



const CustomerManagement = () => {
    const { showToast } = useToast();
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';

    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        gstNumber: '',
        creditLimit: '',
        openingBalance: '',
        status: 'active',
    });

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/customers', { params: { search } });
            if (data.success) setCustomers(data.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (editId) {
                await api.put(`/customers/${editId}`, formData);
                showToast('Customer updated successfully!', 'success');
            } else {
                await api.post('/customers', formData);
                showToast('Customer added successfully!', 'success');
            }
            resetForm();
            fetchCustomers();
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Error saving customer';
            showToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (customer: any) => {
        setEditId(customer._id);
        setFormData({
            name: customer.name || '',
            phone: customer.phone || '',
            address: customer.address || '',
            gstNumber: customer.gstNumber || '',
            creditLimit: customer.creditLimit || '',
            openingBalance: customer.openingBalance || '',
            status: customer.status || 'active',
        });
        setShowModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/customers/${deleteId}`);
            showToast('Customer deleted successfully!', 'success');
            fetchCustomers();
        } catch (error) {
            console.error(error);
            showToast('Error deleting customer', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', address: '', gstNumber: '', creditLimit: '', openingBalance: '', status: 'active' });
        setEditId(null);
        setShowModal(false);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">
                        வாடிக்கையாளர் மேலாண்மை
                    </h2>
                    <p className="text-white-dark text-sm mt-1">Customer Management — Manage all customer details</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/sales-billing/sales-entry" className="btn btn-outline-success shadow-sm">
                        <span>📝</span> Go to Sales Entry
                    </Link>
                    <button className="btn btn-primary shadow-lg shadow-primary/30" onClick={() => { resetForm(); setShowModal(true); }}>
                        <IconPlus className="ltr:mr-2 rtl:ml-2" />
                        Add Customer
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="panel mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[250px]">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or GST number..."
                            className="form-input pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="badge bg-primary/10 text-primary text-sm px-4 py-2 rounded-lg font-bold">
                        Total: {customers.length} Customers
                    </span>
                </div>
            </div>

            {/* Customer List */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th className="!text-center">#</th>
                                <th>Customer Name</th>
                                <th>Mobile Number</th>
                                <th>Address</th>
                                <th>GST Number</th>
                                <th className="!text-center">Credit Limit</th>
                                <th className="!text-center">Opening Balance</th>
                                <th className="!text-center">Status</th>
                                <th className="!text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-8 text-white-dark">Loading...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-8 text-white-dark">No customers found</td></tr>
                            ) : (
                                customers.map((cust, idx) => (
                                    <tr key={cust._id}>
                                        <td className="!text-center">{idx + 1}</td>
                                        <td>
                                            <div className="font-bold text-primary">{cust.name}</div>
                                        </td>
                                        <td>{cust.phone || '—'}</td>
                                        <td className="max-w-[200px] truncate">{cust.address || '—'}</td>
                                        <td>
                                            {cust.gstNumber ? (
                                                <span className="badge bg-info/10 text-info">{cust.gstNumber}</span>
                                            ) : '—'}
                                        </td>
                                        <td className="!text-center font-bold">₹{Number(cust.creditLimit || 0).toLocaleString()}</td>
                                        <td className="!text-center font-bold">₹{Number(cust.openingBalance || 0).toLocaleString()}</td>
                                        <td className="!text-center">
                                            <span className={`badge ${cust.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                {cust.status}
                                            </span>
                                        </td>
                                        <td className="!text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canEditRecord(currentUser, cust.createdAt) ? (
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(cust)}>
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-white-dark italic">Locked</span>
                                                )}
                                                {isOwner && (
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(cust._id)}>
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="panel w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-4">
                            <h5 className="text-lg font-bold dark:text-white-light">
                                {editId ? 'Edit Customer' : 'Add New Customer'}
                            </h5>
                            <button className="btn btn-sm btn-outline-danger rounded-full" onClick={resetForm}>
                                <IconX className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Customer Name *</label>
                                <input type="text" name="name" className="form-input" placeholder="Enter customer name" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Mobile Number</label>
                                    <input type="text" name="phone" className="form-input" placeholder="Enter mobile number" value={formData.phone} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">GST Number</label>
                                    <input type="text" name="gstNumber" className="form-input" placeholder="Enter GST number" value={formData.gstNumber} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Address</label>
                                <textarea name="address" className="form-textarea" rows={2} placeholder="Enter address" value={formData.address} onChange={handleChange}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Credit Limit (₹)</label>
                                    <input type="number" name="creditLimit" className="form-input" placeholder="0" value={formData.creditLimit} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Opening Balance (₹)</label>
                                    <input type="number" name="openingBalance" className="form-input" placeholder="0" value={formData.openingBalance} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Status</label>
                                <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                                <button type="button" className="btn btn-outline-danger" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="btn btn-primary shadow-lg shadow-primary/20" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 ltr:mr-2 rtl:ml-2 inline-block align-middle"></span>
                                    ) : (
                                        <IconSave className="ltr:mr-2 rtl:ml-2" />
                                    )}
                                    {isSubmitting ? 'Saving...' : (editId ? 'Update Customer' : 'Save Customer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                show={!!deleteId}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

export default CustomerManagement;
