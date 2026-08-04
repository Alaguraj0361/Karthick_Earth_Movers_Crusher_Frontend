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
    const [searchQuery, setSearchQuery] = useState('');

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        driverName: '',
        vehicleType: 'Lorry',
        paymentType: 'Shift Based', // 'Shift Based' | 'Daily Salary' | 'Weekly Salary' | 'Monthly Salary' | 'Bata' | 'Advance'
        shiftType: 'Day Shift', // 'Day Shift' | 'Night Shift' | 'Day & Night Shift'
        
        // Shift calculations
        dayShiftCount: '1',
        dayShiftRate: '700',
        nightShiftCount: '0',
        nightShiftRate: '800',
        dayAndNightShiftCount: '0',
        dayAndNightShiftRate: '1500',

        // Daily calculation
        daysWorked: '1',
        dailyRate: '700',

        // Weekly calculation
        weeksWorked: '1',
        weeklyRate: '4500',

        // Fixed Monthly / Custom amount
        amount: '',

        padiKasu: '', // Bata
        advanceAmount: '0',
        paymentMode: 'Cash',
        sourceType: 'General', // 'General' | 'Sale' | 'Rental'
        tripId: '',
        rentalId: '',
        tripCount: '1',
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

            let combinedDrivers: any[] = [];
            if (driverRes.data.success) {
                const laborDrivers = driverRes.data.data.filter((l: any) =>
                    l.workType?.toLowerCase().includes('driver')
                ).map((l: any) => ({ name: l.name, type: 'Labour', id: l._id, wage: l.wage, wageType: l.wageType }));
                combinedDrivers = [...laborDrivers];
            }

            if (vehicleRes.data.success) {
                const vehicleDrivers = vehicleRes.data.data
                    .filter((v: any) => v.driverName)
                    .map((v: any) => ({ name: v.driverName, type: 'Vehicle', vehicle: v.vehicleNumber || v.registrationNumber }));

                vehicleDrivers.forEach((vd: any) => {
                    if (!combinedDrivers.find(d => d.name.toLowerCase() === vd.name.toLowerCase())) {
                        combinedDrivers.push(vd);
                    }
                });
            }

            setDrivers(combinedDrivers);
        } catch (error) {
            console.error(error);
            showToast('Error fetching driver payment data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTripsForDate = async (date: string, currentEditTripId?: string) => {
        try {
            const [tripsRes, paymentsRes] = await Promise.all([
                api.get(`/trips?date=${date}`),
                api.get('/driver-payments')
            ]);

            if (tripsRes.data.success) {
                const allTrips = tripsRes.data.data;
                const paidTripIds: string[] = (paymentsRes.data.success ? paymentsRes.data.data : [])
                    .filter((p: any) => p.tripId)
                    .map((p: any) => p.tripId.toString());

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

    const fetchDriverAdvance = (driverName: string, date: string) => {
        if (!driverName) return;
        api.get(`/labour/advance`).then(res => {
            if (res.data.success) {
                const totalAdv = res.data.data
                    .filter((a: any) => {
                        const isSameDriver = a.labour?.name?.trim().toLowerCase() === driverName.trim().toLowerCase();
                        const advDate = new Date(a.date).toISOString().split('T')[0];
                        return isSameDriver && advDate === date;
                    })
                    .reduce((sum: number, a: any) => sum + (a.amount || 0), 0);
                setFormData(prev => ({ ...prev, advanceAmount: totalAdv.toString() }));
            }
        }).catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
        fetchTripsForDate(formData.date);
        fetchRentalsForDate(formData.date);
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            if (name === 'date') {
                fetchTripsForDate(value, editId || undefined);
                fetchRentalsForDate(value, editId || undefined);
                if (updated.driverName) fetchDriverAdvance(updated.driverName, value);
            }

            if (name === 'driverName') {
                fetchDriverAdvance(value, updated.date);
                const selectedDriver = drivers.find(d => d.name === value);
                if (selectedDriver && selectedDriver.wage) {
                    if (selectedDriver.wageType === 'Monthly') {
                        updated.paymentType = 'Monthly Salary';
                        updated.amount = selectedDriver.wage.toString();
                    } else {
                        updated.dailyRate = selectedDriver.wage.toString();
                        updated.dayShiftRate = selectedDriver.wage.toString();
                    }
                }
            }

            return updated;
        });
    };

    // Calculate gross salary before bata & advance
    const calculateGrossSalary = (form: typeof initialForm) => {
        if (form.paymentType === 'Shift Based') {
            if (form.shiftType === 'Day Shift') {
                return Number(form.dayShiftCount || 0) * Number(form.dayShiftRate || 0);
            } else if (form.shiftType === 'Night Shift') {
                return Number(form.nightShiftCount || 0) * Number(form.nightShiftRate || 0);
            } else if (form.shiftType === 'Day & Night Shift') {
                const combined = Number(form.dayAndNightShiftCount || 0) * Number(form.dayAndNightShiftRate || 0);
                if (combined > 0) return combined;
                return (Number(form.dayShiftCount || 0) * Number(form.dayShiftRate || 0)) +
                       (Number(form.nightShiftCount || 0) * Number(form.nightShiftRate || 0));
            }
            return (Number(form.dayShiftCount || 0) * Number(form.dayShiftRate || 0)) +
                   (Number(form.nightShiftCount || 0) * Number(form.nightShiftRate || 0)) +
                   (Number(form.dayAndNightShiftCount || 0) * Number(form.dayAndNightShiftRate || 0));
        } else if (form.paymentType === 'Daily Salary') {
            return Number(form.daysWorked || 0) * Number(form.dailyRate || 0);
        } else if (form.paymentType === 'Weekly Salary') {
            return Number(form.weeksWorked || 0) * Number(form.weeklyRate || 0);
        }
        return Number(form.amount || 0);
    };

    const grossSalary = calculateGrossSalary(formData);
    const padiKasuNum = Number(formData.padiKasu || 0);
    const advanceNum = Number(formData.advanceAmount || 0);
    const netPayable = (grossSalary + padiKasuNum) - advanceNum;

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
            showToast('Driver payment record deleted', 'success');
            fetchData();
        } catch (error) {
            console.error(error);
            showToast('Error deleting driver payment record', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const computedAmount = calculateGrossSalary(formData);
            const payload: any = {
                ...formData,
                amount: computedAmount,
                dayShiftCount: Number(formData.dayShiftCount || 0),
                dayShiftRate: Number(formData.dayShiftRate || 0),
                nightShiftCount: Number(formData.nightShiftCount || 0),
                nightShiftRate: Number(formData.nightShiftRate || 0),
                dayAndNightShiftCount: Number(formData.dayAndNightShiftCount || 0),
                dayAndNightShiftRate: Number(formData.dayAndNightShiftRate || 0),
                daysWorked: Number(formData.daysWorked || 0),
                dailyRate: Number(formData.dailyRate || 0),
                weeksWorked: Number(formData.weeksWorked || 0),
                weeklyRate: Number(formData.weeklyRate || 0),
                padiKasu: Number(formData.padiKasu || 0),
                advanceAmount: Number(formData.advanceAmount || 0),
                tripCount: Number(formData.tripCount || 1),
            };

            if (!payload.tripId || payload.tripId === '') delete payload.tripId;
            if (!payload.rentalId || payload.rentalId === '') delete payload.rentalId;

            if (editId) {
                await api.put(`/driver-payments/${editId}`, payload);
                showToast('Driver payment record updated!', 'success');
            } else {
                await api.post('/driver-payments', payload);
                showToast('Driver payment recorded successfully!', 'success');
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
            date: payment.date ? payment.date.split('T')[0] : new Date().toISOString().split('T')[0],
            driverName: payment.driverName || '',
            vehicleType: payment.vehicleType || 'Lorry',
            paymentType: payment.paymentType || 'Shift Based',
            shiftType: payment.shiftType || 'Day Shift',
            dayShiftCount: (payment.dayShiftCount || 0).toString(),
            dayShiftRate: (payment.dayShiftRate || 0).toString(),
            nightShiftCount: (payment.nightShiftCount || 0).toString(),
            nightShiftRate: (payment.nightShiftRate || 0).toString(),
            dayAndNightShiftCount: (payment.dayAndNightShiftCount || 0).toString(),
            dayAndNightShiftRate: (payment.dayAndNightShiftRate || 0).toString(),
            daysWorked: (payment.daysWorked || 0).toString(),
            dailyRate: (payment.dailyRate || 0).toString(),
            weeksWorked: (payment.weeksWorked || 0).toString(),
            weeklyRate: (payment.weeklyRate || 0).toString(),
            amount: (payment.amount || 0).toString(),
            padiKasu: (payment.padiKasu || 0).toString(),
            advanceAmount: (payment.advanceAmount || 0).toString(),
            paymentMode: payment.paymentMode || 'Cash',
            sourceType: payment.sourceType || 'General',
            tripId: payment.tripId || '',
            rentalId: payment.rentalId || '',
            tripCount: (payment.tripCount || 1).toString(),
            notes: payment.notes || ''
        });
        setEditId(payment._id);
        setShowForm(true);
    };

    const filteredPayments = payments.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.driverName?.toLowerCase().includes(q) ||
            p.paymentType?.toLowerCase().includes(q) ||
            p.shiftType?.toLowerCase().includes(q) ||
            p.vehicleType?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">ஓட்டுநர் சம்பளம் (Driver Shift & Fixed Salary)</h2>
                    <p className="text-white-dark text-sm mt-1">Manage shift-based (Day/Night/Day&Night), daily, weekly, and monthly driver payments</p>
                </div>
                <button className="btn btn-primary shadow-lg" onClick={() => setShowForm(true)}>
                    <IconPlus className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> Record Driver Payment
                </button>
            </div>

            {/* Entry Form */}
            {showForm && (
                <div className="panel animate__animated animate__fadeIn max-w-3xl mx-auto shadow-xl rounded-2xl border border-primary/10">
                    <div className="flex items-center justify-between mb-5 border-b pb-3 border-[#ebedf2] dark:border-[#1b2e4b]">
                        <h5 className="font-bold text-lg text-primary flex items-center gap-2">
                            <IconCashBanknotes className="w-6 h-6 text-primary" />
                            {editId ? 'Edit Driver Salary Record' : 'Record New Driver Salary'}
                        </h5>
                        <button onClick={resetForm} className="text-white-dark hover:text-danger">
                            <IconX />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Date & Driver Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Payment Date <span className="text-danger">*</span></label>
                                <input type="date" name="date" className="form-input font-bold" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Driver Name <span className="text-danger">*</span></label>
                                <select
                                    name="driverName"
                                    className="form-select font-bold border-primary text-primary"
                                    value={formData.driverName}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Driver --</option>
                                    {drivers.map((d, index) => (
                                        <option key={index} value={d.name}>
                                            {d.name} {d.type === 'Vehicle' ? `(Vehicle: ${d.vehicle})` : '(Staff Driver)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Vehicle Type</label>
                                <select name="vehicleType" className="form-select font-bold" value={formData.vehicleType} onChange={handleChange}>
                                    <option value="Lorry">Lorry</option>
                                    <option value="Tipper">Tipper</option>
                                    <option value="Tractor">Tractor</option>
                                    <option value="JCB">JCB</option>
                                    <option value="Poclain">Poclain</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Salary Mode Selector */}
                        <div>
                            <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Salary Mode (சம்பளம் வகை) <span className="text-danger">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {[
                                    { id: 'Shift Based', label: '🌅 Shift Based', sub: 'Day / Night / Both' },
                                    { id: 'Daily Salary', label: '📅 Daily Salary', sub: 'Per Day Wage' },
                                    { id: 'Weekly Salary', label: '📆 Weekly Salary', sub: 'Per Week Wage' },
                                    { id: 'Monthly Salary', label: '🗓️ Monthly Salary', sub: 'Fixed Monthly' },
                                ].map(mode => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, paymentType: mode.id }))}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                            formData.paymentType === mode.id
                                                ? 'bg-primary text-white border-primary shadow-md scale-105'
                                                : 'bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary'
                                        }`}
                                    >
                                        <span className="font-bold text-sm">{mode.label}</span>
                                        <span className="text-[10px] opacity-80">{mode.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode Specific Inputs */}
                        {/* 1. Shift Based Options */}
                        {formData.paymentType === 'Shift Based' && (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <label className="text-sm font-black text-primary uppercase">Shift Type (ஷிப்ட் தேர்வு):</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { id: 'Day Shift', label: '☀️ Day Shift (பகல்)' },
                                            { id: 'Night Shift', label: '🌙 Night Shift (இரவு)' },
                                            { id: 'Day & Night Shift', label: '🔄 Day & Night (இரண்டும்)' },
                                        ].map(shift => (
                                            <button
                                                key={shift.id}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, shiftType: shift.id }))}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    formData.shiftType === shift.id
                                                        ? 'bg-primary text-white shadow-sm'
                                                        : 'bg-white dark:bg-black/30 text-gray-600 dark:text-gray-300 hover:bg-primary/10'
                                                }`}
                                            >
                                                {shift.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(formData.shiftType === 'Day Shift' || formData.shiftType === 'Day & Night Shift') && (
                                        <div className="p-3 bg-white dark:bg-black/30 rounded-lg border border-amber-500/20">
                                            <label className="text-xs font-bold text-amber-600 block mb-1">☀️ Day Shift Details</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-[11px] font-bold text-white-dark block">No. of Shifts</span>
                                                    <input
                                                        type="number"
                                                        name="dayShiftCount"
                                                        className="form-input font-bold text-amber-700"
                                                        value={formData.dayShiftCount}
                                                        onChange={handleChange}
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-[11px] font-bold text-white-dark block">Day Rate (₹/shift)</span>
                                                    <input
                                                        type="number"
                                                        name="dayShiftRate"
                                                        className="form-input font-bold text-amber-700"
                                                        value={formData.dayShiftRate}
                                                        onChange={handleChange}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(formData.shiftType === 'Night Shift' || formData.shiftType === 'Day & Night Shift') && (
                                        <div className="p-3 bg-white dark:bg-black/30 rounded-lg border border-indigo-500/20">
                                            <label className="text-xs font-bold text-indigo-600 block mb-1">🌙 Night Shift Details</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-[11px] font-bold text-white-dark block">No. of Shifts</span>
                                                    <input
                                                        type="number"
                                                        name="nightShiftCount"
                                                        className="form-input font-bold text-indigo-700"
                                                        value={formData.nightShiftCount}
                                                        onChange={handleChange}
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-[11px] font-bold text-white-dark block">Night Rate (₹/shift)</span>
                                                    <input
                                                        type="number"
                                                        name="nightShiftRate"
                                                        className="form-input font-bold text-indigo-700"
                                                        value={formData.nightShiftRate}
                                                        onChange={handleChange}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. Daily Salary */}
                        {formData.paymentType === 'Daily Salary' && (
                            <div className="p-4 rounded-xl bg-info/5 border border-info/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-info uppercase block mb-1">Days Worked (நாட்கள்)</label>
                                    <input
                                        type="number"
                                        name="daysWorked"
                                        className="form-input font-bold text-info text-lg"
                                        value={formData.daysWorked}
                                        onChange={handleChange}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-info uppercase block mb-1">Daily Wage Rate (₹/நாள்)</label>
                                    <input
                                        type="number"
                                        name="dailyRate"
                                        className="form-input font-bold text-info text-lg"
                                        value={formData.dailyRate}
                                        onChange={handleChange}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 3. Weekly Salary */}
                        {formData.paymentType === 'Weekly Salary' && (
                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-purple-600 uppercase block mb-1">Weeks Count (வாரங்கள்)</label>
                                    <input
                                        type="number"
                                        name="weeksWorked"
                                        className="form-input font-bold text-purple-600 text-lg"
                                        value={formData.weeksWorked}
                                        onChange={handleChange}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-purple-600 uppercase block mb-1">Weekly Wage Rate (₹/வாரம்)</label>
                                    <input
                                        type="number"
                                        name="weeklyRate"
                                        className="form-input font-bold text-purple-600 text-lg"
                                        value={formData.weeklyRate}
                                        onChange={handleChange}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 4. Monthly Salary / Custom Amount */}
                        {formData.paymentType === 'Monthly Salary' && (
                            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                                <label className="text-xs font-bold text-success uppercase block mb-1">Fixed Monthly Salary Amount (₹)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    className="form-input font-bold text-success text-xl"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="Enter Monthly Amount"
                                    required
                                />
                            </div>
                        )}

                        {/* Allowances & Deductions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="text-xs font-bold text-warning uppercase block mb-1">Padi Kasu / Bata (₹)</label>
                                <input
                                    type="number"
                                    name="padiKasu"
                                    className="form-input border-warning text-warning font-bold text-lg"
                                    value={formData.padiKasu}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-danger uppercase block mb-1">Advance Deduction (₹)</label>
                                <input
                                    type="number"
                                    name="advanceAmount"
                                    className="form-input border-danger text-danger font-bold text-lg"
                                    value={formData.advanceAmount}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase block mb-1">Payment Mode</label>
                                <select name="paymentMode" className="form-select font-bold" value={formData.paymentMode} onChange={handleChange}>
                                    <option value="Cash">Cash (ரொக்கம்)</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="UPI/G-Pay">UPI / G-Pay</option>
                                </select>
                            </div>
                        </div>

                        {/* Net Breakdown Calculation */}
                        <div className="bg-dark/5 dark:bg-black/40 p-4 rounded-xl border border-dashed border-dark/20 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold uppercase text-white-dark block">Gross Salary: ₹{grossSalary.toLocaleString()}</span>
                                <span className="text-xs text-white-dark block">
                                    + Bata ₹{padiKasuNum.toLocaleString()} - Advance ₹{advanceNum.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black uppercase text-success block">Net Payable Amount</span>
                                <span className="text-3xl font-black font-mono text-success">
                                    ₹{netPayable.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase block mb-1">Remarks / Notes</label>
                            <textarea name="notes" className="form-textarea" rows={2} value={formData.notes} onChange={handleChange} placeholder="Shift or payment notes..."></textarea>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button type="button" className="btn btn-outline-danger px-6" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-8 shadow-md">
                                <IconSave className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                {editId ? 'Update Payment' : 'Save Driver Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Table */}
            {!showForm && (
                <div className="panel">
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                        <h5 className="font-bold text-lg dark:text-white-light">Driver Payment Records</h5>
                        <div className="relative w-full max-w-xs">
                            <input
                                type="text"
                                placeholder="Search driver or payment..."
                                className="form-input ltr:pr-11 rtl:pl-11"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <IconSearch className="w-5 h-5 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Driver / Vehicle</th>
                                    <th>Salary Mode</th>
                                    <th>Shift / Details</th>
                                    <th className="!text-right">Gross (₹)</th>
                                    <th className="!text-right text-warning">Padi (₹)</th>
                                    <th className="!text-right text-danger">Adv (₹)</th>
                                    <th className="!text-right text-success bg-success/5 font-black">Net Total (₹)</th>
                                    <th className="!text-center">Mode</th>
                                    <th className="!text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={10} className="text-center py-8">Loading driver payments...</td></tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr><td colSpan={10} className="text-center py-8 text-white-dark">No driver payment records found.</td></tr>
                                ) : (
                                    filteredPayments.map((pay) => {
                                        const pGross = pay.amount || 0;
                                        const pPadi = pay.padiKasu || 0;
                                        const pAdv = pay.advanceAmount || 0;
                                        const pNet = (pGross + pPadi) - pAdv;

                                        return (
                                            <tr key={pay._id}>
                                                <td className="whitespace-nowrap font-bold text-xs">
                                                    {pay.date ? new Date(pay.date).toLocaleDateString('en-GB') : '-'}
                                                </td>
                                                <td>
                                                    <div className="font-bold text-primary">{pay.driverName}</div>
                                                    <div className="text-[10px] text-white-dark">{pay.vehicleType || 'Lorry'}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        pay.paymentType === 'Shift Based' ? 'badge-outline-primary' :
                                                        pay.paymentType === 'Daily Salary' ? 'badge-outline-info' :
                                                        pay.paymentType === 'Weekly Salary' ? 'badge-outline-purple font-bold' :
                                                        pay.paymentType === 'Monthly Salary' ? 'badge-outline-success font-bold' : 'badge-outline-dark'
                                                    }`}>
                                                        {pay.paymentType || 'Shift Based'}
                                                    </span>
                                                </td>
                                                <td className="text-xs">
                                                    {pay.paymentType === 'Shift Based' ? (
                                                        <div>
                                                            <span className="font-bold">{pay.shiftType || 'Day Shift'}</span>
                                                            <div className="text-[10px] text-white-dark">
                                                                {pay.dayShiftCount > 0 && `Day: ${pay.dayShiftCount} × ₹${pay.dayShiftRate} `}
                                                                {pay.nightShiftCount > 0 && `Night: ${pay.nightShiftCount} × ₹${pay.nightShiftRate}`}
                                                            </div>
                                                        </div>
                                                    ) : pay.paymentType === 'Daily Salary' ? (
                                                        <div>{pay.daysWorked || 1} Days × ₹{pay.dailyRate || 0}</div>
                                                    ) : pay.paymentType === 'Weekly Salary' ? (
                                                        <div>{pay.weeksWorked || 1} Weeks × ₹{pay.weeklyRate || 0}</div>
                                                    ) : (
                                                        <div>Fixed</div>
                                                    )}
                                                </td>
                                                <td className="!text-right font-bold text-base font-mono">₹{pGross.toLocaleString()}</td>
                                                <td className="!text-right font-bold text-base font-mono text-warning">₹{pPadi.toLocaleString()}</td>
                                                <td className="!text-right font-bold text-base font-mono text-danger">₹{pAdv.toLocaleString()}</td>
                                                <td className="!text-right font-black text-base font-mono text-success bg-success/5">
                                                    ₹{pNet.toLocaleString()}
                                                </td>
                                                <td className="text-center text-xs font-bold">{pay.paymentMode}</td>
                                                <td className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {canEditRecord(currentUser, pay.createdAt || pay.date) ? (
                                                            <button onClick={() => handleEdit(pay)} className="btn btn-sm btn-outline-primary p-1">
                                                                <IconEdit className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-white-dark italic">Locked</span>
                                                        )}
                                                        {isOwner && (
                                                            <button onClick={() => setDeleteId(pay._id)} className="btn btn-sm btn-outline-danger p-1">
                                                                <IconTrashLines className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
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
                title="Delete Driver Payment Record"
                message="Are you sure you want to delete this driver payment record?"
            />
        </div>
    );
};

export default DriverPaymentManagement;
