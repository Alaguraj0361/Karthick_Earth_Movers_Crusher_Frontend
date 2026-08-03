'use client';
import React, { useState, useEffect, useRef } from 'react';
import api, { getFileUrl } from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';

const BlastingExplosiveShop = ({ blastingId, blastingLabel, recordDates }: { blastingId?: string; blastingLabel?: string; recordDates?: { fromDate: string; toDate: string } }) => {
    const { showToast } = useToast();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [billPreview, setBillPreview] = useState<string>('');
    const fileRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({ shopName: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '', billUrl: '' });

    const fetchPayments = async () => {
        try {
            setLoading(true);
            let params = blastingId ? `?blastingId=${blastingId}` : '';
            if (blastingId && recordDates) params += `&fromDate=${recordDates.fromDate}&toDate=${recordDates.toDate}`;
            const res = await api.get(`/blasting/explosive-payments${params}`);
            if (res.data.success) setPayments(res.data.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, [blastingId]);

    const reset = () => { 
        setFormData({ shopName: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '', billUrl: '' }); 
        setBillPreview('');
        if (fileRef.current) fileRef.current.value = '';
        setEditId(null); 
        setShowForm(false); 
    };

    const handleFileChange = async (e: any) => {
        let file = e.target.files[0];
        if (!file) return;
        setUploading(true);

        try {
            // Convert .jfif to .jpg
            if (file.type === 'image/jfif' || file.name.toLowerCase().endsWith('.jfif')) {
                file = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const newFile = new File([blob], file.name.replace(/\.jfif$/i, '.jpg'), { type: 'image/jpeg' });
                                resolve(newFile);
                            } else {
                                resolve(file); // fallback
                            }
                        }, 'image/jpeg', 0.9);
                    };
                    img.onerror = () => resolve(file); // fallback
                    img.src = URL.createObjectURL(file);
                });
            }

            const fd = new FormData();
            fd.append('bill', file);
            const res = await api.post('/upload', fd);
            if (res.data.success) {
                setFormData(p => ({ ...p, billUrl: res.data.filePath }));
                setBillPreview(res.data.filePath);
                showToast('Bill uploaded!', 'success');
            }
        } catch (err) { showToast('Upload failed', 'error'); }
        finally { setUploading(false); }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = { ...formData, blastingId };
            if (editId) {
                await api.put(`/blasting/explosive-payments/${editId}`, payload);
                showToast('Payment updated!', 'success');
            } else {
                await api.post('/blasting/explosive-payments', payload);
                showToast('Payment recorded!', 'success');
            }
            reset(); fetchPayments();
        } catch (err: any) { showToast(err.response?.data?.message || 'Error', 'error'); }
    };

    const handleEdit = (p: any) => {
        setEditId(p._id);
        setFormData({ shopName: p.shopName, amount: p.amount, date: new Date(p.date).toISOString().split('T')[0], notes: p.notes || '', billUrl: p.billUrl || '' });
        setBillPreview(p.billUrl || '');
        setShowForm(true);
    };

    const confirmDelete = async () => {
        try { await api.delete(`/blasting/explosive-payments/${deleteId}`); showToast('Deleted', 'success'); fetchPayments(); }
        catch (e) { showToast('Error deleting', 'error'); } finally { setDeleteId(null); }
    };

    const total = payments.reduce((s, p) => s + p.amount, 0);

    return (
        <div className="space-y-4">
            {showForm && (
                <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h6 className="font-bold text-danger text-sm">{editId ? 'Edit Payment' : 'New Shop Payment'}</h6>
                        <button onClick={reset}><IconX className="w-4 h-4 text-white-dark" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Shop Name *</label>
                            <input type="text" className="form-input" required value={formData.shopName} onChange={e => setFormData(p => ({ ...p, shopName: e.target.value }))} placeholder="Enter Shop Name" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Amount (₹) *</label>
                            <input type="number" className="form-input" required min="0" step="0.01" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Date *</label>
                            <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Notes</label>
                            <input type="text" className="form-input" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Optional remarks" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold uppercase mb-1 block">Bill / Receipt (Image or PDF)</label>
                            <div className="flex items-center gap-3">
                                <label className={`cursor-pointer flex items-center gap-2 border-2 border-dashed border-danger/30 rounded-lg px-4 py-2 hover:border-danger/60 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-danger"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span className="text-sm text-danger">{uploading ? 'Uploading...' : 'Upload Bill'}</span>
                                    <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.jfif" onChange={handleFileChange} />
                                </label>
                                 {billPreview && (
                                    <div className="flex items-center gap-2">
                                        {billPreview.match(/\.(jpg|jpeg|png|jfif)$/i) ? (
                                            <img src={getFileUrl(billPreview)} alt="bill" className="h-12 w-12 object-cover rounded border border-success/30" />
                                        ) : (
                                            <a href={getFileUrl(billPreview)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-success text-sm border border-success/30 rounded px-3 py-1 hover:bg-success/10">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> View PDF
                                            </a>
                                        )}
                                        <button type="button" className="text-danger text-xs" onClick={() => { setFormData(p => ({ ...p, billUrl: '' })); setBillPreview(''); if (fileRef.current) fileRef.current.value = ''; }}>✕ Remove</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={reset}>Cancel</button>
                            <button type="submit" className="btn btn-danger btn-sm" disabled={uploading}>{editId ? 'Update' : 'Save Payment'}</button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h6 className="font-bold text-sm uppercase text-danger">🏪 Explosive Shop Payments</h6>
                            {blastingLabel && <p className="text-xs text-white-dark mt-0.5">For: {blastingLabel}</p>}
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => setShowForm(true)}>
                            <IconPlus className="ltr:mr-1" /> Add Payment
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Shop Name</th>
                                    <th className="text-right">Amount (₹)</th>
                                    <th>Notes</th>
                                    <th className="text-center">Bill</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                                ) : payments.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-4 text-white-dark">No shop payments recorded.</td></tr>
                                ) : payments.map(p => (
                                    <tr key={p._id}>
                                        <td>{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="font-bold text-primary">{p.shopName}</td>
                                        <td className="text-right font-bold text-danger text-lg">₹{p.amount.toLocaleString()}</td>
                                        <td className="text-white-dark text-sm">{p.notes || '—'}</td>
                                         <td className="text-center">
                                            {p.billUrl ? (
                                                <a href={getFileUrl(p.billUrl)} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-success border border-success/30 rounded px-2 py-1 hover:bg-success/10">
                                                    {p.billUrl.match(/\.(jpg|jpeg|png|jfif)$/i) ? (
                                                        <img src={getFileUrl(p.billUrl)} alt="bill" className="h-7 w-7 object-cover rounded" />
                                                    ) : (
                                                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</>
                                                    )}
                                                </a>
                                            ) : <span className="text-xs text-white-dark">—</span>}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="text-info" onClick={() => handleEdit(p)}><IconEdit className="w-5 h-5" /></button>
                                                <button className="text-danger" onClick={() => setDeleteId(p._id)}><IconTrash className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {payments.length > 0 && (
                                    <tr className="bg-danger/10 font-bold">
                                        <td colSpan={2}>TOTAL SHOP PAYMENTS</td>
                                        <td className="text-right text-danger text-xl">₹{total.toLocaleString()}</td>
                                        <td colSpan={3}></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}



            <DeleteConfirmModal show={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete Payment" message="Remove this explosive shop payment from the record?" />
        </div>
    );
};

export default BlastingExplosiveShop;
