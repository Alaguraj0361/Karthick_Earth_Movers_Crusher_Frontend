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
        advanceAmount: '',
        tripCount: '1',
        paymentMode: 'Cash',
        sourceType: 'Sale',
        rentalId: '',
        notes: ''
    };

    const [formData, setFormData] = useState(initialForm);
    const [tripsByDate, setTripsByDate] = useState<any[]>([]);
    const [rentalsByDate, setRentalsByDate] = useState<any[]>([]);

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

    const fetchRentalsForDate = async (date: string, currentEditRentalId?: string) => {
        try {
            const [rentalsRes, paymentsRes] = await Promise.all([
                api.get(`/rentals?date=${date}`),
                api.get('/driver-payments')
            ]);
            if (rentalsRes.data.success) {
                const allRentals = rentalsRes.data.data;
                const paidRentalIds = (paymentsRes.data.success ? paymentsRes.data.data : [])
                    .filter((p: any) => p.rentalId)
                    .map((p: any) => p.rentalId.toString());
                const availableRentals = allRentals.filter((r: any) => {
                    if (currentEditRentalId && r._id.toString() === currentEditRentalId) return true;
                    return !paidRentalIds.includes(r._id.toString());
                });
                setRentalsByDate(availableRentals);
            }
        } catch (error) {
            console.error('Error fetching rentals:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTripsForDate(formData.date);
        fetchRentalsForDate(formData.date);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'date') {
            fetchTripsForDate(value, editId || undefined);
            fetchRentalsForDate(value, editId || undefined);
            setFormData(prev => ({ ...prev, date: value, tripId: '', rentalId: '', vehicleType: '', driverName: '' }));
        }

        if (name === 'tripId') {
            const selectedTrip = tripsByDate.find(t => t._id === value);
            if (selectedTrip) {
                const isContract = selectedTrip.vehicleId?.ownershipType === 'Contract';
                const contractorName = selectedTrip.vehicleId?.contractor?.name;
                const vNum = selectedTrip.vehicleId?.vehicleNumber || selectedTrip.vehicleId?.registrationNumber || 'No Plate';

                // Calculate how many trips this specific DRIVER did with this specific vehicle on this day
                const driverTripsCount = tripsByDate.filter(t =>
                    ((t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.vehicleId?._id) === (selectedTrip.vehicleId?.vehicleNumber || selectedTrip.vehicleId?.registrationNumber || selectedTrip.vehicleId?._id)) &&
                    (t.driverName === selectedTrip.driverName)
                ).length;

                setFormData(prev => ({
                    ...prev,
                    tripId: value,
                    vehicleType: selectedTrip.vehicleType || 'Lorry',
                    driverName: isContract && contractorName ? `[VENDOR] ${contractorName}` : selectedTrip.driverName,
                    tripCount: driverTripsCount.toString(),
                    notes: `Trip: ${selectedTrip.fromLocation} to ${selectedTrip.toLocation} (${vNum})${contractorName ? ` | Vendor: ${contractorName}` : ''}`
                }));

                // Fetch advances for this driver (Match by ID or Name)
                api.get(`/labour/advance`).then(res => {
                    if (res.data.success) {
                        const totalAdv = res.data.data
                            .filter((a: any) => {
                                const isSameDriver = (selectedTrip.driverId && a.labour?._id === selectedTrip.driverId) ||
                                                   (a.labour?.name?.trim().toLowerCase() === selectedTrip.driverName?.trim().toLowerCase());
                                
                                // Only deduct advances from the same date to match user expectation for today's payment
                                const advDate = new Date(a.date).toISOString().split('T')[0];
                                const selDate = formData.date;
                                return isSameDriver && advDate === selDate;
                            })
                            .reduce((sum: number, a: any) => sum + a.amount, 0);
                        setFormData(prev => ({ ...prev, advanceAmount: totalAdv.toString() }));
                    }
                });
            }
        }

        if (name === 'rentalId') {
            const selectedRental = rentalsByDate.find(r => r._id === value);
            if (selectedRental) {
                const vNum = selectedRental.vehicleId?.vehicleNumber || selectedRental.vehicleId?.registrationNumber || 'No Plate';
                const rType = selectedRental.rentalType || 'Day';
                
                setFormData(prev => ({
                    ...prev,
                    rentalId: value,
                    vehicleType: selectedRental.vehicleId?.type || 'Lorry',
                    driverName: selectedRental.driverName,
                    tripCount: selectedRental.duration.toString(),
                    paymentType: 'Per Trip',
                    notes: `Rental: ${selectedRental.customerName} (${vNum}) | Type: ${rType}`
                }));

                // If rentalType is 'Trip', set paymentType to 'Per Trip'
                if (rType === 'Trip') {
                    setFormData(p => ({ ...p, paymentType: 'Per Trip' }));
                }

                // Fetch advances
                api.get(`/labour/advance`).then(res => {
                    if (res.data.success) {
                        const totalAdv = res.data.data
                            .filter((a: any) => {
                                const isSameDriver = (a.labour?.name?.trim().toLowerCase() === selectedRental.driverName?.trim().toLowerCase());
                                const advDate = new Date(a.date).toISOString().split('T')[0];
                                return isSameDriver && advDate === formData.date;
                            })
                            .reduce((sum: number, a: any) => sum + a.amount, 0);
                        setFormData(prev => ({ ...prev, advanceAmount: totalAdv.toString() }));
                    }
                });
            }
        }
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditId(null);
        setTripsByDate([]);
        setRentalsByDate([]);
        setShowForm(false);
        fetchTripsForDate(initialForm.date);
        fetchRentalsForDate(initialForm.date);
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
            const payload: any = {
                ...formData,
                amount: Number(formData.amount),
                padiKasu: Number(formData.padiKasu || 0),
                advanceAmount: Number(formData.advanceAmount || 0),
                tripCount: Number(formData.tripCount || 1),
            };

            if (!payload.tripId || payload.tripId === '') delete payload.tripId;
            if (!payload.rentalId || payload.rentalId === '') delete payload.rentalId;
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
            advanceAmount: (payment.advanceAmount || 0).toString(),
            tripCount: (payment.tripCount || 1).toString(),
            paymentMode: payment.paymentMode,
            sourceType: payment.sourceType || 'Sale',
            rentalId: payment.rentalId || '',
            notes: payment.notes || ''
        });
        setEditId(payment._id);
        setShowForm(true);
        if (payment.date) {
            fetchTripsForDate(payment.date.split('T')[0], payment.tripId || undefined);
            fetchRentalsForDate(payment.date.split('T')[0], payment.rentalId || undefined);
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
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Source Category</label>
                                <div className="flex bg-primary/5 p-1 rounded-xl w-full gap-1 border border-primary/10">
                                    {['Sale', 'Rental'].map(source => (
                                        <button
                                            key={source}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, sourceType: source, tripId: '', rentalId: '', vehicleType: '', driverName: '' }))}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${formData.sourceType === source ? 'bg-primary text-white shadow-md' : 'text-primary hover:bg-primary/10'}`}
                                        >
                                            {source === 'Sale' ? '📦 Sale Trips' : '🏗️ Rentals'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {formData.sourceType === 'Sale' ? (
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-primary font-black">Select Trip Record</label>
                                <select name="tripId" className="form-select border-primary font-bold bg-primary/5" value={formData.tripId} onChange={handleChange} required>
                                    <option value="">Choose Trip ID</option>
                                    {tripsByDate.map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || 'No Plate'} - {t.driverName} | {t.fromLocation} → {t.toLocation} | {t.vehicleId?.ownershipType === 'Contract' ? `(CONTRACT - ${t.vehicleId?.contractor?.name || 'Vendor'})` : '(OWN)'}
                                        </option>
                                    ))}
                                    {tripsByDate.length === 0 && <option disabled>No unpaid trips found on this date</option>}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-info font-black">Select Rental Record</label>
                                <select name="rentalId" className="form-select border-info font-bold bg-info/5" value={formData.rentalId} onChange={handleChange} required>
                                    <option value="">Choose Rental ID</option>
                                    {rentalsByDate.map((r) => (
                                        <option key={r._id} value={r._id}>
                                            {r.vehicleId?.name} ({r.vehicleId?.vehicleNumber || r.vehicleId?.registrationNumber}) - {r.driverName} | {r.customerName} ({r.rentalType})
                                        </option>
                                    ))}
                                    {rentalsByDate.length === 0 && <option disabled>No unpaid rentals found on this date</option>}
                                </select>
                            </div>
                        )}

                        {/* Selection Summary */}
                        {(formData.tripId || formData.rentalId) && (
                            <div className={`p-3 rounded-lg border -mt-2 ${formData.sourceType === 'Sale' ? 'bg-primary/5 border-primary/20' : 'bg-info/5 border-info/20'}`}>
                                <p className={`text-[11px] font-bold flex items-center gap-1 mb-2 ${formData.sourceType === 'Sale' ? 'text-primary' : 'text-info'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${formData.sourceType === 'Sale' ? 'bg-primary' : 'bg-info'}`} />
                                    Linked {formData.sourceType}: {formData.sourceType === 'Sale' ? 
                                        tripsByDate.find(t => t._id === formData.tripId)?.vehicleId?.vehicleNumber : 
                                        rentalsByDate.find(r => r._id === formData.rentalId)?.vehicleId?.vehicleNumber || rentalsByDate.find(r => r._id === formData.rentalId)?.vehicleId?.registrationNumber}
                                </p>
                                <div className="flex items-center justify-between bg-white dark:bg-black/20 p-2 rounded border border-white-dark/10">
                                    <span className="text-[10px] font-bold text-white-dark uppercase">Details:</span>
                                    <div className="flex flex-col items-end">
                                        <span className={`badge text-[10px] py-0 ${formData.sourceType === 'Sale' ? 'badge-outline-primary' : 'badge-outline-info'}`}>
                                            {formData.sourceType === 'Sale' ? 'SALE TRIP' : 'RENTAL SERVICE'}
                                        </span>
                                        <span className="text-[11px] font-black uppercase mt-0.5">
                                            {formData.sourceType === 'Sale' ? 
                                                (tripsByDate.find(t => t._id === formData.tripId)?.fromLocation + ' -> ' + tripsByDate.find(t => t._id === formData.tripId)?.toLocation) : 
                                                (rentalsByDate.find(r => r._id === formData.rentalId)?.customerName + ' [' + rentalsByDate.find(r => r._id === formData.rentalId)?.rentalType + ']')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.sourceType !== 'Rental' && (
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
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Payment Type</label>
                                <select name="paymentType" className="form-select" value={formData.paymentType} onChange={handleChange} required>
                                    <option value="Per Trip">Per Trip Payment (ஒரு trip-க்கு)</option>
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
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-danger font-black underline decoration-danger/20">Advance (₹)</label>
                                <input type="number" name="advanceAmount" className="form-input border-danger text-danger font-bold text-lg bg-[#eee] cursor-not-allowed" value={formData.advanceAmount} onChange={handleChange} placeholder="0" readOnly />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-info font-black">
                                    {formData.sourceType === 'Sale' ? 'No. of Trips' : (
                                        formData.rentalId ? (
                                            rentalsByDate.find(r => r._id === formData.rentalId)?.rentalType === 'Trip' ? 'No. of Trips' :
                                            rentalsByDate.find(r => r._id === formData.rentalId)?.rentalType === 'Kilometer' ? 'No. of KMs' :
                                            'No. of Days'
                                        ) : 'Count'
                                    )}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input type="number" name="tripCount" className="form-input border-info text-info font-black text-lg text-center bg-[#eee] cursor-not-allowed" value={formData.tripCount} onChange={handleChange} required min="1" readOnly />
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark/5 p-3 rounded-xl border border-dashed border-dark/20 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-white-dark font-bold uppercase text-xs tracking-wider">Total Payable Amount:</span>
                                <span className="text-[10px] text-white-dark italic">
                                    ((₹{Number(formData.amount || 0).toLocaleString()} + ₹{Number(formData.padiKasu || 0).toLocaleString()}) × {formData.tripCount} {formData.sourceType === 'Sale' ? 'trips' : 'units'}) - ₹{Number(formData.advanceAmount || 0).toLocaleString()} Adv
                                </span>
                            </div>
                            <span className="text-3xl font-black text-black dark:text-white-light font-mono shadow-sm text-success">
                                ₹{(((Number(formData.amount || 0) + Number(formData.padiKasu || 0)) * Number(formData.tripCount || 1)) - Number(formData.advanceAmount || 0)).toLocaleString()}
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
                                    <th className="!text-right text-danger">Adv (₹)</th>
                                    <th className="!text-right text-success bg-success/5 font-black">Total (₹)</th>
                                    <th>Source</th>
                                    <th>Count</th>
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
                                            <td className="!text-right font-bold text-lg font-mono text-danger">₹{pay.advanceAmount?.toLocaleString() || '0'}</td>
                                            <td className="!text-right font-black text-lg font-mono text-success bg-success/5">₹{((Number(pay.amount || 0) + Number(pay.padiKasu || 0)) * (pay.tripCount || 1) - (pay.advanceAmount || 0)).toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${pay.sourceType === 'Rental' ? 'badge-outline-info' : 'badge-outline-primary'} text-[10px] font-black`}>
                                                    {pay.sourceType || 'Sale'}
                                                </span>
                                            </td>
                                            <td className="text-center font-bold text-xs">
                                                {pay.tripCount || 1} {pay.sourceType === 'Rental' ? 'Units' : 'Trips'}
                                            </td>
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
