'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import api from '@/utils/api';

const SparePartsMaster = () => {
    const { showToast } = useToast();
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        cost: '',
        stockIn: 0,
    });

    const fetchParts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/spare-parts');
            if (res.data.success) {
                setParts(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ name: '', cost: '', stockIn: 0 });
        setEditId(null);
        setShowModal(false);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/spare-parts/${editId}`, formData);
                showToast('Spare Part updated!', 'success');
            } else {
                await api.post('/spare-parts', formData);
                showToast('Spare Part added!', 'success');
            }
            resetForm();
            fetchParts();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error saving data', 'error');
        }
    };

    const handleEdit = (part: any) => {
        setEditId(part._id);
        setFormData({
            name: part.name,
            cost: part.cost,
            stockIn: part.stockIn,
        });
        setShowModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/spare-parts/${deleteId}`);
            showToast('Spare Part deleted', 'success');
            fetchParts();
        } catch (error) {
            console.error(error);
            showToast('Error deleting part', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const filtered = parts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <input 
                    type="text" 
                    placeholder="Search Spare Parts..." 
                    className="form-input w-64"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <IconPlus className="ltr:mr-2 rtl:ml-2" />
                    Add Spare Part
                </button>
            </div>

            <div className="table-responsive">
                <table className="table-hover">
                    <thead>
                        <tr>
                            <th>Part Name</th>
                            <th>Cost (₹)</th>
                            <th className="text-center">Stock In</th>
                            <th className="text-center text-danger">Stock Out</th>
                            <th className="text-center text-success font-bold">Balance</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4">No parts found.</td></tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p._id}>
                                    <td className="font-bold text-primary">{p.name}</td>
                                    <td>₹{(p.cost || 0).toLocaleString()}</td>
                                    <td className="text-center">{p.stockIn}</td>
                                    <td className="text-center text-danger">{p.stockOut}</td>
                                    <td className="text-center font-bold text-success text-lg">
                                        <span className={p.currentStock <= 5 ? "text-danger" : ""}>
                                            {p.currentStock} {p.currentStock <= 5 && <span className="text-[10px] uppercase ml-1 animate-pulse">(Low)</span>}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="text-info" title="Edit" onClick={() => handleEdit(p)}>
                                                <IconEdit className="w-5 h-5" />
                                            </button>
                                            <button className="text-danger" title="Delete" onClick={() => setDeleteId(p._id)}>
                                                <IconTrash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white dark:bg-[#0e1726] rounded-lg w-full max-w-lg p-6 animate__animated animate__fadeInUp">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="text-lg font-bold">{editId ? 'Edit Spare Part' : 'Add Spare Part'}</h5>
                            <button className="text-white-dark" onClick={resetForm}><IconX /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="font-bold text-xs uppercase mb-1">Part Name *</label>
                                <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-xs uppercase mb-1">Cost / Price (₹) *</label>
                                    <input type="number" name="cost" className="form-input" min="0" step="0.01" required value={formData.cost} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="font-bold text-xs uppercase mb-1">Initial Stock In</label>
                                    <input type="number" name="stockIn" className="form-input border-success" min="0" value={formData.stockIn} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="button" className="btn btn-outline-danger mr-2" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal 
                show={!!deleteId} 
                onCancel={() => setDeleteId(null)} 
                onConfirm={confirmDelete} 
                title="Delete Spare Part" 
                message="Are you sure you want to completely remove this spare part? This action cannot be reversed." 
            />
        </div>
    );
};

export default SparePartsMaster;
