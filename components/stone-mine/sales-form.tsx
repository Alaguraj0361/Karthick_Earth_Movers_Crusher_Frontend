'use client';
import React, { useState, useEffect } from 'react';
import IconSave from '@/components/icon/icon-save';
import IconX from '@/components/icon/icon-x';
import IconEdit from '@/components/icon/icon-edit';
import IconPlus from '@/components/icon/icon-plus';

import { useToast } from '@/components/stone-mine/toast-notification';
import api from '@/utils/api';

const SalesForm = () => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        vehicleNumber: '',
        vehicleType: '',
        paymentStatus: 'Paid',
        description: '',
    });

    const [sources, setSources] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [vehicleCategories, setVehicleCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [srcRes, custRes, vehRes, catRes] = await Promise.all([
                    api.get('/master/income-sources'),
                    api.get('/master/customers'),
                    api.get('/master/vehicles'),
                    api.get('/master/vehicle-categories')
                ]);

                if (srcRes.data.success) {
                    setSources(srcRes.data.data);
                    if (srcRes.data.data.length > 0) setFormData(prev => ({ ...prev, source: srcRes.data.data[0].name }));
                }
                if (custRes.data.success) setCustomers(custRes.data.data);
                if (vehRes.data.success) setVehicles(vehRes.data.data);
                if (catRes.data.success) setVehicleCategories(catRes.data.data);
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };
        fetchMasterData();
    }, []);

    const uniqueVehicleTypes = Array.from(new Set(vehicles.map((v) => v.category || 'Other').filter(Boolean)));
    const filteredVehicles = !formData.vehicleType || formData.vehicleType === 'All'
        ? vehicles
        : vehicles.filter((v) => v.category === formData.vehicleType);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'vehicleType') {
                updated.vehicleNumber = '';
            }
            if (name === 'vehicleNumber') {
                const selectedVehicle = vehicles.find(v => (v.vehicleNumber || v.name) === value);
                if (selectedVehicle && selectedVehicle.category) {
                    updated.vehicleType = selectedVehicle.category;
                }
            }
            return updated;
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            // Combine type and number for description or status if needed, 
            // but for income we might just store the number.
            // Let's stick to the current schema but offer better selection.
            const { data } = await api.post('/income', formData);
            if (data.success) {
                showToast('Income recorded successfully!', 'success');
                setFormData({
                    source: sources.length > 0 ? sources[0].name : '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    customerName: '',
                    vehicleNumber: '',
                    vehicleType: '',
                    paymentStatus: 'Paid',
                    description: '',
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="panel">
            <div className="mb-8 flex items-center justify-between border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-5">
                <div>
                    <h5 className="text-xl font-bold dark:text-white-light">புதிய விற்பனை/வருமானம் (New Sales/Income Record)</h5>
                    <p className="text-white-dark text-xs mt-1">Record incoming payments and sales transactions</p>
                </div>
            </div>

            <form className="max-w-4xl mx-auto space-y-8" onSubmit={handleSubmit}>
                {/* Section 1: Transaction Details */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                        <IconSave className="w-4 h-4" />
                        Transaction Details
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">வகை (Income Source)</label>
                            <select id="source" name="source" className="form-select border-primary" value={formData.source} onChange={handleChange}>
                                {sources.map((src) => (
                                    <option key={src._id} value={src.name}>
                                        {src.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">தேதி (Date)</label>
                            <input id="date" type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Entity Information */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                        <IconEdit className="w-4 h-4" />
                        Entity Information
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">வாடிக்கையாளர் (Customer Name)</label>
                            <select id="customerName" name="customerName" className="form-select" value={formData.customerName} onChange={handleChange}>
                                <option value="">Select Customer</option>
                                {customers.map((cust) => (
                                    <option key={cust._id} value={cust.name}>
                                        {cust.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">வாகனம் வகை (Vehicle Type)</label>
                            <select id="vehicleType" name="vehicleType" className="form-select" value={formData.vehicleType} onChange={handleChange}>
                                <option value="All">All Types</option>
                                {vehicleCategories.map((cat: any) => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        {formData.vehicleType && (
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block text-primary">வாகன எண் (Vehicle No)</label>
                                <select id="vehicleNumber" name="vehicleNumber" className="form-select border-primary bg-primary/5" value={formData.vehicleNumber} onChange={handleChange}>
                                    <option value="">Select Number / ID</option>
                                    {filteredVehicles.map((v: any) => (
                                        <option key={v._id} value={v.vehicleNumber || v.name}>
                                            {v.vehicleNumber ? `${v.vehicleNumber}` : v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Financials & Description */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                        <IconEdit className="w-4 h-4" />
                        Financials & Remarks
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">தொகை (Gross Amount)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
                                <input id="amount" type="number" name="amount" placeholder="0.00" className="form-input pl-8 font-bold text-lg border-primary text-primary" value={formData.amount} onChange={handleChange} required />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">நிலை (Payment Status)</label>
                            <select id="paymentStatus" name="paymentStatus" className="form-select" value={formData.paymentStatus} onChange={handleChange}>
                                <option value="Paid">Paid (செலுத்தப்பட்டது)</option>
                                <option value="Pending">Pending (நிலுவை)</option>
                                <option value="Partial">Partial (பகுதி)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-white-dark uppercase mb-2 block">குறிப்பு (Description / Remarks)</label>
                        <textarea id="description" name="description" rows={3} className="form-textarea min-h-[100px]" placeholder="Enter additional details about this sale..." value={formData.description} onChange={handleChange}></textarea>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-8 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                    <button type="button" className="btn btn-outline-danger px-8" onClick={() => setFormData(prev => ({ ...prev, amount: '', description: '' }))}>
                        Reset Form
                    </button>
                    <button type="submit" className="btn btn-primary px-10 shadow-lg shadow-primary/20">
                        <IconSave className="ltr:mr-2 rtl:ml-2" />
                        Save Record
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SalesForm;
