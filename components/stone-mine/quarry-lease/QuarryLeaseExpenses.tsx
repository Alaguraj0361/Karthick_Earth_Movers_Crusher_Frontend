'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconEye from '@/components/icon/icon-eye';
import IconX from '@/components/icon/icon-x';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import api, { getFileUrl } from '@/utils/api';

const AMOUNT_TYPES = ['Cash', 'Bank Transfer', 'UPI'];

const defaultForm = {
    date: new Date().toISOString().split('T')[0],
    expenseType: '',
    amountType: 'Bank Transfer',
    amount: '',
    notes: '',
    billUrl: ''
};

const QuarryLeaseExpenses = () => {
    const { showToast } = useToast();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>(defaultForm);
    const [isUploading, setIsUploading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/quarry-lease/expenses', { params: { startDate, endDate } });
            if (res.data.success) setExpenses(res.data.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load expense data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [startDate, endDate]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const convertJfifToJpg = async (file: File): Promise<File> => {
        if (!file.name.toLowerCase().endsWith('.jfif')) return file;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const convertedFile = new File([blob], file.name.replace(/\.jfif$/i, '.jpg'), { type: 'image/jpeg' });
                                resolve(convertedFile);
                            } else {
                                reject(new Error('Canvas toBlob failed'));
                            }
                        },
                        'image/jpeg',
                        0.9
                    );
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileChange = async (e: any) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];
            setIsUploading(true);
            try {
                if (file.name.toLowerCase().endsWith('.jfif')) {
                    showToast('Converting JFIF to JPG...', 'info');
                    file = await convertJfifToJpg(file);
                }
                const uploadData = new FormData();
                uploadData.append('bill', file);
                const { data } = await api.post('/upload', uploadData);
                if (data.filePath) {
                    setFormData((prev: any) => ({ ...prev, billUrl: data.filePath }));
                    showToast('Bill uploaded successfully', 'success');
                }
            } catch (err) {
                showToast('Upload failed', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const resetForm = () => {
        setFormData(defaultForm);
        setEditId(null);
        setShowForm(false);
    };

    const handleEdit = (record: any) => {
        setFormData({
            date: record.date.split('T')[0],
            expenseType: record.expenseType,
            amountType: record.amountType,
            amount: record.amount,
            notes: record.notes || '',
            billUrl: record.billUrl || ''
        });
        setEditId(record._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/quarry-lease/expenses/${editId}`, formData);
                showToast('Expense updated!', 'success');
            } else {
                await api.post('/quarry-lease/expenses', formData);
                showToast('Expense recorded!', 'success');
            }
            resetForm();
            fetchData();
        } catch (error) {
            showToast('Failed to save record', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/quarry-lease/expenses/${deleteId}`);
            showToast('Record deleted!', 'success');
            setDeleteId(null);
            fetchData();
        } catch { 
            showToast('Failed to delete record', 'error'); 
        }
    };

    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#e79b21] uppercase tracking-tight">💎 Quarry Lease Expenses</h1>
                    <p className="text-xs text-white-dark mt-0.5 uppercase font-bold tracking-widest">Track all expenses related to quarry lease & maintenance</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditId(null); setFormData(defaultForm); }}
                        className="btn btn-primary gap-2 rounded-xl font-bold bg-[#e79b21] border-none shadow-lg hover:bg-[#d68a1d]"
                    >
                        <IconPlus className="w-4 h-4" /> Add New Expense
                    </button>
                )}
            </div>

            {!showForm && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="panel rounded-3xl border-none shadow-xl bg-gradient-to-br from-[#e79b21]/10 to-white">
                            <div className="text-[10px] font-black text-[#e79b21] uppercase tracking-widest mb-1">Total Expenses</div>
                            <div className="text-3xl font-black text-slate-800">₹{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="panel rounded-3xl border-none shadow-xl bg-white col-span-2">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-1 block">From Date</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input text-xs font-bold rounded-xl" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-1 block">To Date</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input text-xs font-bold rounded-xl" />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={fetchData} className="btn btn-outline-primary w-full h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest">Refresh Logs</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="panel rounded-3xl shadow-xl border-none overflow-hidden">
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[10px] uppercase font-black text-slate-400">
                                        <th className="py-4">Date</th>
                                        <th className="py-4">Expense Type</th>
                                        <th className="py-4">Payment Method</th>
                                        <th className="py-4">Notes</th>
                                        <th className="py-4 text-right">Amount</th>
                                        <th className="py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-20 uppercase font-black text-[11px] opacity-30 italic">Loading ledger...</td></tr>
                                    ) : expenses.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-20 uppercase font-black text-[11px] opacity-30 italic">No expenses recorded for this period</td></tr>
                                    ) : (
                                        expenses.map((e) => (
                                            <tr key={e._id} className="group">
                                                <td className="font-bold text-xs">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                                                <td><span className="badge badge-outline-primary text-[10px] font-black uppercase tracking-widest">{e.expenseType}</span></td>
                                                <td className="text-xs font-semibold">{e.amountType}</td>
                                                <td className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{e.notes || '-'}</td>
                                                <td className="text-right font-black text-slate-800">₹{e.amount.toLocaleString()}</td>
                                                <td>
                                                    <div className="flex justify-center gap-2">
                                                        {e.billUrl && (
                                                            <a 
                                                                href={getFileUrl(e.billUrl)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-info hover:bg-info/10 rounded-full"
                                                                title="View Bill"
                                                            >
                                                                <IconEye className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <button onClick={() => handleEdit(e)} className="p-2 text-primary hover:bg-primary/10 rounded-full"><IconEdit className="w-4 h-4" /></button>
                                                        <button onClick={() => setDeleteId(e._id)} className="p-2 text-danger hover:bg-danger/10 rounded-full"><IconTrash className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {showForm && (
                <div className="panel rounded-3xl shadow-2xl border-none max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b">
                        <h5 className="font-black text-xs uppercase text-[#e79b21] tracking-widest flex items-center gap-2">
                            <span className="w-10 h-1 bg-[#e79b21] rounded-full"></span>
                            {editId ? 'Modify Expense Entry' : 'New Quarry Expense Entry'}
                        </h5>
                        <button onClick={resetForm} className="text-slate-300 hover:text-danger"><IconX className="w-6 h-6" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Date of Expense</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input font-bold rounded-xl h-12 border-2" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Expense Category</label>
                                <input 
                                    type="text" 
                                    name="expenseType" 
                                    value={formData.expenseType} 
                                    onChange={handleChange} 
                                    className="form-input font-bold rounded-xl h-12 border-2" 
                                    placeholder="e.g., Monthly Rent, Electricity..." 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Payment Through</label>
                                <select name="amountType" value={formData.amountType} onChange={handleChange} className="form-select font-bold rounded-xl h-12 border-2" required>
                                    {AMOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[#e79b21] uppercase tracking-widest mb-2 block">Payable Amount (₹)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input font-black rounded-xl h-12 border-2 border-[#e79b21]/30 text-lg" placeholder="0.00" required />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Reference Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-textarea font-bold rounded-xl border-2" rows={3} placeholder="Add any details or reference numbers..."></textarea>
                        </div>

                        <div className="flex bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 items-center justify-between">
                            <div>
                                <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Upload Receipt (Optional)</div>
                                <div className="text-[9px] font-bold text-slate-300">JPG, PNG or PDF (Max 5MB)</div>
                            </div>
                            <label className="btn btn-primary rounded-xl font-black uppercase text-[10px] tracking-widest mb-0 cursor-pointer">
                                <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                {isUploading ? 'Uploading...' : formData.billUrl ? 'Change File' : 'Browse File'}
                            </label>
                        </div>

                        <div className="flex gap-4 pt-4 border-t">
                            <button type="button" onClick={resetForm} className="btn btn-outline-danger flex-1 rounded-xl font-bold uppercase py-4">Discard</button>
                            <button type="submit" className="btn btn-primary flex-1 rounded-xl font-black uppercase py-4 bg-[#e79b21] border-none shadow-xl tracking-widest">
                                {editId ? 'Update Ledger' : 'Confirm Expense'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <DeleteConfirmModal 
                show={!!deleteId} 
                onCancel={() => setDeleteId(null)} 
                onConfirm={handleDelete} 
                title="Delete Quarry Expense" 
                message="Are you sure you want to remove this expense from the quarry ledger? This cannot be undone." 
            />
        </div>
    );
};

export default QuarryLeaseExpenses;
