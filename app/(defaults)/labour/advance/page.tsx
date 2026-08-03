'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconSave from '@/components/icon/icon-save';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import RoleGuard from '@/components/stone-mine/role-guard';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';

const AdvancePage = () => {
    const [labours, setLabours] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        labour: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMode: 'Cash',
        remarks: ''
    });
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<any>(null);



    const fetchData = async () => {
        setLoading(true);
        try {
            const [labourRes, advanceRes] = await Promise.all([
                api.get('/labour'),
                api.get('/labour/advance')
            ]);
            if (labourRes.data.success) setLabours(labourRes.data.data);
            if (advanceRes.data.success) setAdvances(advanceRes.data.data);
        } catch (error) {
            console.error(error);
            showToast('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        if (name === 'labourType') {
            setFormData({ ...formData, [name]: value, labour: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            let response;
            if (editItem) {
                response = await api.put(`/labour/advance/${editItem._id}`, formData);
            } else {
                response = await api.post('/labour/advance', formData);
            }

            if (response.data.success) {
                showToast(editItem ? 'Advance payment updated successfully' : 'Advance payment recorded successfully', 'success');
                setFormData({
                    labour: '',
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    paymentMode: 'Cash',
                    remarks: ''
                });
                setEditItem(null);
                fetchData();
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error recording advance', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditItem(item);
        setFormData({
            labour: item.labour?._id || '',
            date: new Date(item.date).toISOString().split('T')[0],
            amount: item.amount.toString(),
            paymentMode: item.paymentMode,
            remarks: item.remarks || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const { data } = await api.delete(`/labour/advance/${deleteId}`);
            if (data.success) {
                showToast('Record deleted successfully', 'success');
                fetchData();
            }
        } catch (error) {
            console.error(error);
            showToast('Error deleting record', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <div>
                <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                    <li><a href="/" className="text-primary hover:underline font-bold">Dashboard</a></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Labour</span></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Advance Payment Tracking</span></li>
                </ul>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="panel shadow-lg rounded-2xl border-none">
                            <h5 className="text-lg font-black mb-5 border-b pb-3 uppercase text-primary tracking-tight">
                                {editItem ? 'Edit Advance Payment' : 'Record Advance (முன்பணம்)'}
                            </h5>
                            <form onSubmit={handleSave} className="space-y-4">
                                {editItem && (
                                    <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl mb-4">
                                        <span className="text-[10px] font-black uppercase text-primary">Editing Mode</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditItem(null);
                                                 setFormData({ labour: '', date: new Date().toISOString().split('T')[0], amount: '', paymentMode: 'Cash', remarks: '' });
                                            }}
                                            className="text-[10px] font-black uppercase text-danger hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Select Labour (தொழிலாளர்)</label>
                                    <select name="labour" className="form-select font-bold rounded-xl" value={formData.labour} onChange={handleChange} required>
                                        <option value="">Select Worker</option>
                                        {labours.map(l => (
                                            <option key={l._id} value={l._id}>{l.name} ({l.workType})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Date (தேதி)</label>
                                    <input type="date" name="date" className="form-input text-primary font-bold rounded-xl" value={formData.date} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Amount (தொகை)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black">₹</span>
                                        <input type="number" name="amount" className="form-input pl-8 font-black text-lg border-primary rounded-xl" value={formData.amount} onChange={handleChange} required placeholder="0" min="1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Payment Mode</label>
                                    <select name="paymentMode" className="form-select font-bold rounded-xl" value={formData.paymentMode} onChange={handleChange}>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI / G-Pay</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Remarks (குறிப்புகள்)</label>
                                    <textarea name="remarks" className="form-textarea font-bold rounded-xl" value={formData.remarks} onChange={handleChange} placeholder="Optional..."></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary w-full shadow-[0_10px_20px_rgba(67,97,238,0.3)] h-11 rounded-xl font-black uppercase tracking-widest text-xs" disabled={saving}>
                                    <IconSave className="mr-2 w-4 h-4" />
                                    {saving ? 'Saving...' : editItem ? 'Update Payment' : 'Record Payment'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="lg:col-span-2">
                        <div className="panel shadow-lg rounded-2xl border-none">
                            <h5 className="text-lg font-black mb-5 border-b pb-3 uppercase tracking-tight">Recent Advance History</h5>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr className="!bg-primary/5">
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Date</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Labour Name</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Amount</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Mode</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Remarks</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold">
                                        {loading ? (
                                            <tr><td colSpan={5} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-xs uppercase tracking-[0.2em] text-primary">Synchronizing...</span>
                                                </div>
                                            </td></tr>
                                        ) : advances.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-20 text-white-dark uppercase font-black tracking-widest text-sm opacity-20">No records found.</td></tr>
                                        ) : (
                                            advances.map((adv) => (
                                                <tr key={adv._id} className="group hover:bg-primary/5 transition-all">
                                                    <td className="py-4 font-bold">{new Date(adv.date).toLocaleDateString()}</td>
                                                    <td className="py-4 font-black text-black dark:text-white-light">{adv.labour?.name}</td>
                                                    <td className="py-4 text-danger font-black text-lg">₹{adv.amount.toLocaleString()}</td>
                                                    <td className="py-4"><span className="badge badge-outline-info rounded-lg font-black text-[10px] uppercase tracking-widest">{adv.paymentMode}</span></td>
                                                    <td className="py-4 text-xs pt-1 italic opacity-70">{adv.remarks || '-'}</td>
                                                    <td className="py-4">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(adv)}
                                                                className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all"
                                                                title="Edit"
                                                            >
                                                                <IconEdit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteId(adv._id)}
                                                                className="p-2 rounded-xl text-danger hover:bg-danger/10 transition-all "
                                                                title="Delete"
                                                            >
                                                                <IconTrashLines className="w-4 h-4" />
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
                    </div>
                </div>
            </div>
            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Advance Payment Record"
                message="Are you sure you want to delete this advance payment record? This action cannot be undone."
            />
        </RoleGuard>
    );
};

export default AdvancePage;
