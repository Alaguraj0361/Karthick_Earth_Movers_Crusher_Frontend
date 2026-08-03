'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconEye from '@/components/icon/icon-eye';
import IconX from '@/components/icon/icon-x';
import IconPrinter from '@/components/icon/icon-printer';
import IconSave from '@/components/icon/icon-save';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import api, { getFileUrl } from '@/utils/api';

const QuarryLeaseManagement = () => {
    const { showToast } = useToast();
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);

    // Form / Calculator State
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [materialRates, setMaterialRates] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');

    // Find latest settlement end date to prevent overlapping
    const maxEndDate = settlements.reduce((max, s) => {
        const end = new Date(s.endDate).getTime();
        return end > max ? end : max;
    }, 0);
    const minStartDate = maxEndDate > 0 ? new Date(maxEndDate + 86400000).toISOString().split('T')[0] : '';

    // Fetched Data for calculation
    const [trips, setTrips] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/quarry-lease/settlements');
            if (res.data.success) setSettlements(res.data.data);
        } catch (error) {
            showToast('Failed to load settlements', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCalculationData = async () => {
        if (!startDate || !endDate) return;
        try {
            setIsFetching(true);
            const endOfDay = `${endDate}T23:59:59.999Z`;
            const [tripRes, expRes] = await Promise.all([
                api.get(`/trips?startDate=${startDate}&endDate=${endOfDay}`),
                api.get('/quarry-lease/expenses', { params: { startDate, endDate } })
            ]);

            if (tripRes.data.success) setTrips(tripRes.data.data);
            if (expRes.data.success) setExpenses(expRes.data.data);
        } catch (error) {
            showToast('Failed to fetch calculation data', 'error');
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (showForm) fetchCalculationData(); }, [startDate, endDate, showForm]);

    // Calculation Logic
    const uniqueMaterials = Array.from(new Set(trips.map(t => t.stoneTypeId?.name || 'General')));
    const tonsByMaterial = uniqueMaterials.reduce((acc, material) => {
        acc[material] = trips.filter(t => (t.stoneTypeId?.name || 'General') === material).reduce((sum, t) => sum + (t.loadQuantity || 0), 0);
        return acc;
    }, {} as Record<string, number>);

    const totalTons = trips.reduce((sum, t) => sum + (t.loadQuantity || 0), 0);
    const grossAmount = Object.keys(tonsByMaterial).reduce((sum, material) => sum + (tonsByMaterial[material] * Number(materialRates[material] || 0)), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netAmount = grossAmount - totalExpenses;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (grossAmount === 0) return showToast('Gross amount cannot be zero. Enter rates.', 'error');

        const materialBreakdown = Object.keys(tonsByMaterial).map(m => ({
            materialName: m,
            tons: tonsByMaterial[m],
            ratePerTon: Number(materialRates[m] || 0),
            amount: tonsByMaterial[m] * Number(materialRates[m] || 0)
        }));

        const payload = {
            startDate,
            endDate,
            totalTons,
            materialBreakdown,
            grossAmount,
            expenseAmount: totalExpenses,
            netAmount,
            notes
        };

        try {
            if (editId) {
                await api.put(`/quarry-lease/settlements/${editId}`, payload);
                showToast('Settlement updated successfully!', 'success');
            } else {
                await api.post('/quarry-lease/settlements', payload);
                showToast('Settlement saved successfully!', 'success');
            }
            setShowForm(false);
            setEditId(null);
            fetchData();
        } catch (error) {
            showToast('Failed to save settlement', 'error');
        }
    };

    const handleEdit = (record: any) => {
        setStartDate(record.startDate.split('T')[0]);
        setEndDate(record.endDate.split('T')[0]);
        setNotes(record.notes || '');
        
        const rates: Record<string, string> = {};
        record.materialBreakdown?.forEach((item: any) => {
            rates[item.materialName] = item.ratePerTon.toString();
        });
        setMaterialRates(rates);
        
        setEditId(record._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/quarry-lease/settlements/${deleteId}`);
            showToast('Settlement deleted', 'success');
            setDeleteId(null);
            fetchData();
        } catch (error) {
            showToast('Delete failed', 'error');
        }
    };

    const handlePrint = async (settlement: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write('<html><head><title>Generating Report...</title></head><body style="font-family:sans-serif; text-align:center; padding-top: 50px;"><h2>Gathering data, please wait...</h2></body></html>');

        try {
            const sd = settlement.startDate.split('T')[0];
            const ed = settlement.endDate.split('T')[0];
            const endOfDay = `${ed}T23:59:59.999Z`;
            const [tripsRes, expensesRes] = await Promise.all([
                api.get(`/trips?startDate=${sd}&endDate=${endOfDay}`),
                api.get('/quarry-lease/expenses', { params: { startDate: sd, endDate: ed } })
            ]);

            const pTrips = tripsRes.data.data || [];
            const pExpenses = expensesRes.data.data || [];

            printWindow.document.open();
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Quarry Lease Settlement Report</title>
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
                            .value { font-weight: bold; text-align: left; }
                            table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; position: relative; z-index: 1; }
                            table.items-table th { background: #e79b21; color: white; padding: 10px 15px; text-align: left; font-size: 11px; text-transform: uppercase; }
                            table.items-table.danger th { background: #e7515a; }
                            table.items-table td { padding: 10px 15px; border-bottom: 1px solid #eee; }
                            .totals-container { display: flex; justify-content: flex-end; margin-bottom: 40px; position: relative; z-index: 1; }
                            .totals-box { min-width: 300px; }
                            .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
                            .grand-total { font-size: 18px; font-weight: bold; color: #e79b21; border-top: 2px solid #e79b21; margin-top: 10px; padding-top: 10px; }
                            img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .stamp-img { 
                                width: 180px; 
                                position: absolute; 
                                top: -60px; 
                                left: 50%; 
                                transform: translateX(-50%); 
                                mix-blend-mode: multiply !important;
                                filter: grayscale(1) contrast(8) brightness(3);
                            }
                            @media print { 
                                body { padding: 0; } 
                                .print-container { border: none; } 
                                .stamp-img { mix-blend-mode: multiply !important; }
                            }
                            .page-break { page-break-before: always; }
                        </style>
                    </head>
                    <body>
                        <div class="print-container">
                            <img src="/assets/images/logo.png" class="watermark" alt="watermark" />
                            <div class="header">
                                <div>
                                    <h1 class="report-title">Quarry Lease Settlement</h1>
                                    <p style="color: #888; font-size: 12px; margin-top: 4px;">Period: ${new Date(settlement.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(settlement.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
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
                                    <h4>Record Summary</h4>
                                    <table class="info-table" style="width: 100%;">
                                        <tr>
                                            <td class="label" style="width: 15%;">Total Tonnage:</td>
                                            <td class="value" style="width: 35%;">${settlement.totalTons?.toFixed(2)} T</td>
                                            <td class="label" style="text-align: right; width: 30%;">Generated Date:</td>
                                            <td class="value" style="text-align: right; width: 20%;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <h4 style="font-size: 11px; text-transform: uppercase; color: #e79b21; letter-spacing: 1px; margin-bottom: 10px;">Material-wise Revenue Breakdown</h4>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Material Type</th>
                                        <th style="text-align: center">Total Tons</th>
                                        <th style="text-align: right">Rate / Ton (₹)</th>
                                        <th style="text-align: right">Sub-Total (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(settlement.materialBreakdown || []).map((m: any, idx: number) => `
                                        <tr>
                                            <td>${idx + 1}</td>
                                            <td>${m.materialName}</td>
                                            <td style="text-align: center">${m.tons?.toFixed(2)} T</td>
                                            <td style="text-align: right">₹${m.ratePerTon}</td>
                                            <td style="text-align: right; font-weight: bold;">₹${m.amount?.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>

                            <h4 style="font-size: 11px; text-transform: uppercase; color: #555; letter-spacing: 1px; margin-bottom: 10px;">Detailed Daily Trips (${pTrips.length})</h4>
                            <table class="items-table">
                                <thead>
                                    <tr style="background:#888;">
                                        <th>Date</th>
                                        <th>Vehicle Number</th>
                                        <th>Material</th>
                                        <th style="text-align: center">Tons</th>
                                        <th>Customer / Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pTrips.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:#999;">No trips found</td></tr>' : pTrips.map((t: any) => `
                                        <tr>
                                            <td>${new Date(t.date || t.tripDate || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                            <td>${t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.truckNumber || t.manualVehicleNumber || 'Unknown'}</td>
                                            <td>${t.stoneTypeId?.name || t.materialName || 'General'}</td>
                                            <td style="text-align: center; font-weight:bold;">${t.loadQuantity || t.tons || 0}</td>
                                            <td>${t.customerId?.name || t.saleId?.contractor?.name || t.contractorId?.name || t.notes || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>

                            <h4 style="font-size: 11px; text-transform: uppercase; color: #e7515a; letter-spacing: 1px; margin-bottom: 10px;">Quarry Operational Expenses Data</h4>
                            <table class="items-table danger">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Details</th>
                                        <th style="text-align: right">Expense Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pExpenses.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#999;">No expenses found</td></tr>' : pExpenses.map((e: any) => `
                                        <tr>
                                            <td>${new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                            <td>${e.expenseType}</td>
                                            <td>${e.amountType} ${e.notes ? `(${e.notes})` : ''}</td>
                                            <td style="text-align: right; font-weight: bold; color: #e7515a;">₹${e.amount?.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>

                            <div class="totals-container page-break">
                                <div class="totals-box">
                                    <div class="total-row"><span style="color: #888">Total Gross Earnings</span><span style="font-weight: bold">₹${settlement.grossAmount?.toLocaleString()}</span></div>
                                    <div class="total-row"><span style="color: #e7515a">Total Operational Expenses</span><span style="font-weight: bold; color: #e7515a">- ₹${settlement.expenseAmount?.toLocaleString()}</span></div>
                                    <div class="total-row grand-total"><span>Net Lease Profit</span><span style="${settlement.netAmount < 0 ? 'color: #e7515a;' : 'color: #00ab55;'}">₹${settlement.netAmount?.toLocaleString()}</span></div>
                                </div>
                            </div>

                            ${settlement.notes ? `
                                <div style="margin-top: 10px; padding: 15px; background: #fffbeb; border: 1px dashed #fde68a; color: #92400e; border-radius: 8px;">
                                    <h4 style="font-size: 10px; text-transform: uppercase; margin-bottom: 5px; opacity: 0.7;">Internal Notes</h4>
                                    <p style="font-size: 12px; font-weight: bold;">${settlement.notes}</p>
                                </div>
                            ` : ''}

                            <div class="footer" style="margin-top: 60px;">
                                <div class="signature-box">
                                    <div class="signature-line">Recipient Signature</div>
                                </div>
                                <div class="signature-box" style="position: relative;">
                                    <img src="/assets/images/Karthick-Earthmovers-owner-sign.jpeg" class="stamp-img" alt="Sign" />
                                    <div class="signature-line">Authorized Signature</div>
                                </div>
                            </div>

                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);

        } catch (error) {
            printWindow.close();
            console.error('Print generation failed:', error);
            showToast('Failed to load detail records for printing', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#e79b21] uppercase tracking-tight font-body">🏗️ Quarry Lease Management</h1>
                    <p className="text-xs text-white-dark mt-0.5 uppercase font-bold tracking-widest">Calculate periodic lease earnings vs expenses</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { 
                            setShowForm(true); 
                            setEditId(null); 
                            setMaterialRates({}); 
                            setNotes(''); 
                            if (minStartDate) setStartDate(minStartDate);
                        }}
                        className="btn btn-primary gap-2 rounded-xl font-bold bg-[#e79b21] border-none shadow-lg hover:bg-[#d68a1d]"
                    >
                        <IconPlus className="w-4 h-4" /> New Settlement Calculation
                    </button>
                )}
            </div>

            {!showForm && (
                <div className="panel rounded-3xl shadow-xl border-none overflow-hidden mt-6">
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] uppercase font-black text-slate-400">
                                    <th className="py-4">Settled Date</th>
                                    <th className="py-4">Lease Period</th>
                                    <th className="py-4 text-center">Tons</th>
                                    <th className="py-4 text-right">Gross Amount</th>
                                    <th className="py-4 text-right">Expenses</th>
                                    <th className="py-4 text-right">Net Profit</th>
                                    <th className="py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-20 uppercase font-black text-[11px] opacity-30 italic">fetching settlement history...</td></tr>
                                ) : settlements.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-20 uppercase font-black text-[11px] opacity-30 italic">No settlement history found</td></tr>
                                ) : (
                                    settlements.map((s) => (
                                        <tr key={s._id} className="group transition-all">
                                            <td className="font-bold text-xs">{new Date(s.date).toLocaleDateString()}</td>
                                            <td className="text-[10px] font-bold text-slate-400">
                                                {new Date(s.startDate).toLocaleDateString()} <span className="mx-1">→</span> {new Date(s.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="text-center font-black text-xs text-slate-600">{s.totalTons.toFixed(2)} T</td>
                                            <td className="text-right font-black text-slate-800">₹{s.grossAmount.toLocaleString()}</td>
                                            <td className="text-right font-bold text-danger">₹{s.expenseAmount.toLocaleString()}</td>
                                            <td className="text-right font-black text-success text-base">₹{s.netAmount.toLocaleString()}</td>
                                            <td>
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => setSelectedSettlement(s)} className="p-2 text-info hover:bg-info/10 rounded-full transition-all" title="View/Print"><IconEye className="w-4.5 h-4.5" /></button>
                                                    <button onClick={() => handleEdit(s)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-all" title="Edit"><IconEdit className="w-4.5 h-4.5" /></button>
                                                    <button onClick={() => setDeleteId(s._id)} className="p-2 text-danger hover:bg-danger/10 rounded-full transition-all" title="Delete"><IconTrash className="w-4.5 h-4.5" /></button>
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

            {showForm && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate__animated animate__fadeIn">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="panel rounded-3xl shadow-xl border-none">
                            <div className="flex items-center justify-between mb-6 pb-2 border-b">
                                <h5 className="font-black text-xs uppercase text-[#e79b21] tracking-widest">Period Selection</h5>
                                <button onClick={() => setShowForm(false)} className="text-slate-300 hover:text-danger"><IconX className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Lease Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={e => setStartDate(e.target.value)} 
                                        className="form-input font-bold rounded-xl h-12 border-2" 
                                        min={!editId ? minStartDate : ''}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Lease End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={e => setEndDate(e.target.value)} 
                                        className="form-input font-bold rounded-xl h-12 border-2" 
                                        min={startDate}
                                    />
                                </div>
                                <button 
                                    onClick={fetchCalculationData} 
                                    disabled={isFetching}
                                    className="btn btn-outline-primary w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                                >
                                    {isFetching ? 'Fetching Data...' : 'Recalculate Totals'}
                                </button>
                            </div>
                        </div>

                        <div className="panel rounded-3xl shadow-xl border-none bg-gradient-to-br from-success/5 to-white p-8 text-center border-2 border-dashed border-success/20">
                            <div className="text-[10px] font-black uppercase text-success mb-2 tracking-widest opacity-60">Net Lease Profit</div>
                            <div className={`text-4xl font-black ${netAmount < 0 ? 'text-danger' : 'text-success'}`}>
                                ₹{Math.abs(netAmount).toLocaleString()}
                            </div>
                            <div className="mt-4 pt-4 border-t border-success/10 text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                                ( Gross Earning: ₹{grossAmount.toLocaleString()} )<br />
                                MINUS<br />
                                ( Lease Expenses: ₹{totalExpenses.toLocaleString()} )
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="panel rounded-3xl shadow-xl border-none">
                            <h5 className="font-black text-xs uppercase text-[#e79b21] tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#e79b21]"></span>
                                Material Revenue Split
                            </h5>
                            
                            {isFetching ? (
                                <div className="py-20 text-center animate-pulse font-black text-slate-300 uppercase italic">Fetching trip records...</div>
                            ) : uniqueMaterials.length === 0 ? (
                                <div className="py-20 text-center font-black text-slate-300 uppercase italic">No trips found in this period</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    {uniqueMaterials.map(material => (
                                        <div key={material} className="p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col justify-between">
                                            <div className="mb-4">
                                                <div className="text-[10px] font-black text-primary uppercase truncate" title={material}>{material}</div>
                                                <div className="text-lg font-black text-slate-800">{tonsByMaterial[material].toFixed(2)} <span className="text-[10px] font-bold opacity-30 uppercase">Tons</span></div>
                                            </div>
                                            <div className="relative">
                                                <label className="text-[9px] font-black text-slate-400 uppercase absolute -top-2 left-3 bg-white px-1">Rate Per Ton (₹)</label>
                                                <input 
                                                    type="number" 
                                                    className="form-input font-black h-10 rounded-xl border-2 border-primary/20 focus:border-primary pl-4"
                                                    value={materialRates[material] || ''}
                                                    onChange={(e) => setMaterialRates(prev => ({ ...prev, [material]: e.target.value }))}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="mt-3 text-right">
                                                <div className="text-[9px] font-black text-slate-300 uppercase">Earning</div>
                                                <div className="text-sm font-black text-slate-800">₹{(tonsByMaterial[material] * Number(materialRates[material] || 0)).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Detailed Trips Table */}
                            {trips.length > 0 && (
                                <div className="mt-8">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center justify-between">
                                        <span>Detailed Daily Trips ({trips.length})</span>
                                        <span className="text-[9px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">{totalTons.toFixed(2)} Total Tons</span>
                                    </h4>
                                    <div className="table-responsive bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        <table className="table-hover w-full relative">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Date</th>
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Vehicle Number</th>
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Material</th>
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-center">Tons</th>
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Customer / Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {trips.map((t: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-3 px-6 font-bold text-[10px] text-slate-600">
                                                            {new Date(t.date || t.tripDate || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                        </td>
                                                        <td className="py-3 px-6 font-black text-[10px] text-slate-800">
                                                            {t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.manualVehicleNumber || 'Unknown'}
                                                        </td>
                                                        <td className="py-3 px-6 font-bold text-[10px] uppercase text-primary border border-primary/10 bg-primary/5 rounded-md inline-block mt-2 ml-6">
                                                            {t.stoneTypeId?.name || t.materialName || 'General'}
                                                        </td>
                                                        <td className="py-3 px-6 text-center font-black text-xs text-slate-800">
                                                            {t.loadQuantity || t.tons || 0}
                                                        </td>
                                                        <td className="py-3 px-6 text-[10px] uppercase font-bold text-slate-400">
                                                            {t.customerId?.name || t.saleId?.contractor?.name || t.contractorId?.name || t.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <hr className="my-8" />

                            <div className="space-y-6">
                                <h5 className="font-black text-xs uppercase text-danger tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-danger"></span>
                                    Quarry Operational Expenses
                                </h5>
                                {expenses.length === 0 ? (
                                    <div className="p-6 bg-slate-50 rounded-2xl text-center italic text-[10px] font-bold text-slate-400 uppercase">No expenses logged for this period</div>
                                ) : (
                                    <div className="table-responsive bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <table className="table-hover w-full">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Date</th>
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Category</th>
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-center">Bill</th>
                                                    <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {expenses.map((e, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-3 px-6 font-bold text-xs text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                                                        <td className="py-3 px-6 font-black text-[10px] uppercase text-slate-800">{e.expenseType}</td>
                                                        <td className="py-3 px-6 text-center">
                                                            {e.billUrl && (
                                                                <a 
                                                                    href={getFileUrl(e.billUrl)} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex p-1.5 text-info hover:bg-info/10 rounded-full transition-colors"
                                                                    title="View Receipt"
                                                                >
                                                                    <IconEye className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-6 text-right font-black text-xs text-danger">₹{e.amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-rose-50/50">
                                                    <td colSpan={3} className="py-3 px-6 text-right text-[10px] font-black uppercase text-danger">Period Total Expenses:</td>
                                                    <td className="py-3 px-6 text-right font-black text-sm text-danger underline decoration-double">₹{totalExpenses.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex flex-col gap-4">
                                <textarea 
                                    className="form-textarea rounded-2xl font-bold text-xs border-2" 
                                    rows={2} 
                                    placeholder="Add notes for this lease period..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                                <button 
                                    onClick={handleSubmit}
                                    className="btn btn-primary w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                                >
                                    <IconSave className="w-5 h-5" /> {editId ? 'Update Settlement Calculation' : 'Save Settlement Calculation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmModal 
                show={!!deleteId} 
                onCancel={() => setDeleteId(null)} 
                onConfirm={handleDelete} 
                title="Remove Settlement Record" 
                message="Are you sure? This will only remove the saved calculation, it will not affect your actual trip or expense records." 
            />

            {/* Settlement View Modal */}
            {selectedSettlement && (
                <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-xs uppercase text-[#e79b21] tracking-widest mb-1">Settlement Details</h3>
                                <p className="text-[10px] font-bold text-white-dark uppercase tracking-tighter">
                                    {new Date(selectedSettlement.startDate).toLocaleDateString()} — {new Date(selectedSettlement.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handlePrint(selectedSettlement)} className="btn btn-primary rounded-xl font-bold bg-[#e79b21] border-none shadow-lg">
                                    <IconPrinter className="w-4 h-4 mr-2" /> Print Summary
                                </button>
                                <button onClick={() => setSelectedSettlement(null)} className="p-2 text-slate-300 hover:text-danger hover:bg-danger/10 rounded-full transition-all">
                                    <IconX className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-dashed border-gray-200">
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Total Gross Earning</div>
                                    <div className="text-xl font-black text-slate-800">₹{selectedSettlement.grossAmount.toLocaleString()}</div>
                                </div>
                                <div className="bg-rose-50/30 rounded-2xl p-6 text-center border border-dashed border-rose-100">
                                    <div className="text-[9px] font-black uppercase text-danger mb-2">Total Operational Expenses</div>
                                    <div className="text-xl font-black text-danger">₹{selectedSettlement.expenseAmount.toLocaleString()}</div>
                                </div>
                                <div className="bg-success/10 rounded-2xl p-6 text-center border-2 border-dashed border-success/20">
                                    <div className="text-[9px] font-black uppercase text-success mb-2 underline">Net Lease Balance</div>
                                    <div className="text-2xl font-black text-success">₹{selectedSettlement.netAmount.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Revenue Breakdown */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Material-wise Revenue Breakdown</h4>
                                <div className="table-responsive bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="table-hover w-full">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Material Type</th>
                                                <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-center">Total Tons</th>
                                                <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-right">Rate / Ton</th>
                                                <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-right">Sub-Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedSettlement.materialBreakdown?.map((m: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-6 font-black text-[10px] uppercase text-slate-800">{m.materialName}</td>
                                                    <td className="py-3 px-6 text-center font-bold text-xs text-slate-500">{m.tons.toFixed(2)} T</td>
                                                    <td className="py-3 px-6 text-right font-bold text-xs text-slate-500">₹{m.ratePerTon.toLocaleString()}</td>
                                                    <td className="py-3 px-6 text-right font-black text-xs text-slate-800">₹{m.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedSettlement.notes && (
                                <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-amber-900">
                                    <div className="text-[9px] font-black uppercase opacity-40 mb-2 underline decoration-double">Internal Settlement Notes:</div>
                                    <p className="text-xs font-bold leading-relaxed">{selectedSettlement.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuarryLeaseManagement;
