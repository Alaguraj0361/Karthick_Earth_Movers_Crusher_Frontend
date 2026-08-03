'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import IconSearch from '@/components/icon/icon-search';
import IconPrinter from '@/components/icon/icon-printer';
import IconEye from '@/components/icon/icon-eye';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import { useToast } from '@/components/stone-mine/toast-notification';
import api from '@/utils/api';

const QuotationManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const { showToast } = useToast();
    const [customers, setCustomers] = useState<any[]>([]);
    const [stoneTypes, setStoneTypes] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        quotationDate: new Date().toISOString().split('T')[0],
        customer: '',
        validUntil: '',
        notes: '',
        status: 'Pending',
    });

    const [items, setItems] = useState<any[]>([
        { item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }
    ]);

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/quotations');
            if (res.data.success) {
                const sorted = res.data.data.sort((a: any, b: any) =>
                    new Date(b.quotationDate).getTime() - new Date(a.quotationDate).getTime()
                );
                setQuotations(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [custRes, stoneRes] = await Promise.all([
                    api.get('/customers'),
                    api.get('/master/stone-types')
                ]);
                if (custRes.data.success) setCustomers(custRes.data.data);
                if (stoneRes.data.success) setStoneTypes(stoneRes.data.data);
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };
        fetchMasterData();
        fetchQuotations();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, e: any) => {
        const { name, value } = e.target;
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [name]: value };

        if (name === 'stoneType') {
            const selectedStone = stoneTypes.find(s => s._id === value);
            if (selectedStone) {
                updatedItems[index].item = selectedStone.name;
                updatedItems[index].hsnCode = selectedStone.hsnCode || '';
                updatedItems[index].gstPercentage = selectedStone.gstPercentage || 5;
                updatedItems[index].unit = selectedStone.unit || 'Tons';
            }
        }

        const qty = parseFloat(updatedItems[index].quantity) || 0;
        const rate = parseFloat(updatedItems[index].rate) || 0;
        const gstPct = parseFloat(updatedItems[index].gstPercentage) || 0;

        updatedItems[index].amount = qty * rate;
        updatedItems[index].gstAmount = (updatedItems[index].amount * gstPct) / 100;

        setItems(updatedItems);
    };

    const addItem = () => {
        setItems([...items, { item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const gstTotal = items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    const grandTotal = subtotal + gstTotal;

    const resetForm = () => {
        setEditId(null);
        setShowForm(false);
        setShowPreview(false);
        setFormData({
            quotationDate: new Date().toISOString().split('T')[0],
            customer: '',
            validUntil: '',
            notes: '',
            status: 'Pending',
        });
        setItems([{ item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }]);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const payload = {
                ...formData,
                items,
                subtotal,
                gstAmount: gstTotal,
                grandTotal
            };

            if (editId) {
                await api.put(`/quotations/${editId}`, payload);
                showToast('Quotation updated!', 'success');
            } else {
                await api.post('/quotations', payload);
                showToast('Quotation created!', 'success');
            }
            resetForm();
            fetchQuotations();
        } catch (error) {
            console.error(error);
            showToast('Error saving quotation', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (q: any) => {
        setEditId(q._id);
        setFormData({
            quotationDate: q.quotationDate.split('T')[0],
            customer: q.customer?._id || q.customer,
            validUntil: q.validUntil ? q.validUntil.split('T')[0] : '',
            notes: q.notes || '',
            status: q.status || 'Pending',
        });
        setItems(q.items.map((i: any) => ({ ...i, stoneType: i.stoneType?._id || i.stoneType })));
        setShowForm(true);
        setShowPreview(false);
    };

    const handleView = (q: any) => {
        setSelectedQuotation(q);
        setShowPreview(true);
        setShowForm(false);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/quotations/${deleteId}`);
            showToast('Quotation deleted', 'success');
            fetchQuotations();
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteId(null);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('quotation-print-area');
        if (!printContent) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write([
            '<html>',
            '<head>',
            '    <title>Quotation ' + (selectedQuotation?.quotationNumber || '') + '</title>',
            '    <style>',
            '        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }',
            '        body { font-family: "Segoe UI", Arial, sans-serif; padding: 30px; color: #333; font-size: 14px; }',
            '        table { width: 100%; border-collapse: collapse; }',
            '        th { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
            '        img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
            '        .sig-img-trans { ',
            '            mix-blend-mode: multiply !important;',
            '            filter: grayscale(1) contrast(8) brightness(3);',
            '            -webkit-print-color-adjust: exact !important;',
            '        }',
            '        @media print { body { padding: 15px; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .sig-img-trans { mix-blend-mode: multiply !important; } }',
            '    </style>',
            '</head>',
            '<body>',
            printContent.innerHTML,
            '</body>',
            '</html>'
        ].join('\n'));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    return (
        <div className="space-y-6">
            {!showForm && !showPreview && (
                <div className="panel">
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                        <div>
                            <h5 className="text-lg font-bold">Quotation List (விலைப்புள்ளி பட்டியல்)</h5>
                            <p className="text-white-dark text-xs mt-1">Manage and generate professional quotes for customers</p>
                        </div>
                        <button className="btn btn-primary shadow-lg shadow-primary/20" onClick={() => setShowForm(true)}>
                            <IconPlus className="ltr:mr-2 rtl:ml-2" /> New Quotation
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>QT #</th>
                                    <th>Date</th>
                                    <th>Valid Until</th>
                                    <th>Customer</th>
                                    <th className="!text-right">Amount</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                                ) : quotations.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8">No quotations found</td></tr>
                                ) : quotations.map(q => (
                                    <tr key={q._id}>
                                        <td className="font-bold text-primary">{q.quotationNumber}</td>
                                        <td>{new Date(q.quotationDate).toLocaleDateString()}</td>
                                        <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}</td>
                                        <td className="font-semibold">{q.customer?.name}</td>
                                        <td className="!text-right font-bold text-lg">₹{q.grandTotal.toLocaleString()}</td>
                                        <td className="text-center">
                                            <span className={`badge ${q.status === 'Accepted' ? 'bg-success/10 text-success' : q.status === 'Pending' ? 'bg-warning/10 text-warning' : 'bg-dark/10 text-dark'}`}>
                                                {q.status}
                                            </span>
                                            {q.statusUpdatedAt && q.status !== 'Pending' && (
                                                <div className="text-[10px] text-white-dark mt-1 font-semibold">
                                                    {new Date(q.statusUpdatedAt).toLocaleDateString()} {new Date(q.statusUpdatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="btn btn-sm btn-outline-primary" title="View Preview" onClick={() => handleView(q)}>
                                                    <IconEye className="w-4 h-4" />
                                                </button>
                                                <button className="btn btn-sm btn-outline-info" title="Edit" onClick={() => handleEdit(q)}>
                                                    <IconEdit className="w-4 h-4" />
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => setDeleteId(q._id)}>
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="panel">
                    <div className="flex items-center justify-between mb-8 border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-5">
                        <div>
                            <h5 className="text-xl font-bold">{editId ? '✏️ Edit Quotation' : '➕ New Quotation'}</h5>
                            <p className="text-white-dark text-xs mt-1">Create a professional cost estimate for the customer</p>
                        </div>
                        <button className="btn btn-outline-danger btn-sm" onClick={resetForm}>
                            <IconX className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> Close
                        </button>
                    </div>
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Quotation Date *</label>
                                <input type="date" name="quotationDate" className="form-input" value={formData.quotationDate} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Customer *</label>
                                <select name="customer" className="form-select border-primary" value={formData.customer} onChange={handleChange} required>
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Valid Until</label>
                                <input type="date" name="validUntil" className="form-input border-warning" value={formData.validUntil} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Status</label>
                                <select name="status" className="form-select border-info" value={formData.status} onChange={handleChange}>
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Converted">Converted</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h6 className="font-bold text-primary flex items-center gap-2 text-xs uppercase tracking-widest">
                                    <IconPlus className="w-4 h-4" /> Items List
                                </h6>
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addItem}>
                                    <IconPlus className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> Add Item
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th className="w-40 min-w-[120px]">HSN Code</th>
                                            <th className="w-40 min-w-[100px]">Qty</th>
                                            <th className="w-40 min-w-[100px]">Unit</th>
                                            <th className="w-40 min-w-[120px]">Rate (₹)</th>
                                            <th className="w-40 min-w-[100px]">Tax %</th>
                                            <th className="text-right min-w-[120px]">Amount (₹)</th>
                                            <th className="w-10">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <select name="stoneType" className="form-select text-sm min-w-[150px]" value={item.stoneType} onChange={(e) => handleItemChange(idx, e)} required>
                                                        <option value="">Select Item</option>
                                                        {stoneTypes.map(st => <option key={st._id} value={st._id}>{st.name}</option>)}
                                                    </select>
                                                </td>
                                                <td><input type="text" name="hsnCode" className="form-input text-sm" placeholder="HSN" value={item.hsnCode || ''} onChange={(e) => handleItemChange(idx, e)} /></td>
                                                <td><input type="number" name="quantity" className="form-input text-sm" value={item.quantity} onChange={(e) => handleItemChange(idx, e)} required /></td>
                                                <td>
                                                    <select name="unit" className="form-select text-sm" value={item.unit} onChange={(e) => handleItemChange(idx, e)}>
                                                        <option value="Tons">Tons</option>
                                                        <option value="Units">Units</option>
                                                        <option value="Kg">Kg</option>
                                                        <option value="CFT">CFT</option>
                                                    </select>
                                                </td>
                                                <td><input type="number" name="rate" className="form-input text-sm" value={item.rate} onChange={(e) => handleItemChange(idx, e)} required /></td>
                                                <td>
                                                    <select name="gstPercentage" className="form-select text-sm" value={item.gstPercentage} onChange={(e) => handleItemChange(idx, e)}>
                                                        <option value="0">0%</option>
                                                        <option value="5">5%</option>
                                                        <option value="12">12%</option>
                                                        <option value="18">18%</option>
                                                    </select>
                                                </td>
                                                <td className="!text-right font-bold text-primary">₹{item.amount.toLocaleString()}</td>
                                                <td className="text-center">
                                                    <button type="button" className="text-danger" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Notes</label>
                                <textarea name="notes" className="form-textarea" rows={3} placeholder="Any specific terms or conditions..." value={formData.notes} onChange={handleChange}></textarea>
                            </div>
                            <div className="bg-primary/5 p-6 rounded-xl space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white-dark">Subtotal:</span>
                                    <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white-dark">GST (Tax):</span>
                                    <span className="font-bold text-warning-dark">₹{gstTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-primary/10">
                                    <span className="font-black text-primary text-lg uppercase tracking-wider">Grand Total:</span>
                                    <span className="font-black text-primary text-3xl">₹{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-5 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-danger px-8" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-10 shadow-lg shadow-primary/20" disabled={isSaving}>
                                {isSaving ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 ltr:mr-2 rtl:ml-2 inline-block"></span> : <IconSave className="ltr:mr-2 rtl:ml-2" />}
                                {isSaving ? 'Saving...' : editId ? 'Update Quotation' : 'Create Quotation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showPreview && selectedQuotation && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <button className="btn btn-outline-danger" onClick={() => setShowPreview(false)}>
                            <IconX className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Back to List
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint}>
                            <IconPrinter className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Print / Save PDF
                        </button>
                    </div>

                    <div id="quotation-print-area" className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
                        {/* Watermark */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.06, pointerEvents: 'none', zIndex: 0 }}>
                            <img src="/assets/images/logo.png" alt="watermark" style={{ width: '420px', height: '420px', objectFit: 'contain' }} />
                        </div>

                        {/* Company Header */}
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#e79b21', margin: 0 }}>QUOTATION</h1>
                                <p style={{ fontSize: '13px', color: '#555', marginTop: '4px', fontWeight: 'bold' }}>
                                    QT NO: {selectedQuotation.quotationNumber}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <img src="/assets/images/logo.png" alt="Karthick Earth Movers" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Stone Quarry & Transport Unit</p>
                                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Tamil Nadu, India</p>
                                <p style={{ fontSize: '12px', color: '#e79b21', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>GST: 33AVFPK9827P2ZV</p>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #e0e6ed', margin: '15px 0 25px 0', position: 'relative', zIndex: 1 }} />

                        {/* Details Sections */}
                        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                            <div>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '8px' }}>Quotation To:</p>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#888' }}>customer name:</td>
                                            <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedQuotation.customer?.name}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#888' }}>address:</td>
                                            <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedQuotation.customer?.address || '—'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#888' }}>phone:</td>
                                            <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedQuotation.customer?.phone || '—'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '8px' }}>Quotation Info:</p>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#888' }}>Quote Date:</td>
                                            <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{new Date(selectedQuotation.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#888' }}>Valid Until:</td>
                                            <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedQuotation.validUntil ? new Date(selectedQuotation.validUntil).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#888' }}>Status:</td>
                                            <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right', color: '#e2a03f' }}>{selectedQuotation.status}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', position: 'relative', zIndex: 1 }}>
                            <thead>
                                <tr>
                                    <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>S.No</th>
                                    <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Description</th>
                                    <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>HSN</th>
                                    <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Qty</th>
                                    <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Unit</th>
                                    <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Rate (₹)</th>
                                    <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedQuotation.items?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee' }}>{idx + 1}</td>
                                        <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>{item.item}</td>
                                        <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', fontSize: '12px', color: '#666' }}>{item.hsnCode || '—'}</td>
                                        <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.unit}</td>
                                        <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'right' }}>₹{item.rate?.toLocaleString()}</td>
                                        <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>₹{item.amount?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                            <div style={{ minWidth: '250px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                                    <span style={{ color: '#888' }}>Subtotal:</span>
                                    <span style={{ fontWeight: 'bold' }}>₹{selectedQuotation.subtotal?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                                    <span style={{ color: '#888' }}>Tax (GST):</span>
                                    <span style={{ fontWeight: 'bold' }}>₹{selectedQuotation.gstAmount?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#e79b21', borderTop: '2px solid #e79b21', marginTop: '8px' }}>
                                    <span>Quote Total:</span>
                                    <span>₹{selectedQuotation.grandTotal?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedQuotation.notes && (
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
                                <p style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>Terms & Notes:</p>
                                <p style={{ fontSize: '13px' }}>{selectedQuotation.notes}</p>
                            </div>
                        )}

                        {/* Footer Signature */}
                        <div style={{ paddingTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid #ccc', width: '200px', paddingTop: '8px', fontSize: '12px', color: '#888' }}>Customer Acceptance</div>
                            </div>
                            <div style={{ textAlign: 'center', position: 'relative' }}>
                                <img src="/assets/images/Karthick-Earthmovers-owner-sign.jpeg" alt="Authorized Signature" className="sig-img-trans" style={{ width: '180px', position: 'absolute', top: '-45px', left: '50%', transform: 'translateX(-50%)' }} />
                                <div style={{ borderTop: '1px solid #ccc', width: '200px', paddingTop: '8px', marginTop: '20px', fontSize: '12px', color: '#888' }}>Authorized Signature</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <p>This is a computer generated document. — Karthick Earth Movers</p>
                        </div>
                    </div>
                </div>
            )}
            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Quotation"
                message="Are you sure you want to delete this quotation? This action cannot be undone."
            />
        </div>
    );
};

export default QuotationManagement;
