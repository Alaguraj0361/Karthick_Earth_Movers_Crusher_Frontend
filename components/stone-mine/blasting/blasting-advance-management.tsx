'use client';
import React, { useState, useEffect, useRef } from 'react';
import api, { getFileUrl } from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import IconPlus from '@/components/icon/icon-plus';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';

const BlastingAdvanceManagement = ({ blastingId, blastingLabel, recordDates }: { blastingId?: string; blastingLabel?: string; recordDates?: { fromDate: string; toDate: string } }) => {
    const { showToast } = useToast();
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [billPreview, setBillPreview] = useState<string>('');
    const fileRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', blastingId: blastingId || '', billUrl: '' });

    const fetchAdvances = async () => {
        try {
            setLoading(true);
            let params = blastingId ? `?blastingId=${blastingId}` : '';
            if (blastingId && recordDates) params += `&fromDate=${recordDates.fromDate}&toDate=${recordDates.toDate}`;
            const res = await api.get(`/blasting/advances${params}`);
            if (res.data.success) setAdvances(res.data.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAdvances(); }, [blastingId]);

    const reset = () => {
        setFormData({ amount: '', date: new Date().toISOString().split('T')[0], notes: '', blastingId: blastingId || '', billUrl: '' });
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
            const data = { ...formData, blastingId: blastingId || formData.blastingId };
            if (editId) {
                await api.put(`/blasting/advances/${editId}`, data);
                showToast('Advance updated!', 'success');
            } else {
                await api.post('/blasting/advances', data);
                showToast('Advance added!', 'success');
            }
            reset(); fetchAdvances();
        } catch (err: any) { showToast(err.response?.data?.message || 'Error', 'error'); }
    };

    const confirmDelete = async () => {
        try { await api.delete(`/blasting/advances/${deleteId}`); showToast('Deleted', 'success'); fetchAdvances(); }
        catch (e) { showToast('Error deleting', 'error'); } finally { setDeleteId(null); }
    };

    const total = advances.reduce((s, a) => s + a.amount, 0);

    return (
        <div className="space-y-4">
            {showForm && (
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h6 className="font-bold text-warning text-sm">{editId ? 'Edit Advance' : 'New Advance Entry'}</h6>
                        <button onClick={reset}><IconX className="w-4 h-4 text-white-dark" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                <input type="text" className="form-input" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                            </div>
                        </div>

                        <div className="panel bg-white/50 dark:bg-black/20">
                            <label className="text-xs font-bold uppercase mb-2 block text-warning">Bill / Voucher Upload (Optional)</label>
                            <div className="flex items-center gap-3">
                                <label className={`cursor-pointer flex items-center gap-2 border-2 border-dashed border-warning/30 rounded-lg px-4 py-2 hover:border-warning/60 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span className="text-sm text-warning font-semibold">{uploading ? 'Uploading...' : 'Upload Receipt'}</span>
                                    <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.jfif" onChange={handleFileChange} />
                                </label>
                                {billPreview && (
                                    <div className="flex items-center gap-2">
                                        {billPreview.match(/\.(jpg|jpeg|png|jfif)$/i) ? (
                                            <img src={getFileUrl(billPreview)} alt="bill" className="h-10 w-10 object-cover rounded border border-success/30" />
                                        ) : (
                                            <div className="text-success text-xs font-bold bg-success/10 px-2 py-1 rounded">PDF</div>
                                        )}
                                        <button type="button" className="text-danger text-xs hover:underline" onClick={() => { setFormData(p => ({ ...p, billUrl: '' })); setBillPreview(''); if (fileRef.current) fileRef.current.value = ''; }}>✕ Remove</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-warning/10">
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={reset}>Cancel</button>
                            <button type="submit" className="btn btn-warning btn-sm">{editId ? 'Update' : 'Save Advance'}</button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h6 className="font-bold text-sm uppercase text-warning">💰 Advance Payments</h6>
                            {blastingLabel && <p className="text-xs text-white-dark mt-0.5">For: {blastingLabel}</p>}
                        </div>
                        <button className="btn btn-warning btn-sm" onClick={() => setShowForm(true)}>
                            <IconPlus className="ltr:mr-1" /> Add Advance
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th className="text-right">Amount (₹)</th>
                                    <th>Notes</th>
                                    <th className="text-center">Receipt</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                                ) : advances.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-4 text-white-dark">No advances recorded.</td></tr>
                                ) : advances.map(a => (
                                    <tr key={a._id}>
                                        <td>{new Date(a.date).toLocaleDateString()}</td>
                                        <td className="text-right font-bold text-warning text-lg">₹{a.amount.toLocaleString()}</td>
                                        <td className="text-white-dark text-sm">{a.notes || '—'}</td>
                                        <td className="text-center">
                                            {a.billUrl ? (
                                                <a href={getFileUrl(a.billUrl)} target="_blank" rel="noopener noreferrer" className="text-warning hover:scale-110 transition-all inline-block p-1 bg-warning/10 rounded">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                </a>
                                            ) : (
                                                <span className="text-white-dark/30">—</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="text-danger" onClick={() => setDeleteId(a._id)}><IconTrash className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {advances.length > 0 && (
                                    <tr className="bg-warning/10 font-bold">
                                        <td>TOTAL ADVANCE</td>
                                        <td className="text-right text-warning text-xl">₹{total.toLocaleString()}</td>
                                        <td colSpan={3}></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <DeleteConfirmModal show={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete Advance" message="Are you sure you want to delete this advance entry?" />
        </div>
    );
};

export default BlastingAdvanceManagement;
