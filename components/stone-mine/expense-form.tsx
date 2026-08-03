'use client';
import React, { useState, useEffect } from 'react';
import IconSave from '@/components/icon/icon-save';
import IconX from '@/components/icon/icon-x';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';

import { useToast } from '@/components/stone-mine/toast-notification';
import api from '@/utils/api';

const ExpenseForm = () => {
    const { showToast } = useToast();
    // ... logic remains same ...
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        vehicleOrMachine: '',
        vehicleType: '',
        vehicleNumber: '',
        quantity: '',
        rate: '',
        paymentMode: 'Cash',
    });

    const [categories, setCategories] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [catRes, vehRes] = await Promise.all([
                    api.get('/master/expense-categories'),
                    api.get('/master/vehicles')
                ]);

                if (catRes.data.success) {
                    setCategories(catRes.data.data);
                    if (catRes.data.data.length > 0) {
                        setFormData(prev => ({ ...prev, category: catRes.data.data[0].name }));
                    }
                }
                if (vehRes.data.success) setVehicles(vehRes.data.data);
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };
        fetchMasterData();
    }, []);

    const uniqueVehicleTypes = Array.from(new Set(vehicles.map((v) => v.name)));
    const filteredVehicles = vehicles.filter((v) => v.name === formData.vehicleType);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === 'vehicleType') {
                updated.vehicleNumber = '';
                updated.vehicleOrMachine = value;
            }

            if (name === 'vehicleNumber') {
                updated.vehicleOrMachine = prev.vehicleType + (value ? ` (${value})` : '');
            }

            return updated;
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/expenses', formData);
            if (data.success) {
                showToast('Expense added successfully!', 'success');
                setFormData({
                    category: categories.length > 0 ? categories[0].name : '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    vehicleOrMachine: '',
                    vehicleType: '',
                    vehicleNumber: '',
                    quantity: '',
                    rate: '',
                    paymentMode: 'Cash',
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
                    <h5 className="text-xl font-bold dark:text-white-light">புதிய செலவு பதிவு (New Expense Entry)</h5>
                    <p className="text-white-dark text-xs mt-1">Add general industrial and office expenses</p>
                </div>
            </div>

            <form className="max-w-4xl mx-auto space-y-8" onSubmit={handleSubmit}>
                {/* Section 1: General Information */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                        <IconPlus className="w-4 h-4" />
                        General Information
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">வகை (Expense Category)</label>
                            <select id="category" name="category" className="form-select border-primary" value={formData.category} onChange={handleChange}>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">தேதி (Transaction Date)</label>
                            <input id="date" type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">தொகை (Gross Amount)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
                                <input id="amount" type="number" name="amount" placeholder="0.00" className="form-input pl-8 font-bold text-lg border-primary text-primary" value={formData.amount} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Conditional Details (Vehicle/Machine) */}
                {formData.category === 'Diesel' && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                            <IconEdit className="w-4 h-4" />
                            Vehicle & Machine Details
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">அளவு (Litres)</label>
                                <input id="quantity" type="number" name="quantity" placeholder="Enter litres..." className="form-input" value={formData.quantity} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">வாகனம் வகை (Type)</label>
                                <select id="vehicleType" name="vehicleType" className="form-select" value={formData.vehicleType} onChange={handleChange}>
                                    <option value="">Select Type</option>
                                    {uniqueVehicleTypes.map((type: string) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {formData.vehicleType && filteredVehicles.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block text-primary">வாகன எண் (Vehicle ID)</label>
                                    <select id="vehicleNumber" name="vehicleNumber" className="form-select border-primary bg-primary/5" value={formData.vehicleNumber} onChange={handleChange}>
                                        <option value="">Select Number</option>
                                        {filteredVehicles.map((v: any) => (
                                            <option key={v._id} value={v.vehicleNumber}>
                                                {v.vehicleNumber || 'No Number'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Section 3: Description */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                        <IconEdit className="w-4 h-4" />
                        Additional Information
                    </div>
                    <div>
                        <label className="text-xs font-bold text-white-dark uppercase mb-2 block">விவரம் (Description / Remarks)</label>
                        <textarea id="description" name="description" rows={3} className="form-textarea min-h-[100px]" placeholder="Enter any additional details about this expense..." value={formData.description} onChange={handleChange}></textarea>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-8 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                    <button type="button" className="btn btn-outline-danger px-8" onClick={() => setFormData(prev => ({ ...prev, amount: '', description: '' }))}>
                        Reset Form
                    </button>
                    <button type="submit" className="btn btn-primary px-10 shadow-lg shadow-primary/20">
                        <IconSave className="ltr:mr-2 rtl:ml-2" />
                        Save Expense
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
