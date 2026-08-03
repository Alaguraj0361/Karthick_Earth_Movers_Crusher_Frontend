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
import Link from 'next/link';

const VendorAdvancePage = () => {
    const [allVendors, setAllVendors] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        vendorSelected: '', // "id|type|name"
        date: new Date().toISOString().split('T')[0],
        paidAmount: '',
        paymentMode: 'Cash',
        referenceNumber: '',
        notes: ''
    });

    const [editItem, setEditItem] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, expRes, transRes] = await Promise.all([
                api.get('/vendors/payments'),
                api.get('/vendors/explosive'),
                api.get('/vendors/transport')
            ]);

            // Filter only advances
            if (payRes.data.success) {
                setAdvances(payRes.data.data.filter((p: any) => p.paymentType === 'Advance'));
            }

            const vendors: any[] = [];
            if (expRes.data.success) vendors.push(...expRes.data.data.map((v: any) => ({ ...v, type: 'ExplosiveSupplier', label: `[Explosive] ${v.name}` })));
            if (transRes.data.success) vendors.push(...transRes.data.data.map((v: any) => ({
                ...v,
                type: 'TransportVendor',
                label: `${v.companyName ? `${v.companyName} - ` : ''}${v.name} (${v.vehicles?.length || 0} Vehicles)`
            })));
            setAllVendors(vendors);

        } catch (error) {
            console.error(error);
            showToast('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const [vId, vType, vName] = formData.vendorSelected.split('|');
            const payload = {
                vendorId: vId,
                vendorType: vType,
                vendorName: vName,
                paymentType: 'Advance',
                invoiceAmount: 0,
                paidAmount: Number(formData.paidAmount),
                paymentMode: formData.paymentMode,
                referenceNumber: formData.referenceNumber,
                notes: formData.notes,
                date: formData.date
            };

            let response;
            if (editItem) {
                response = await api.put(`/vendors/payments/${editItem._id}`, payload); // We might need to add PUT route for payments
            } else {
                response = await api.post('/vendors/payments', payload);
            }

            if (response.data.success) {
                showToast(editItem ? 'Advance payment updated' : 'Advance recorded successfully', 'success');
                resetForm();
                fetchData();
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error recording advance', 'error');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            vendorSelected: '',
            date: new Date().toISOString().split('T')[0],
            paidAmount: '',
            paymentMode: 'Cash',
            referenceNumber: '',
            notes: ''
        });
        setEditItem(null);
    };

    const handleEdit = (item: any) => {
        setEditItem(item);
        setFormData({
            vendorSelected: `${item.vendorId}|${item.vendorType}|${item.vendorName}`,
            date: new Date(item.date).toISOString().split('T')[0],
            paidAmount: item.paidAmount.toString(),
            paymentMode: item.paymentMode,
            referenceNumber: item.referenceNumber || '',
            notes: item.notes || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/vendors/payments/${deleteId}`);
            showToast('Advance record deleted', 'success');
            fetchData();
        } catch (error) {
            showToast('Error deleting record', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <div>
                <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                    <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Vendors</span></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Advance Tracking</span></li>
                </ul>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="panel shadow-lg rounded-2xl border-none">
                            <h5 className="text-lg font-black mb-5 border-b pb-3 uppercase text-primary tracking-tight">
                                {editItem ? 'Edit Advance Payment' : 'Record Vendor Advance (முன்பணம்)'}
                            </h5>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Select Vendor / Contractor</label>
                                    <select name="vendorSelected" className="form-select font-bold rounded-xl" value={formData.vendorSelected} onChange={handleChange} required>
                                        <option value="">Select Vendor...</option>
                                        {allVendors.map(v => (
                                            <option key={`${v._id}|${v.type}`} value={`${v._id}|${v.type}|${v.type === 'TransportVendor' && v.companyName ? `${v.companyName} - ${v.name}` : v.name}`}>
                                                {v.label}
                                            </option>
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
                                        <input type="number" name="paidAmount" className="form-input pl-8 font-black text-lg border-primary rounded-xl" value={formData.paidAmount} onChange={handleChange} required placeholder="0" min="1" />
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
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Reference #</label>
                                    <input type="text" name="referenceNumber" className="form-input font-bold rounded-xl" value={formData.referenceNumber} onChange={handleChange} placeholder="Optional #..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white-dark mb-1 block">Notes (குறிப்புகள்)</label>
                                    <textarea name="notes" className="form-textarea font-bold rounded-xl" value={formData.notes} onChange={handleChange} placeholder="Reason for advance..."></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary w-full shadow-[0_10px_20px_rgba(67,97,238,0.3)] h-11 rounded-xl font-black uppercase tracking-widest text-xs" disabled={saving}>
                                    <IconSave className="mr-2 w-4 h-4" />
                                    {saving ? 'Updating...' : editItem ? 'Update Advance' : 'Record Advance'}
                                </button>
                                {editItem && (
                                    <button type="button" onClick={resetForm} className="btn btn-outline-danger w-full rounded-xl font-black uppercase text-xs h-11">Cancel Edit</button>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="panel shadow-lg rounded-2xl border-none">
                            <h5 className="text-lg font-black mb-5 border-b pb-3 uppercase tracking-tight">Recent Vendor Advances</h5>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr className="!bg-primary/5">
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 whitespace-nowrap">Date</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Vendor</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 whitespace-nowrap">Amount</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold">
                                        {loading ? (
                                            <tr><td colSpan={4} className="text-center py-20">Loading...</td></tr>
                                        ) : advances.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-20 text-white-dark opacity-30">No advance records found.</td></tr>
                                        ) : (
                                            advances.map((adv) => (
                                                <tr key={adv._id} className="group hover:bg-primary/5 transition-all">
                                                    <td className="py-4 whitespace-nowrap">{new Date(adv.date).toLocaleDateString()}</td>
                                                    <td className="py-4">
                                                        <div className="font-black text-black dark:text-white-light flex items-center gap-2">
                                                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-black">
                                                                {adv.vendorType.replace('Vendor', '').replace('Supplier', '')}
                                                            </span>
                                                            {adv.vendorName}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-danger font-black text-lg whitespace-nowrap">₹{adv.paidAmount.toLocaleString()}</td>
                                                    <td className="py-4">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <button onClick={() => handleEdit(adv)} className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all"><IconEdit className="w-4 h-4" /></button>
                                                            <button onClick={() => setDeleteId(adv._id)} className="p-2 rounded-xl text-danger hover:bg-danger/10 transition-all "><IconTrashLines className="w-4 h-4" /></button>
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
                message="Are you sure you want to delete this record?"
            />
        </RoleGuard>
    );
};

export default VendorAdvancePage;
