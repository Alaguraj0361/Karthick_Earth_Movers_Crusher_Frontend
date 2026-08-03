'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import Swal from 'sweetalert2';

interface ProductType { _id: string; name: string; unit: string; category: string; }
interface Labour { _id: string; name: string; }
interface Vehicle { _id: string; vehicleNumber: string; }

interface ProductionOutput { productTypeId: string; quantityMT: number; }
interface RawMaterial { productTypeId: string; quantityMT: number; }

interface CrusherProductionLog {
    _id: string;
    date: string;
    crusherId?: { vehicleNumber: string };
    operator?: { name: string };
    shift: string;
    startTime?: string;
    endTime?: string;
    totalHours: number;
    dieselLiters: number;
    rawMaterialUsed: { productTypeId?: { name: string }; quantityMT: number }[];
    outputs: { productTypeId?: { name: string }; quantityMT: number }[];
    totalOutputMT: number;
    remarks?: string;
}

const EMPTY_FORM = {
    date: new Date().toISOString().split('T')[0],
    crusherId: '',
    operator: '',
    shift: 'Morning',
    startTime: '08:00',
    endTime: '17:00',
    breakTime: 30,
    startHmr: '',
    endHmr: '',
    dieselLiters: '',
    remarks: '',
};

const CrusherProductionPage = () => {
    const [form, setForm] = useState<any>(EMPTY_FORM);
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([{ productTypeId: '', quantityMT: 0 }]);
    const [outputs, setOutputs] = useState<ProductionOutput[]>([{ productTypeId: '', quantityMT: 0 }]);
    const [productions, setProductions] = useState<CrusherProductionLog[]>([]);
    const [machines, setMachines] = useState<Vehicle[]>([]);
    const [operators, setOperators] = useState<Labour[]>([]);
    const [inputProducts, setInputProducts] = useState<ProductType[]>([]);
    const [outputProducts, setOutputProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [prodRes, machRes, opRes, inProds, outProds] = await Promise.all([
                api.get('/crusher-production?'),
                api.get('/master?type=machines'),
                api.get('/labour?status=active'),
                api.get('/products?status=active&category=Input'),
                api.get('/products?status=active&category=Output'),
            ]);
            setProductions(prodRes.data.data || []);
            setMachines(machRes.data.data || []);
            setOperators(opRes.data.data || []);
            setInputProducts([...(inProds.data.data || []), ...((outProds.data.data || []).filter((p: ProductType) => p.category === 'Both'))]);
            setOutputProducts(outProds.data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const updateRawMaterial = (i: number, field: string, val: any) => {
        const updated = [...rawMaterials];
        updated[i] = { ...updated[i], [field]: val };
        setRawMaterials(updated);
    };

    const updateOutput = (i: number, field: string, val: any) => {
        const updated = [...outputs];
        updated[i] = { ...updated[i], [field]: val };
        setOutputs(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validOutputs = outputs.filter(o => o.productTypeId && o.quantityMT > 0);
        if (validOutputs.length === 0) return Swal.fire('Error', 'Add at least one output product', 'error');

        setLoading(true);
        try {
            const payload = {
                ...form,
                breakTime: parseFloat(form.breakTime) || 0,
                startHmr: parseFloat(form.startHmr) || 0,
                endHmr: parseFloat(form.endHmr) || 0,
                dieselLiters: parseFloat(form.dieselLiters) || 0,
                rawMaterialUsed: rawMaterials.filter(r => r.productTypeId && r.quantityMT > 0),
                outputs: validOutputs,
            };
            await api.post('/crusher-production', payload);
            Swal.fire('Success', 'Production log saved! Stock updated.', 'success');
            setForm(EMPTY_FORM);
            setRawMaterials([{ productTypeId: '', quantityMT: 0 }]);
            setOutputs([{ productTypeId: '', quantityMT: 0 }]);
            setShowForm(false);
            fetchAll();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to save production', 'error');
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        const res = await Swal.fire({ title: 'Delete this log?', text: 'Stock will be reversed.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete' });
        if (!res.isConfirmed) return;
        try {
            await api.delete(`/crusher-production/${id}`);
            fetchAll();
        } catch (err) { Swal.fire('Error', 'Failed to delete', 'error'); }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-lg shadow">🏗️</div>
                    <div>
                        <h1 className="text-xl font-bold">Crusher Production Log</h1>
                        <p className="text-xs text-gray-500">Daily shift-wise production tracking — auto-updates stock</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm ? '✕ Cancel' : '+ New Log'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="panel">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">New Production Entry</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date <span className="text-red-500">*</span></label>
                                <input type="date" name="date" value={form.date} onChange={handleChange} className="form-input" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Crusher Machine <span className="text-red-500">*</span></label>
                                <select name="crusherId" value={form.crusherId} onChange={handleChange} className="form-select" required>
                                    <option value="">-- Select --</option>
                                    {machines.map(m => <option key={m._id} value={m._id}>{m.vehicleNumber}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Operator <span className="text-red-500">*</span></label>
                                <select name="operator" value={form.operator} onChange={handleChange} className="form-select" required>
                                    <option value="">-- Select --</option>
                                    {operators.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Shift</label>
                                <select name="shift" value={form.shift} onChange={handleChange} className="form-select">
                                    {['Morning', 'Evening', 'Night', 'Full Day'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Time</label>
                                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Break (mins)</label>
                                <input type="number" name="breakTime" value={form.breakTime} onChange={handleChange} className="form-input" min="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Diesel (Liters)</label>
                                <input type="number" name="dieselLiters" value={form.dieselLiters} onChange={handleChange} className="form-input" step="0.1" min="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start HMR</label>
                                <input type="number" name="startHmr" value={form.startHmr} onChange={handleChange} className="form-input" step="0.1" min="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End HMR</label>
                                <input type="number" name="endHmr" value={form.endHmr} onChange={handleChange} className="form-input" step="0.1" min="0" />
                            </div>
                        </div>

                        {/* Raw Material Input */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">📥 Raw Material Used</h4>
                                <button type="button" onClick={() => setRawMaterials([...rawMaterials, { productTypeId: '', quantityMT: 0 }])} className="text-xs btn btn-outline-primary py-1">+ Add</button>
                            </div>
                            {rawMaterials.map((rm, i) => (
                                <div key={i} className="grid grid-cols-5 gap-2 mb-2">
                                    <div className="col-span-3">
                                        <select value={rm.productTypeId} onChange={e => updateRawMaterial(i, 'productTypeId', e.target.value)} className="form-select text-sm">
                                            <option value="">-- Material --</option>
                                            {inputProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <input type="number" placeholder="MT" value={rm.quantityMT || ''} onChange={e => updateRawMaterial(i, 'quantityMT', parseFloat(e.target.value) || 0)} className="form-input text-sm" step="0.01" min="0" />
                                    </div>
                                    <button type="button" onClick={() => setRawMaterials(rawMaterials.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                                </div>
                            ))}
                        </div>

                        {/* Output Products */}
                        <div className="border border-green-200 dark:border-green-800 rounded-lg p-3 bg-green-50/50 dark:bg-green-900/10">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-green-700 dark:text-green-400">📤 Output Products (Updates Stock)</h4>
                                <button type="button" onClick={() => setOutputs([...outputs, { productTypeId: '', quantityMT: 0 }])} className="text-xs btn btn-outline-success py-1">+ Add</button>
                            </div>
                            {outputs.map((o, i) => (
                                <div key={i} className="grid grid-cols-5 gap-2 mb-2">
                                    <div className="col-span-3">
                                        <select value={o.productTypeId} onChange={e => updateOutput(i, 'productTypeId', e.target.value)} className="form-select text-sm">
                                            <option value="">-- Product --</option>
                                            {outputProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <input type="number" placeholder="MT" value={o.quantityMT || ''} onChange={e => updateOutput(i, 'quantityMT', parseFloat(e.target.value) || 0)} className="form-input text-sm" step="0.01" min="0" />
                                    </div>
                                    <button type="button" onClick={() => setOutputs(outputs.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                                </div>
                            ))}
                            <div className="mt-2 text-right text-sm font-bold text-green-700 dark:text-green-400">
                                Total Output: {outputs.reduce((a, o) => a + (o.quantityMT || 0), 0).toFixed(3)} MT
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Remarks</label>
                            <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={2} className="form-textarea" />
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 font-bold">
                            {loading ? 'Saving...' : '✅ Save Production Log'}
                        </button>
                    </form>
                </div>
            )}

            {/* Production Logs Table */}
            <div className="panel p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                    Recent Production Logs ({productions.length})
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                {['Date', 'Machine', 'Operator', 'Shift', 'Hours', 'Diesel (L)', 'Outputs', 'Total MT', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {productions.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No production logs yet. Add one above.</td></tr>
                            ) : productions.map(p => (
                                <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-3 font-medium">{p.crusherId?.vehicleNumber || '—'}</td>
                                    <td className="px-4 py-3">{p.operator?.name || '—'}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-full text-xs">{p.shift}</span></td>
                                    <td className="px-4 py-3">{p.totalHours?.toFixed(1)}h</td>
                                    <td className="px-4 py-3">{p.dieselLiters || 0}L</td>
                                    <td className="px-4 py-3">
                                        {p.outputs?.map((o, i) => (
                                            <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                                                {o.productTypeId?.name}: <span className="font-bold">{o.quantityMT} MT</span>
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3 font-black text-green-600 dark:text-green-400">{p.totalOutputMT?.toFixed(3)} MT</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleDelete(p._id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CrusherProductionPage;
