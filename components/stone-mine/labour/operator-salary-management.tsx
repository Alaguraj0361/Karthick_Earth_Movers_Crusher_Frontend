'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';

const OperatorSalaryManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [operators, setOperators] = useState<any[]>([]);
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        operatorId: '',
        operatorName: '',
        machineId: '',
        hoursWorked: '',
        hourlyRate: '',
        padiKasu: '0',
        advanceAmount: '0',
        paymentMode: 'Cash',
        notes: ''
    };

    const [formData, setFormData] = useState(initialForm);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [salRes, opRes, machRes] = await Promise.all([
                api.get('/operator-salaries'),
                api.get('/labour'),
                api.get('/master/vehicles')
            ]);

            if (salRes.data.success) setSalaries(salRes.data.data);
            if (opRes.data.success) {
                // Filter ONLY for operators as requested
                setOperators(opRes.data.data.filter((l: any) => 
                    l.workType?.toLowerCase().includes('operator')
                ));
            }
            if (machRes.data.success) {
                // Filter specifically for items categorized as 'Machine' in the database
                setMachines(machRes.data.data.filter((v: any) => 
                    v.type === 'Machine'
                ));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'operatorId') {
            const op = operators.find(o => o._id === value);
            if (op) {
                setFormData(prev => ({ 
                    ...prev, 
                    operatorName: op.name,
                    hourlyRate: op.wage?.toString() || ''
                }));
            }
        }
        
        // When selecting a machine, we can also suggest the operator name assigned to it
        if (name === 'machineId' && !formData.operatorId) {
            const mach = machines.find(m => m._id === value);
            if (mach && mach.operatorName) {
                setFormData(prev => ({ ...prev, operatorName: mach.operatorName }));
            }
        }
    };

    const totalAmount = (Number(formData.hoursWorked || 0) * Number(formData.hourlyRate || 0)) + Number(formData.padiKasu || 0) - Number(formData.advanceAmount || 0);

    const resetForm = () => {
        setFormData(initialForm);
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                hoursWorked: Number(formData.hoursWorked),
                hourlyRate: Number(formData.hourlyRate),
                padiKasu: Number(formData.padiKasu || 0),
                advanceAmount: Number(formData.advanceAmount || 0),
                totalAmount
            };

            if (editId) {
                await api.put(`/operator-salaries/${editId}`, payload);
            } else {
                await api.post('/operator-salaries', payload);
            }

            Swal.fire({ title: 'Success', text: `Salary record ${editId ? 'updated' : 'added'} successfully`, icon: 'success' });
            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            Swal.fire({ title: 'Error', text: 'Something went wrong', icon: 'error' });
        }
    };

    const handleEdit = (rec: any) => {
        setFormData({
            date: rec.date.split('T')[0],
            operatorId: rec.operatorId?._id || '',
            operatorName: rec.operatorName,
            machineId: rec.machineId?._id || '',
            hoursWorked: rec.hoursWorked.toString(),
            hourlyRate: rec.hourlyRate.toString(),
            padiKasu: rec.padiKasu.toString(),
            advanceAmount: rec.advanceAmount.toString(),
            paymentMode: rec.paymentMode,
            notes: rec.notes || ''
        });
        setEditId(rec._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        const res = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (res.isConfirmed) {
            try {
                await api.delete(`/operator-salaries/${id}`);
                Swal.fire('Deleted!', 'Record has been deleted.', 'success');
                fetchData();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Failed to delete', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold dark:text-white-light">Machine Operator Salary (Hourly Based)</h2>
                <button onClick={() => setShowForm(true)} className="btn btn-primary gap-2">
                    <IconPlus /> Add Salary Record
                </button>
            </div>

            {showForm && (
                <div className="panel animate__animated animate__fadeIn max-w-3xl mx-auto shadow-lg border-primary/20">
                    <div className="flex items-center justify-between mb-5 border-b pb-3">
                        <h5 className="font-bold text-lg text-primary">{editId ? 'Edit Salary Record' : 'Record Operator Salary'}</h5>
                        <button onClick={resetForm} className="text-white-dark hover:text-danger hover:scale-110 transition-transform"><IconX /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm font-black uppercase text-white-dark mb-2 block">Date</label>
                                <input type="date" name="date" className="form-input font-bold" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-sm font-black uppercase text-white-dark mb-2 block">Select Machine</label>
                                <select name="machineId" className="form-select font-bold text-info" value={formData.machineId} onChange={handleChange} required>
                                    <option value="">Choose Machine</option>
                                    {machines.map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.vehicleNumber || m.registrationNumber})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm font-black uppercase text-white-dark mb-2 block text-primary">Operator Name</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <select 
                                            name="operatorId" 
                                            className="form-select border-primary font-bold" 
                                            value={formData.operatorId} 
                                            onChange={handleChange}
                                        >
                                            <option value="">Select from Labour List (Optional)</option>
                                            {operators.map(o => (
                                                <option key={o._id} value={o._id}>{o.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <input 
                                            type="text" 
                                            name="operatorName" 
                                            className="form-input border-primary font-bold" 
                                            value={formData.operatorName} 
                                            onChange={handleChange} 
                                            placeholder="Or enter name manually"
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-black uppercase text-white-dark mb-2 block">Payment Mode</label>
                                <select name="paymentMode" className="form-select font-bold" value={formData.paymentMode} onChange={handleChange} required>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="UPI/G-Pay">UPI / G-Pay</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-dashed border-white-dark/30">
                            <div>
                                <label className="text-[11px] font-black uppercase text-white-dark mb-1 block">Hours Worked</label>
                                <input type="number" name="hoursWorked" className="form-input font-black text-lg text-info text-center" value={formData.hoursWorked} onChange={handleChange} required step="0.5" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase text-white-dark mb-1 block">Hourly Rate (₹)</label>
                                <input type="number" name="hourlyRate" className="form-input font-black text-lg text-primary text-center" value={formData.hourlyRate} onChange={handleChange} required placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase text-white-dark mb-1 block">Padi Kasu (₹)</label>
                                <input type="number" name="padiKasu" className="form-input font-black text-lg text-warning text-center" value={formData.padiKasu} onChange={handleChange} placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase text-white-dark mb-1 block text-danger">Advance (₹)</label>
                                <input type="number" name="advanceAmount" className="form-input font-black text-lg text-danger text-center" value={formData.advanceAmount} onChange={handleChange} placeholder="0" />
                            </div>
                        </div>

                        <div className="bg-success/5 p-4 rounded-xl border border-success/20 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-xs font-bold text-white-dark uppercase tracking-widest">Total Payable Amount</p>
                                <p className="text-[10px] italic text-white-dark mt-1">({formData.hoursWorked || 0} hrs × ₹{formData.hourlyRate || 0}) + ₹{formData.padiKasu || 0} Padi - ₹{formData.advanceAmount || 0} Adv</p>
                            </div>
                            <div className="text-3xl font-black text-success font-mono">₹{totalAmount.toLocaleString()}</div>
                        </div>

                        <div>
                            <label className="text-sm font-black uppercase text-white-dark mb-2 block tracking-widest opacity-50">Remarks / Notes</label>
                            <textarea name="notes" className="form-textarea font-bold" value={formData.notes} onChange={handleChange} placeholder="Any specific details..."></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white-dark/10">
                            <button type="button" onClick={resetForm} className="btn btn-outline-danger uppercase font-black tracking-widest text-xs">Cancel</button>
                            <button type="submit" className="btn btn-primary uppercase font-black tracking-widest text-xs min-w-[150px] shadow-md shadow-primary/30">Save Record</button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <div className="panel shadow-lg">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-black text-lg uppercase tracking-widest text-white-dark opacity-70">Salary History</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover table-striped">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-black uppercase text-[11px] font-black text-white-dark">
                                    <th>Date</th>
                                    <th>Operator</th>
                                    <th>Machine</th>
                                    <th className="text-center font-mono">Hours</th>
                                    <th className="text-right">Rate</th>
                                    <th className="text-right">Padi</th>
                                    <th className="text-right text-danger">Adv</th>
                                    <th className="text-right text-success bg-success/5 font-black text-sm">Total (₹)</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.map((s, idx) => (
                                    <tr key={s._id} className="group border-b border-white-dark/10 hover:bg-primary/5 transition-colors">
                                        <td className="font-bold text-xs">{new Date(s.date).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm uppercase">{s.operatorName}</span>
                                                <span className="text-[10px] text-white-dark font-bold uppercase tracking-tighter">{s.operatorId?.workType || 'Operator'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs">{s.machineId?.name || 'N/A'}</span>
                                                <span className="text-[9px] font-black text-info border border-info/30 px-1 rounded inline-block w-fit mt-0.5">{s.machineId?.vehicleNumber || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="text-center font-black text-sm font-mono text-info">{s.hoursWorked}</td>
                                        <td className="text-right font-bold text-xs">₹{s.hourlyRate.toLocaleString()}</td>
                                        <td className="text-right font-bold text-xs text-warning">₹{s.padiKasu.toLocaleString()}</td>
                                        <td className="text-right font-bold text-xs text-danger">₹{s.advanceAmount.toLocaleString()}</td>
                                        <td className="text-right font-black text-lg font-mono text-success bg-success/5 tracking-tighter">₹{s.totalAmount.toLocaleString()}</td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(s)} className="text-info hover:scale-110 transition-transform"><IconEdit /></button>
                                                <button onClick={() => handleDelete(s._id)} className="text-danger hover:scale-110 transition-transform"><IconTrashLines /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {salaries.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-20 text-white-dark font-black uppercase text-xs opacity-30 italic">No salary records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatorSalaryManagement;
