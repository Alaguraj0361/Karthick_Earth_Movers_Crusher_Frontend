'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';

const BlastingMaterialConfig = () => {
    const { showToast } = useToast();
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', ratePerTon: '' });

    const fetch = async () => {
        try {
            setLoading(true);
            const res = await api.get('/blasting/materials');
            if (res.data.success) setMaterials(res.data.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const reset = () => { setFormData({ name: '', ratePerTon: '' }); setEditId(null); setShowModal(false); };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/blasting/materials/${editId}`, formData);
                showToast('Material updated!', 'success');
            } else {
                await api.post('/blasting/materials', formData);
                showToast('Material added!', 'success');
            }
            reset(); fetch();
        } catch (err: any) { showToast(err.response?.data?.message || 'Error', 'error'); }
    };

    const handleEdit = (m: any) => { setEditId(m._id); setFormData({ name: m.name, ratePerTon: m.ratePerTon }); setShowModal(true); };

    const confirmDelete = async () => {
        try { await api.delete(`/blasting/materials/${deleteId}`); showToast('Deleted', 'success'); fetch(); }
        catch (e) { showToast('Error deleting', 'error'); } finally { setDeleteId(null); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h6 className="font-bold text-sm uppercase text-primary">🪨 Blasting Materials Config</h6>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                    <IconPlus className="ltr:mr-1" /> Add Material
                </button>
            </div>

            <div className="table-responsive">
                <table className="table-hover">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Material Name</th>
                            <th className="text-right">Rate per Ton (₹)</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-6">Loading...</td></tr>
                        ) : materials.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-6 text-white-dark">No materials configured. Add Kadal Kal and Vellakal to get started.</td></tr>
                        ) : materials.map((m, i) => (
                            <tr key={m._id}>
                                <td className="text-white-dark">{i + 1}</td>
                                <td className="font-bold text-primary">{m.name}</td>
                                <td className="text-right font-bold text-lg text-success">₹{m.ratePerTon}</td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button className="text-info" title="Edit" onClick={() => handleEdit(m)}><IconEdit className="w-5 h-5" /></button>
                                        <button className="text-danger" title="Delete" onClick={() => setDeleteId(m._id)}><IconTrash className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Quick-seed defaults helper */}
            {materials.length === 0 && !loading && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                    <p className="text-primary font-bold mb-2">💡 Quick Setup</p>
                    <p className="text-white-dark mb-3">Add the two default materials to get started:</p>
                    <div className="flex gap-2">
                        {[{ name: 'Kadal Kal', ratePerTon: 50 }, { name: 'Vellakal', ratePerTon: 40 }].map(d => (
                            <button key={d.name} className="btn btn-outline-primary btn-sm" onClick={async () => {
                                await api.post('/blasting/materials', d);
                                showToast(`${d.name} added!`, 'success'); fetch();
                            }}>{d.name} (₹{d.ratePerTon}/ton)</button>
                        ))}
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white dark:bg-[#0e1726] rounded-lg w-full max-w-md p-6 animate__animated animate__fadeInUp">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="text-lg font-bold">{editId ? 'Edit Material' : 'Add Material'}</h5>
                            <button className="text-white-dark" onClick={reset}><IconX /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="font-bold text-xs uppercase mb-1 block">Material Name *</label>
                                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kadal Kal" />
                            </div>
                            <div>
                                <label className="font-bold text-xs uppercase mb-1 block">Rate per Ton (₹) *</label>
                                <input type="number" className="form-input" required min="0" step="0.01" value={formData.ratePerTon} onChange={e => setFormData(p => ({ ...p, ratePerTon: e.target.value }))} placeholder="e.g. 50" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" className="btn btn-outline-danger" onClick={reset}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal show={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete Material" message="Are you sure you want to delete this blasting material?" />
        </div>
    );
};

export default BlastingMaterialConfig;
