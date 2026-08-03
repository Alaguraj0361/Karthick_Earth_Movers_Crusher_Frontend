'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import { canEditRecord } from '@/utils/permissions';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSearch from '@/components/icon/icon-search';
import IconX from '@/components/icon/icon-x';
import IconSave from '@/components/icon/icon-save';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';

const DriverPaymentManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';

    const { showToast } = useToast();
    const [payments, setPayments] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        tripId: '',
        vehicleType: '',
        driverName: '',
        paymentType: 'Per Trip',
        amount: '',
        padiKasu: '',
        tripCount: '1',
        paymentMode: 'Cash',
        notes: ''
    };

    const [formData, setFormData] = useState(initialForm);
    const [tripsByDate, setTripsByDate] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [payRes, driverRes, vehicleRes] = await Promise.all([
                api.get('/driver-payments'),
                api.get('/labour'),
                api.get('/master/vehicles')
            ]);

            if (payRes.data.success) setPayments(payRes.data.data);

            // Collect drivers from Labour Management
            let combinedDrivers: any[] = [];
            if (driverRes.data.success) {
                const laborDrivers = driverRes.data.data.filter((l: any) =>
                    l.workType?.toLowerCase().includes('driver')
                ).map((l: any) => ({ name: l.name, type: 'Labour' }));
                combinedDrivers = [...laborDrivers];
            }

            // Collect drivers from Vehicle Master
            if (vehicleRes.data.success) {
                const vehicleDrivers = vehicleRes.data.data
                    .filter((v: any) => v.driverName)
                    .map((v: any) => ({ name: v.driverName, type: 'Vehicle', vehicle: v.vehicleNumber || v.registrationNumber }));

                // Add unique names from vehicles
                vehicleDrivers.forEach((vd: any) => {
                    if (!combinedDrivers.find(d => d.name.toLowerCase() === vd.name.toLowerCase())) {
                        combinedDrivers.push(vd);
                    }
                });
            }

            setDrivers(combinedDrivers);
        } catch (error) {
            console.error(error);
            showToast('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch trips for a given date, filtering out trips that already have a payment.
    // If editing, the current trip (currentEditTripId) is always shown in the list.
    const fetchTripsForDate = async (date: string, currentEditTripId?: string) => {
        try {
            const [tripsRes, paymentsRes] = await Promise.all([
                api.get(`/trips?date=${date}`),
                api.get('/driver-payments')
            ]);

            if (tripsRes.data.success) {
                const allTrips = tripsRes.data.data;

                // Collect all tripIds that already have a payment recorded
                const paidTripIds: string[] = (paymentsRes.data.success ? paymentsRes.data.data : [])
                    .filter((p: any) => p.tripId)
                    .map((p: any) => p.tripId.toString());

                // Filter: exclude already-paid trips, but always include the currently-being-edited trip
                // Also only allow 'Own' ownershipType vehicles to be shown
                const availableTrips = allTrips.filter((t: any) => {
                    if (currentEditTripId && t._id.toString() === currentEditTripId) return true;
                    if (t.vehicleId?.ownershipType !== 'Own') return false;
                    return !paidTripIds.includes(t._id.toString());
                });

                setTripsByDate(availableTrips);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTripsForDate(formData.date);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'date') {
            fetchTripsForDate(value, editId || undefined);
            setFormData(prev => ({ ...prev, date: value, tripId: '', vehicleType: '', driverName: '' }));
        }

        if (name === 'tripId') {
            const selectedTrip = tripsByDate.find(t => t._id === value);
            if (selectedTrip) {
                const isContract = selectedTrip.vehicleId?.ownershipType === 'Contract';
                const contractorName = selectedTrip.vehicleId?.contractor?.name;
                const vNum = selectedTrip.vehicleId?.vehicleNumber || selectedTrip.vehicleId?.registrationNumber || 'No Plate';

                // Calculate how many trips this specific vehicle did on this day
                const vehicleTripsCount = tripsByDate.filter(t =>
                    (t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.vehicleId?._id) === (selectedTrip.vehicleId?.vehicleNumber || selectedTrip.vehicleId?.registrationNumber || selectedTrip.vehicleId?._id)
                ).length;

                setFormData(prev => ({
                    ...prev,
                    tripId: value,
                    vehicleType: selectedTrip.vehicleType || 'Lorry',
                    driverName: isContract && contractorName ? `[VENDOR] ${contractorName}` : selectedTrip.driverName,
                    tripCount: vehicleTripsCount.toString(),
                    notes: `Trip: ${selectedTrip.fromLocation} to ${selectedTrip.toLocation} (${vNum})${contractorName ? ` | Vendor: ${contractorName}` : ''}`
                }));
            }
        }
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditId(null);
        setTripsByDate([]);
        setShowForm(false);
        fetchTripsForDate(initialForm.date);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/driver-payments/${deleteId}`);
            showToast('Payment record deleted', 'success');
            fetchData();
        } catch (error) {
            console.error(error);
            showToast('Error deleting record', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
                padiKasu: Number(formData.padiKasu || 0),
                tripCount: Number(formData.tripCount || 1),
            };
            if (editId) {
                await api.put(`/driver-payments/${editId}`, payload);
                showToast('Payment updated successfully!', 'success');
            } else {
                await api.post('/driver-payments', payload);
                showToast('Payment recorded successfully!', 'success');
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error saving payment', 'error');
        }
    };

    const handleEdit = (payment: any) => {
        setFormData({
            date: payment.date.split('T')[0],
            tripId: payment.tripId || '',
            vehicleType: payment.vehicleType || '',
            driverName: payment.driverName,
            paymentType: payment.paymentType,
            amount: payment.amount.toString(),
            padiKasu: payment.padiKasu.toString(),
            tripCount: (payment.tripCount || 1).toString(),
            paymentMode: payment.paymentMode,
            notes: payment.notes || ''
        });
        setEditId(payment._id);
        setShowForm(true);
        if (payment.date) {
            // Pass the current trip ID so it always appears in the list when editing
            fetchTripsForDate(payment.date.split('T')[0], payment.tripId || undefined);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">ஓட்டுநர் சம்பளம் (Driver Payment)</h2>
                    <p className="text-white-dark text-sm mt-1">Manage trip payments, monthly salary and allowances</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <IconPlus className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> Record New Payment
                </button>
            </div>

            {showForm && (
                <div className="panel animate__animated animate__fadeIn max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-5 border-b pb-3 border-[#ebedf2] dark:border-[#1b2e4b]">
                        <h5 className="font-bold text-lg">Record Payment</h5>
                        <button onClick={resetForm} className="text-white-dark hover:text-danger">
                            <IconX />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Payment Date</label>
                                <input type="date" name="date" className="form-input font-bold" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-primary font-black">Select Trip Record</label>
                                <select name="tripId" className="form-select border-primary font-bold bg-primary/5" value={formData.tripId} onChange={handleChange} required>
                                    <option value="">Choose Trip ID</option>
                                    {tripsByDate.map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || 'No Plate'} | {t.fromLocation} → {t.toLocation} | {t.vehicleId?.ownershipType === 'Contract' ? `(CONTRACT - ${t.vehicleId?.contractor?.name || 'Vendor'})` : '(OWN)'}
                                        </option>
                                    ))}
                                    {tripsByDate.length === 0 && <option disabled>No unpaid trips found on this date</option>}
                                </select>
                            </div>
                        </div>

                        {/* Trip Day Summary */}
                        {tripsByDate.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-dashed border-white-dark/20 text-center">
                                <div>
                                    <p className="text-[10px] text-white-dark font-bold uppercase">Total Trips</p>
                                    <p className="text-sm font-black text-primary">{tripsByDate.length}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white-dark font-bold uppercase">Own / Contract</p>
                                    <p className="text-sm font-black">
                                        <span className="text-success">{tripsByDate.filter(t => t.vehicleId?.ownershipType === 'Own').length}</span>
                                        <span className="text-white-dark mx-1">/</span>
                                        <span className="text-warning">{tripsByDate.filter(t => t.vehicleId?.ownershipType === 'Contract').length}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white-dark font-bold uppercase">Vehicles</p>
                                    <p className="text-sm font-black text-info">
                                        {new Set(tripsByDate.map(t => t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.vehicleId?._id)).size}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Vehicle Type</label>
                                <select
                                    name="vehicleType"
                                    className={`form-select font-bold ${formData.tripId ? 'bg-[#eee] cursor-not-allowed text-black' : ''}`}
                                    value={formData.vehicleType}
                                    onChange={handleChange}
                                    required
                                    disabled={!!formData.tripId}
                                >
                                    <option value="">{formData.tripId ? formData.vehicleType : 'Select Type'}</option>
                                    {!formData.tripId && (
                                        <>
                                            <option value="Lorry">Lorry</option>
                                            <option value="Tipper">Tipper</option>
                                            <option value="Tractor">Tractor</option>
                                            <option value="JCB">JCB</option>
                                            <option value="Poclain">Poclain</option>
                                            <option value="Other">Other</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Driver Name</label>
                                <select
                                    name="driverName"
                                    className={`form-select font-bold ${formData.tripId ? 'bg-[#eee] cursor-not-allowed text-black' : ''}`}
                                    value={formData.driverName}
                                    onChange={handleChange}
                                    required
                                    disabled={!!formData.tripId}
                                >
                                    <option value="">{formData.tripId ? formData.driverName : 'Select Driver'}</option>
                                    {!formData.tripId && drivers.map((d, index) => (
                                        <option key={index} value={d.name}>
                                            {d.name} {d.type === 'Vehicle' ? `(From: ${d.vehicle})` : '(Employee)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {formData.tripId && (
                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 -mt-2">
                                <p className="text-[11px] text-primary font-bold flex items-center gap-1 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Trip Linked: {tripsByDate.find(t => t._id === formData.tripId)?.vehicleId?.vehicleNumber || 'No Plate'}
                                </p>
                                <div className="flex items-center justify-between bg-white dark:bg-black/20 p-2 rounded border border-white-dark/10">
                                    <span className="text-[10px] font-bold text-white-dark uppercase">Payment Target:</span>
                                    {tripsByDate.find(t => t._id === formData.tripId)?.vehicleId?.ownershipType === 'Contract' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="badge badge-outline-warning text-[10px] py-0">TRANSPORT VENDOR</span>
                                            <span className="text-[11px] font-black text-warning uppercase mt-0.5">
                                                {tripsByDate.find(t => t._id === formData.tripId)?.vehicleId?.contractor?.name || 'External Vendor'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="badge badge-outline-success text-[10px] py-0">OWN FLEET</span>
                                            <span className="text-[11px] font-black text-success uppercase mt-0.5">Company Driver</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Payment Type</label>
                                <select name="paymentType" className="form-select" value={formData.paymentType} onChange={handleChange} required>
                                    <option value="Per Trip">Per Trip Payment (ஒரு trip-க்கு)</option>
                                    <option value="Monthly Salary">Monthly Salary (மாத சம்பளம்)</option>
                                    <option value="Bata">Bata / Allowance (படா)</option>
                                    <option value="Advance">Advance (முன்பணம்)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block font-black">Payment Mode</label>
                                <select name="paymentMode" className="form-select font-bold text-info" value={formData.paymentMode} onChange={handleChange} required>
                                    <option value="Cash">Cash (ரொக்கம்)</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="UPI/G-Pay">UPI / G-Pay</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-primary font-black underline decoration-primary/20">Basic Amount (₹)</label>
                                <input type="number" name="amount" className="form-input border-primary text-primary font-bold text-lg" value={formData.amount} onChange={handleChange} required placeholder="0" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-warning font-black underline decoration-warning/20">Padi Kasu (₹)</label>
                                <input type="number" name="padiKasu" className="form-input border-warning text-warning font-bold text-lg" value={formData.padiKasu} onChange={handleChange} placeholder="0" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-info font-black">No. of Trips</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" name="tripCount" className="form-input border-info text-info font-black text-lg text-center" value={formData.tripCount} onChange={handleChange} required min="1" />
                                    {formData.tripId && (
                                        <div className="badge badge-outline-info whitespace-nowrap">
                                            Auto: {tripsByDate.filter(t =>
                                                (t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.vehicleId?._id) === (tripsByDate.find(x => x._id === formData.tripId)?.vehicleId?.vehicleNumber || tripsByDate.find(x => x._id === formData.tripId)?.vehicleId?.registrationNumber || tripsByDate.find(x => x._id === formData.tripId)?.vehicleId?._id)
                                            ).length}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark/5 p-3 rounded-xl border border-dashed border-dark/20 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-white-dark font-bold uppercase text-xs tracking-wider">Total Payable Amount:</span>
                                <span className="text-[10px] text-white-dark italic">
                                    (₹{Number(formData.amount || 0).toLocaleString()} + ₹{Number(formData.padiKasu || 0).toLocaleString()}) × {formData.tripCount} trips
                                </span>
                            </div>
                            <span className="text-3xl font-black text-black dark:text-white-light font-mono shadow-sm">
                                ₹{((Number(formData.amount || 0) + Number(formData.padiKasu || 0)) * Number(formData.tripCount || 1)).toLocaleString()}
                            </span>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Remarks / Notes</label>
                            <textarea name="notes" className="form-textarea" rows={2} value={formData.notes} onChange={handleChange} placeholder="Optional details..."></textarea>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button type="button" className="btn btn-outline-danger" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-10">
                                <IconSave className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                {editId ? 'Update Record' : 'Save Payment Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-bold text-lg dark:text-white-light">Payment Records</h5>
                        <div className="relative w-full max-w-xs">
                            <input type="text" placeholder="Search payments..." className="form-input ltr:pr-11 rtl:pl-11" />
                            <IconSearch className="w-5 h-5 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Target / Driver</th>
                                    <th>Payment Type</th>
                                    <th className="!text-center">Mode</th>
                                    <th className="!text-right">Salary (₹)</th>
                                    <th className="!text-right text-warning">Padi (₹)</th>
                                    <th className="!text-right text-success bg-success/5 font-black">Total (₹)</th>
                                    <th>Trips</th>
                                    <th className="!text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-8">Loading...</td></tr>
                                ) : payments.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-8">No payments recorded.</td></tr>
                                ) : (
                                    payments.map((pay) => (
                                        <tr key={pay._id}>
                                            <td className="whitespace-nowrap">{new Date(pay.date).toLocaleDateString('en-GB')}</td>
                                            <td>
                                                <div className={`font-bold ${pay.driverName.startsWith('[VENDOR]') ? 'text-warning' : 'text-primary'}`}>
                                                    {pay.driverName}
                                                </div>
                                                {pay.notes && <div className="text-[10px] text-white-dark truncate max-w-[150px]">{pay.notes}</div>}
                                            </td>
                                            <td>
                                                <span className={`badge ${pay.paymentType === 'Monthly Salary' ? 'badge-outline-primary' :
                                                    pay.paymentType === 'Per Trip' ? 'badge-outline-success' :
                                                        pay.paymentType === 'Advance' ? 'badge-outline-danger' : 'badge-outline-dark'
                                                    }`}>
                                                    {pay.paymentType}
                                                </span>
                                            </td>
                                            <td className="text-center text-xs">
                                                {pay.paymentMode}
                                            </td>
                                            <td className="!text-right font-bold text-lg font-mono">₹{pay.amount?.toLocaleString()}</td>
                                            <td className="!text-right font-bold text-lg font-mono text-warning">₹{pay.padiKasu?.toLocaleString() || '0'}</td>
                                            <td className="!text-right font-black text-lg font-mono text-success bg-success/5">₹{((Number(pay.amount || 0) + Number(pay.padiKasu || 0)) * (pay.tripCount || 1)).toLocaleString()}</td>
                                            <td className="text-center font-bold">x {pay.tripCount || 1}</td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {canEditRecord(currentUser, pay.createdAt || pay.date) ? (
                                                        <button onClick={() => handleEdit(pay)} className="btn btn-sm btn-outline-primary p-1">
                                                            <IconEdit className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-white-dark italic">Locked</span>
                                                    )}
                                                    {isOwner && (<button onClick={() => setDeleteId(pay._id)} className="btn btn-sm btn-outline-danger p-1">
                                                        <IconTrashLines className="w-4 h-4" />
                                                    </button>)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Payment Record"
                message="Are you sure you want to delete this payment record?"
            />
        </div>
    );
};

export default DriverPaymentManagement;
