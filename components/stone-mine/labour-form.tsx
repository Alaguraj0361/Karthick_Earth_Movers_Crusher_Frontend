'use client';
import React, { useState } from 'react';
import IconSave from '@/components/icon/icon-save';
import { useToast } from '@/components/stone-mine/toast-notification';

const LabourForm = () => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Full Day',
        overtime: 0,
        advancedAmount: 0,
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        showToast('Labour data saved locally', 'info');
    };

    return (
        <div className="panel">
            <div className="mb-5 flex items-center justify-between">
                <h5 className="text-lg font-semibold dark:text-white-light">தொழிலாளர் வருகை & கூலி (Labour Attendance & Wages)</h5>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name">பெயர் (Name)</label>
                        <input id="name" type="text" name="name" placeholder="Labour Name" className="form-input" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="date">தேதி (Date)</label>
                        <input id="date" type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label htmlFor="status">வகை (Status)</label>
                        <select id="status" name="status" className="form-select" value={formData.status} onChange={handleChange}>
                            <option value="Full Day">Full Day (முழு நாள்)</option>
                            <option value="Half Day">Half Day (அரை நாள்)</option>
                            <option value="Absent">Absent (விடுமுறை)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="overtime">கூடுதல் நேரம் (Overtime - Hrs)</label>
                        <input id="overtime" type="number" name="overtime" placeholder="0" className="form-input" value={formData.overtime} onChange={handleChange} />
                    </div>
                    <div>
                        <label htmlFor="advancedAmount">முன்பணம் (Advance ₹)</label>
                        <input id="advancedAmount" type="number" name="advancedAmount" placeholder="0" className="form-input" value={formData.advancedAmount} onChange={handleChange} />
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <button type="submit" className="btn btn-primary gap-2">
                        <IconSave className="h-5 w-5" />
                        Save Attendance
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LabourForm;
