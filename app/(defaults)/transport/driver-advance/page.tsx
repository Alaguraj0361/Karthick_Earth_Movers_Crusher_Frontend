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

const DriverAdvancePage = () => {
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
    const [manualEntry, setManualEntry] = useState(false);
    const [manualName, setManualName] = useState('');
    const [ownVehicleDrivers, setOwnVehicleDrivers] = useState<any[]>([]);
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [labourRes, advanceRes, vehicleRes] = await Promise.all([
                api.get('/labour'),
                api.get('/labour/advance'),
                api.get('/master/vehicles')
            ]);
            
            // Get drivers from "Own" vehicles
            const vehicleDrivers = vehicleRes.data.success 
                ? vehicleRes.data.data
                    .filter((v: any) => v.ownershipType === 'Own' && v.driverName && v.driverName.toLowerCase() !== 'not assigned')
                    .map((v: any) => ({
                        name: v.driverName.trim(),
                        vehicle: v.vehicleNumber || v.registrationNumber || 'No Plate'
                    }))
                : [];
            setOwnVehicleDrivers(vehicleDrivers);

            if (labourRes.data.success) {
                setLabours(labourRes.data.data);
            }

            if (advanceRes.data.success) {
                setAdvances(advanceRes.data.data);
            }
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
        setFormData({ ...formData, [name]: value });
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            let labourId = formData.labour;
            let finalManualName = manualName;

            // Handle selection from dropdown if it was a "MANUAL:" value
            if (labourId.startsWith('MANUAL:')) {
                finalManualName = labourId.replace('MANUAL:', '');
                labourId = '';
            }

            // If manual entry or "MANUAL:" selection, handle creation
            if ((manualEntry || finalManualName) && !labourId) {
                const targetName = manualEntry ? manualName.trim() : finalManualName.trim();
                const existing = labours.find(l => l.name.toLowerCase() === targetName.toLowerCase());
                
                if (existing) {
                    labourId = existing._id;
                } else {
                    const newLabourRes = await api.post('/labour', {
                        name: targetName,
                        workType: 'Driver',
                        status: 'active'
                    });
                    if (newLabourRes.data.success) {
                        labourId = newLabourRes.data.data._id;
                    }
                }
            }

            if (!labourId) {
                showToast('Please select or enter a driver name', 'error');
                setSaving(false);
                return;
            }

            let response;
            const payload = { ...formData, labour: labourId };
            if (editItem) {
                response = await api.put(`/labour/advance/${editItem._id}`, payload);
            } else {
                response = await api.post('/labour/advance', payload);
            }

            if (response.data.success) {
                showToast(editItem ? 'Driver advance updated successfully' : 'Driver advance recorded successfully', 'success');
                setFormData({
                    labour: '',
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    paymentMode: 'Cash',
                    remarks: ''
                });
                setManualEntry(false);
                setManualName('');
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
        const lId = item.labour?._id || '';
        const lName = item.labour?.name || '';
        
        // Is this driver in our "Own Vehicle" selection list?
        const isInList = ownVehicleDrivers.some(vd => vd.name.toLowerCase() === lName.toLowerCase());
        
        if (!isInList && lName) {
            setManualEntry(true);
            setManualName(lName);
            setFormData({
                labour: '', 
                date: new Date(item.date).toISOString().split('T')[0],
                amount: item.amount.toString(),
                paymentMode: item.paymentMode,
                remarks: item.remarks || ''
            });
        } else {
            setManualEntry(false);
            setManualName('');
            setFormData({
                labour: lId,
                date: new Date(item.date).toISOString().split('T')[0],
                amount: item.amount.toString(),
                paymentMode: item.paymentMode,
                remarks: item.remarks || ''
            });
        }
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
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Transport</span></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Driver Advance</span></li>
                </ul>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="panel shadow-lg rounded-2xl border-none">
                            <h5 className="text-lg font-black mb-5 border-b pb-3 uppercase text-primary tracking-tight">
                                {editItem ? 'Edit Driver Advance' : 'Record Driver Advance'}
                            </h5>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] font-black uppercase text-white-dark mb-0 block">Select Driver (ஓட்டுநர்)</label>
                                        <button 
                                            type="button" 
                                            onClick={() => { setManualEntry(!manualEntry); setManualName(''); setFormData({...formData, labour: ''}); }}
                                            className="text-[9px] font-black uppercase text-primary hover:underline"
                                        >
                                            {manualEntry ? 'Select from List' : 'Enter Manually'}
                                        </button>
                                    </div>
                                    {manualEntry ? (
                                        <input 
                                            type="text" 
                                            className="form-input font-bold rounded-xl border-primary" 
                                            placeholder="Type Driver Name..." 
                                            value={manualName}
                                            onChange={(e) => setManualName(e.target.value)}
                                            required 
                                        />
                                    ) : (
                                        <select name="labour" className="form-select font-bold rounded-xl" value={formData.labour} onChange={handleChange} required>
                                            <option value="">Select Driver</option>
                                            {ownVehicleDrivers.map(vd => {
                                                const laborMatch = labours.find(l => l.name.toLowerCase() === vd.name.toLowerCase());
                                                return (
                                                    <option key={vd.name} value={laborMatch ? laborMatch._id : `MANUAL:${vd.name}`}>
                                                        {vd.name} - ({vd.vehicle})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    )}
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

                    <div className="lg:col-span-2">
                        <div className="panel shadow-lg rounded-2xl border-none">
                            <h5 className="text-lg font-black mb-5 border-b pb-3 uppercase tracking-tight">Driver Advance History</h5>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr className="!bg-primary/5">
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Date</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Driver Name</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Amount</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Mode</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold">
                                        {loading ? (
                                            <tr><td colSpan={5} className="text-center py-20">Loading...</td></tr>
                                        ) : advances.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-20 opacity-20 hover:opacity-100 italic">No driver records found.</td></tr>
                                        ) : (
                                            advances.map((adv) => (
                                                <tr key={adv._id}>
                                                    <td>{new Date(adv.date).toLocaleDateString()}</td>
                                                    <td className="font-black">{adv.labour?.name}</td>
                                                    <td className="text-danger">₹{adv.amount.toLocaleString()}</td>
                                                    <td>{adv.paymentMode}</td>
                                                    <td>
                                                        <div className="flex justify-center items-center gap-2">
                                                            <button type="button" onClick={() => handleEdit(adv)} className="text-primary hover:underline">
                                                                <IconEdit className="w-4 h-4" />
                                                            </button>
                                                            <button type="button" onClick={() => setDeleteId(adv._id)} className="text-danger hover:underline">
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
                title="Delete Driver Advance"
                message="Are you sure you want to delete this record?"
            />
        </RoleGuard>
    );
};

export default DriverAdvancePage;
