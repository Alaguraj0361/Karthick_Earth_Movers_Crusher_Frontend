'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import IconPlus from '@/components/icon/icon-plus';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import IconPrinter from '@/components/icon/icon-printer';
import IconEye from '@/components/icon/icon-eye';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';

const BlastingCalculation = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const role = currentUser?.role?.toLowerCase();
    const { showToast } = useToast();
    const [materials, setMaterials] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [summary, setSummary] = useState<any | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ items: [{ material: '', ratePerTon: '' }], fromDate: '', toDate: '', notes: '' });
    const [previewTons, setPreviewTons] = useState(0);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [minDate, setMinDate] = useState('');

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [matRes, recRes] = await Promise.all([api.get('/blasting/materials'), api.get('/blasting/records')]);
            if (matRes.data.success) setMaterials(matRes.data.data);
            if (recRes.data.success) setRecords(recRes.data.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    useEffect(() => {
        const fetchPreview = async () => {
            const materialIds = formData.items.map(i => i.material).filter(id => id);
            if (materialIds.length > 0 && formData.fromDate && formData.toDate) {
                setPreviewLoading(true);
                try {
                    const res = await api.get(`/blasting/records/preview?materials=${materialIds.join(',')}&fromDate=${formData.fromDate}&toDate=${formData.toDate}`);
                    if (res.data.success) setPreviewTons(res.data.data.totalTons);
                } catch (e) { console.error(e); } finally { setPreviewLoading(false); }
            } else {
                setPreviewTons(0);
            }
        };
        fetchPreview();
    }, [formData.items, formData.fromDate, formData.toDate]);

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'material') {
            const mat = materials.find((m: any) => m._id === value);
            newItems[index].ratePerTon = mat ? mat.blastingRatePerTon : '';

            // Recalculate minDate based on all selected materials
            const allSelected = newItems.map(i => i.material).filter(id => id);
            if (allSelected.length > 0) {
                const relevantRecords = records.filter(r => {
                    const rMatIds = r.items?.map((item: any) => item.material?._id) || [r.material?._id];
                    return rMatIds.some((id: string) => allSelected.includes(id));
                });
                if (relevantRecords.length > 0) {
                    const latest = relevantRecords.sort((a, b) => new Date(b.toDate).getTime() - new Date(a.toDate).getTime())[0];
                    const lastDate = new Date(latest.toDate);
                    lastDate.setDate(lastDate.getDate() + 1);
                    setMinDate(lastDate.toISOString().split('T')[0]);
                } else {
                    setMinDate('');
                }
            } else {
                setMinDate('');
            }
        }
        setFormData(p => ({ ...p, items: newItems }));
    };

    const addItem = () => setFormData(p => ({ ...p, items: [...p.items, { material: '', ratePerTon: '' }] }));
    const removeItem = (index: number) => setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));

    const reset = () => {
        setFormData({ items: [{ material: '', ratePerTon: '' }], fromDate: '', toDate: '', notes: '' });
        setShowForm(false);
        setPreviewTons(0);
        setMinDate('');
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (minDate && formData.fromDate < minDate) {
            showToast(`Error: From Date must be after ${new Date(minDate).toLocaleDateString()}`, 'error');
            return;
        }
        try {
            await api.post('/blasting/records', formData);
            showToast(`Blasting record created!`, 'success');
            reset(); fetchAll();
        } catch (err: any) { showToast(err.response?.data?.message || 'Error creating record', 'error'); }
    };

    const loadSummary = async (record: any) => {
        setSelectedRecord(record);
        try {
            const res = await api.get(`/blasting/records/${record._id}/summary`);
            if (res.data.success) setSummary(res.data.data);
        } catch (e) { showToast('Failed to load summary', 'error'); }
    };

    const confirmDelete = async () => {
        try { await api.delete(`/blasting/records/${deleteId}`); showToast('Record deleted', 'success'); fetchAll(); if (selectedRecord?._id === deleteId) { setSelectedRecord(null); setSummary(null); } }
        catch (e) { showToast('Error deleting', 'error'); } finally { setDeleteId(null); }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const totalDeductions = summary.totalAdvance + summary.dieselTotal + summary.explosiveTotal;
        const materialNames = summary.record.items?.map((i: any) => i.material?.name).join(', ') || summary.record.material?.name;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Blasting Summary - ${materialNames}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; font-size: 13px; line-height: 1.6; }
                        .print-container { position: relative; overflow: hidden; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; pointer-events: none; z-index: 0; width: 450px; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; position: relative; z-index: 1; }
                        .company-name { font-size: 24px; font-weight: bold; color: #e79b21; margin: 0; }
                        .report-title { font-size: 20px; font-weight: bold; color: #555; text-transform: uppercase; letter-spacing: 2px; }
                        .info-grid { display: grid; grid-template-cols: 1fr; gap: 25px; margin-bottom: 30px; position: relative; z-index: 1; }
                        .info-section h4 { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
                        .info-table { width: 100%; }
                        .info-table td { padding: 3px 0; }
                        .label { color: #888; width: 100px; }
                        .value { font-weight: bold; text-align: right; }
                        table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; position: relative; z-index: 1; }
                        table.items-table th { background: #e79b21; color: white; padding: 10px 15px; text-align: left; font-size: 11px; text-transform: uppercase; }
                        table.items-table td { padding: 10px 15px; border-bottom: 1px solid #eee; }
                        .totals-container { display: flex; justify-content: flex-end; margin-bottom: 40px; position: relative; z-index: 1; }
                        .totals-box { min-width: 300px; }
                        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
                        .grand-total { font-size: 18px; font-weight: bold; color: #e79b21; border-top: 2px solid #e79b21; margin-top: 10px; padding-top: 10px; }
                        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 110px; position: relative; z-index: 1; }
                        .signature-box { text-align: center; width: 200px; }
                        .signature-line { border-top: 1px solid #ccc; padding-top: 8px; font-size: 12px; color: #888; }
                    img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .stamp-img { 
                        width: 180px; 
                        position: absolute; 
                        top: -50px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        mix-blend-mode: multiply !important;
                        filter: grayscale(1) contrast(8) brightness(3);
                        -webkit-print-color-adjust: exact !important;
                    }
                    @media print { 
                        body { padding: 0; } 
                        .print-container { border: none; } 
                        .stamp-img { mix-blend-mode: multiply !important; }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <img src="/assets/images/logo.png" class="watermark" alt="watermark" />
                    <div class="header">
                        <div>
                            <h1 class="report-title">Blasting Summary Report</h1>
                            <p style="color: #888; font-size: 12px; margin-top: 4px;">Period: ${new Date(summary.record.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(summary.record.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div style="text-align: right">
                            <img src="/assets/images/logo.png" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;" />
                            <h2 class="company-name">Karthick Earth Movers</h2>
                            <p style="font-size: 11px; color: #888;">Stone Quarry & Transport Unit</p>
                            <p style="font-size: 11px; color: #e79b21; font-weight: bold;">GST: 33AVFPK9827P2ZV</p>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-section">
                            <h4>Record Details</h4>
                            <table class="info-table" style="width: 100%;">
                                <tr>
                                    <td class="label" style="width: 15%;">Materials:</td>
                                    <td class="value" style="text-align: left; width: 35%;">${materialNames}</td>
                                    <td class="label" style="text-align: right; width: 30%;">Generated Date:</td>
                                    <td class="value" style="width: 20%;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td class="label" style="width: 15%;">Total Tons:</td>
                                    <td class="value" style="text-align: left; width: 35%;">${summary.record.totalTons?.toFixed(2)} T</td>
                                    <td class="label" style="text-align: right; width: 30%;">Total Items:</td>
                                    <td class="value" style="width: 20%;">${summary.record.items?.length || 1}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <h4 style="font-size: 11px; text-transform: uppercase; color: #e79b21; letter-spacing: 1px; margin-bottom: 10px;">Material & Revenue Breakdown</h4>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Material Name</th>
                                <th style="text-align: right">Tons</th>
                                <th style="text-align: right">Rate (₹)</th>
                                <th style="text-align: right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(summary.record.items || [{ material: summary.record.material, totalTons: summary.record.totalTons, ratePerTon: summary.record.ratePerTon, amount: summary.record.totalAmount }]).map((item: any, idx: number) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${item.material?.name || 'Unknown'}</td>
                                    <td style="text-align: right">${item.totalTons?.toFixed(2)} T</td>
                                    <td style="text-align: right">₹${item.ratePerTon}</td>
                                    <td style="text-align: right; font-weight: bold;">₹${item.amount?.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <h4 style="font-size: 11px; text-transform: uppercase; color: #e7515a; letter-spacing: 1px; margin-bottom: 10px;">Expenses & Deductions</h4>
                    <table class="items-table">
                        <thead>
                            <tr><th>Category</th><th style="text-align: right">Amount (₹)</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Total Advance Paid</td><td style="text-align: right">₹${summary.totalAdvance.toLocaleString()}</td></tr>
                            <tr><td>Diesel (Blasting)</td><td style="text-align: right">₹${summary.dieselTotal.toLocaleString()}</td></tr>
                            <tr><td>Explosive Shop Payments</td><td style="text-align: right">₹${summary.explosiveTotal.toLocaleString()}</td></tr>
                        </tbody>
                    </table>

                    <div class="totals-container">
                        <div class="totals-box">
                            <div class="total-row"><span style="color: #888">Gross Revenue</span><span style="font-weight: bold">₹${summary.record.totalAmount.toLocaleString()}</span></div>
                            <div class="total-row"><span style="color: #e7515a">Total Deductions</span><span style="font-weight: bold; color: #e7515a">- ₹${totalDeductions.toLocaleString()}</span></div>
                            <div class="total-row grand-total"><span>Net Payable Balance</span><span>₹${summary.finalAmount.toLocaleString()}</span></div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="signature-box">
                            <div class="signature-line">Recipient Signature</div>
                        </div>
                        <div class="signature-box" style="position: relative;">
                            <img src="/assets/images/Karthick-Earthmovers-owner-sign.jpeg" class="stamp-img" alt="Sign" />
                            <div class="signature-line" style="margin-top: 30px;">Authorized Signature</div>
                        </div>
                    </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    if (selectedRecord && summary) {
        const { record, totalAdvance, explosiveTotal, dieselTotal, finalAmount } = summary;
        const materialNames = record.items?.map((i: any) => i.material?.name).join(', ') || record.material?.name;
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => { setSelectedRecord(null); setSummary(null); fetchAll(); }}>← Back to Records</button>
                    <h5 className="font-bold text-lg">{materialNames} — {new Date(record.fromDate).toLocaleDateString()} to {new Date(record.toDate).toLocaleDateString()}</h5>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        {role === 'owner' && (
                            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handlePrint}>
                                <IconPrinter className="w-4 h-4" /> Print / Download PDF
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Tons', value: `${record.totalTons?.toFixed(2)} T`, color: 'primary', icon: '⚖️' },
                        { label: 'Rate / Ton', value: record.items?.length > 1 ? 'Mixed Rates' : `₹${record.items?.[0]?.ratePerTon || record.ratePerTon || '0'}`, color: 'info', icon: '📊' },
                        { label: 'Total Amount', value: `₹${record.totalAmount?.toLocaleString()}`, color: 'success', icon: '💰' },
                        { label: 'Final Balance', value: `₹${finalAmount?.toLocaleString()}`, color: finalAmount >= 0 ? 'success' : 'danger', icon: finalAmount >= 0 ? '✅' : '⚠️' },
                    ].map(stat => (
                        <div key={stat.label} className={`panel bg-${stat.color}/10 border border-${stat.color}/20`}>
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className={`text-xl font-bold text-${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-white-dark mt-1 uppercase">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="panel">
                    <div className="flex items-center justify-between mb-3">
                        <h6 className="font-bold uppercase text-sm text-white-dark">📉 Deduction Summary</h6>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-warning/10 rounded-lg p-3 text-center border border-warning/20">
                            <div className="text-xs uppercase text-warning mb-1">Advance Paid</div>
                            <div className="text-xl font-bold text-warning">₹{totalAdvance?.toLocaleString()}</div>
                        </div>
                        <div className="bg-info/10 rounded-lg p-3 text-center border border-info/20">
                            <div className="text-xs uppercase text-info mb-1">Diesel (Blasting)</div>
                            <div className="text-xl font-bold text-info">₹{dieselTotal?.toLocaleString()}</div>
                        </div>
                        <div className="bg-danger/10 rounded-lg p-3 text-center border border-danger/20">
                            <div className="text-xs uppercase text-danger mb-1">Explosive Shop</div>
                            <div className="text-xl font-bold text-danger">₹{explosiveTotal?.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {summary.advances?.length > 0 && (
                    <div className="panel">
                        <h6 className="font-bold text-sm uppercase text-warning mb-3">💰 Linked Advances</h6>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead><tr><th>Date</th><th>Notes</th><th className="text-right">Amount</th></tr></thead>
                                <tbody>
                                    {summary.advances.map((a: any) => (
                                        <tr key={a._id}>
                                            <td>{new Date(a.date).toLocaleDateString()}</td>
                                            <td className="text-white-dark">{a.notes || '—'}</td>
                                            <td className="text-right font-bold text-warning">₹{a.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showForm && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h6 className="font-bold text-primary">New Blasting Calculation</h6>
                        <button onClick={reset}><IconX className="w-4 h-4 text-white-dark" /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="panel">
                                <div className="flex items-center justify-between mb-4">
                                    <h6 className="font-bold text-xs uppercase tracking-widest text-primary">Material Breakdown</h6>
                                    <button type="button" className="btn btn-outline-primary btn-xs" onClick={addItem}>+ Add Another Material</button>
                                </div>
                                <div className="space-y-4">
                                    {formData.items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-primary/10 pb-4 last:border-0 last:pb-0 items-end">
                                            <div className="md:col-span-6">
                                                <label className="text-[10px] font-bold uppercase mb-1 block">Material {idx + 1} *</label>
                                                <select className="form-select" required value={item.material} onChange={e => handleItemChange(idx, 'material', e.target.value)}>
                                                    <option value="">Select Material</option>
                                                    {materials.map(m => <option key={m._id} value={m._id}>{m.name} - ₹{m.blastingRatePerTon}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-5">
                                                <label className="text-[10px] font-bold uppercase mb-1 block">Blasting Rate (₹/T) *</label>
                                                <input type="number" className="form-input" required value={item.ratePerTon} onChange={e => handleItemChange(idx, 'ratePerTon', e.target.value)} />
                                            </div>
                                            <div className="md:col-span-1">
                                                {formData.items.length > 1 && (
                                                    <button type="button" className="btn btn-outline-danger btn-sm p-1.5 w-full" onClick={() => removeItem(idx)}><IconTrash className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold uppercase mb-1 block">From Date *</label><input type="date" className="form-input" required min={minDate} value={formData.fromDate} onChange={e => setFormData(p => ({ ...p, fromDate: e.target.value }))} /></div>
                                <div><label className="text-xs font-bold uppercase mb-1 block">To Date *</label><input type="date" className="form-input" required value={formData.toDate} onChange={e => setFormData(p => ({ ...p, toDate: e.target.value }))} /></div>
                                <div className="md:col-span-2"><label className="text-xs font-bold uppercase mb-1 block">Notes</label><input type="text" className="form-input" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" className="btn btn-outline-danger" onClick={reset}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={previewLoading}>{previewLoading ? '⌛ Calculating...' : `Calculate & Save (${previewTons.toFixed(2)} T)`}</button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <>
                    <div className="flex items-center justify-between">
                        <h6 className="font-bold text-sm uppercase text-primary">💣 Blasting Records</h6>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><IconPlus className="ltr:mr-1" /> New Blasting Record</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Period</th><th>Material</th><th className="text-center">Total Tons</th><th className="text-right">Total Amount</th><th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (<tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>) : records.map(r => (
                                    <tr key={r._id} onClick={() => loadSummary(r)}>
                                        <td>{new Date(r.fromDate).toLocaleDateString()} to {new Date(r.toDate).toLocaleDateString()}</td>
                                        <td className="font-bold">{r.items?.map((i: any) => i.material?.name).join(', ') || r.material?.name}</td>
                                        <td className="text-center">{r.totalTons?.toFixed(2)} T</td>
                                        <td className="text-right font-bold text-success">₹{r.totalAmount?.toLocaleString()}</td>
                                        <td className="text-center" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1.5 rounded-lg border border-info/30 text-info hover:bg-info/10 transition-all" onClick={() => loadSummary(r)}><IconEye className="w-4.5 h-4.5" /></button>
                                                <button className="p-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-all" onClick={() => setDeleteId(r._id)}><IconTrash className="w-4.5 h-4.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            <DeleteConfirmModal show={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete Blasting Record" message="This will delete linked data too." />
        </div>
    );
};

export default BlastingCalculation;
