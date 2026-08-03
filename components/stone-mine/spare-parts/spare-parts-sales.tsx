'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import api from '@/utils/api';

const SparePartsSales = () => {
    const { showToast } = useToast();
    const [sales, setSales] = useState<any[]>([]);
    const [spareParts, setSpareParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [allAssets, setAllAssets] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        assetType: '',
        assetCategory: '',
        assetId: '',
        customerName: '',
        phoneNumber: '',
        vehicleName: '',
        vehicleNumber: '',
        machineType: '',
        vehicleOwnership: 'Own', // 'Own', 'Vendor'
        transportVendorId: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [items, setItems] = useState<any[]>([{ sparePart: '', spareName: '', quantity: 1, price: 0, total: 0 }]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const [salesRes, partsRes, assetsRes, vendorsRes] = await Promise.all([
                api.get('/spare-parts-sales'),
                api.get('/spare-parts'),
                api.get('/master/vehicles'),
                api.get('/vendors/transport')
            ]);
            if (salesRes.data.success) setSales(salesRes.data.data);
            if (partsRes.data.success) setSpareParts(partsRes.data.data);
            if (assetsRes.data.success) setAllAssets(assetsRes.data.data);
            if (vendorsRes.data.success) setVendors(vendorsRes.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'assetType' && value !== 'Vehicle') {
            setFormData(prev => ({ ...prev, vehicleOwnership: 'Own', transportVendorId: '' }));
        }
    };

    const handleAssetSelect = (e: any) => {
        const id = e.target.value;
        const asset = allAssets.find(a => a._id === id);
        if (asset) {
            setFormData(prev => ({
                ...prev,
                assetId: asset._id,
                vehicleName: asset.name,
                vehicleNumber: asset.vehicleNumber || asset.registrationNumber || '',
                machineType: asset.category || '',
                customerName: asset.driverName || asset.operatorName || asset.ownerName || '',
                phoneNumber: asset.mobile || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, assetId: '', vehicleName: '', vehicleNumber: '', machineType: '', customerName: '', phoneNumber: '' }));
        }
    };

    const handleVendorVehicleSelect = (vNum: string) => {
        const selectedVendor = vendors.find(v => v._id === formData.transportVendorId);
        setFormData(prev => ({
            ...prev,
            vehicleNumber: vNum,
            vehicleName: selectedVendor?.name || '',
            phoneNumber: selectedVendor?.mobile || '',
            customerName: selectedVendor?.driverName || selectedVendor?.name || ''
        }));
    };

    const handleItemChange = (index: number, e: any) => {
        const { name, value } = e.target;
        const updated = [...items];
        updated[index] = { ...updated[index], [name]: value };

        if (name === 'sparePart') {
            const part = spareParts.find(p => p._id === value);
            if (part) {
                updated[index].spareName = part.name;
                updated[index].price = part.cost || 0;
            } else {
                updated[index].spareName = '';
                updated[index].price = 0;
            }
        }

        const qty = parseFloat(updated[index].quantity) || 0;
        const price = parseFloat(updated[index].price) || 0;
        updated[index].total = qty * price;
        setItems(updated);
    };

    const addItem = () => setItems([...items, { sparePart: '', spareName: '', quantity: 1, price: 0, total: 0 }]);
    const removeItem = (idx: number) => items.length > 1 && setItems(items.filter((_, i) => i !== idx));

    const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    const resetForm = () => {
        setFormData({ 
            assetType: '', 
            assetCategory: '', 
            assetId: '', 
            customerName: '', 
            phoneNumber: '', 
            vehicleName: '', 
            vehicleNumber: '', 
            machineType: '', 
            date: new Date().toISOString().split('T')[0], 
            notes: '',
            vehicleOwnership: 'Own',
            transportVendorId: ''
        });
        setItems([{ sparePart: '', spareName: '', quantity: 1, price: 0, total: 0 }]);
        setEditId(null);
        setShowForm(false);
    };

    const handleEdit = (sale: any) => {
        // Try to reverse match asset from master list base on name & number
        const asset = allAssets.find(a =>
            a.name === sale.vehicleName &&
            ((a.vehicleNumber || '') === (sale.vehicleNumber || '') || (a.registrationNumber || '') === (sale.vehicleNumber || ''))
        );

        setFormData({
            assetType: sale.assetType || (asset ? asset.type : ''),
            assetCategory: sale.assetCategory || (asset ? asset.category : ''),
            assetId: sale.assetId || (asset ? asset._id : ''),
            customerName: sale.customerName || '',
            phoneNumber: sale.phoneNumber || '',
            vehicleName: sale.vehicleName || '',
            vehicleNumber: sale.vehicleNumber || '',
            machineType: sale.machineType || '',
            vehicleOwnership: sale.vehicleOwnership || 'Own',
            transportVendorId: sale.transportVendorId || '',
            date: new Date(sale.date).toISOString().split('T')[0],
            notes: sale.notes || ''
        });

        const safeItems = sale.items?.map((i: any) => ({
            sparePart: i.sparePart,
            spareName: i.spareName,
            quantity: i.quantity,
            price: i.price,
            total: i.total
        })) || [];
        setItems(safeItems.length > 0 ? safeItems : [{ sparePart: '', spareName: '', quantity: 1, price: 0, total: 0 }]);

        setEditId(sale._id);
        setShowForm(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = { ...formData, items, totalAmount: grandTotal };
            if (editId) {
                await api.put(`/spare-parts-sales/${editId}`, payload);
                showToast('Sale Entry updated successfully!', 'success');
            } else {
                await api.post('/spare-parts-sales', payload);
                showToast('Sale Entry created successfully!', 'success');
            }
            resetForm();
            fetchSales();
        } catch (error: any) {
            console.error(error);
            showToast('Error saving sale entry', 'error');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/spare-parts-sales/${deleteId}`);
            showToast('Sale deleted and stock reverted!', 'success');
            fetchSales();
        } catch (error) {
            showToast('Error deleting sale', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            {!showForm ? (
                <>
                    <div className="flex justify-end mb-4">
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            <IconPlus className="ltr:mr-2 rtl:ml-2" />
                            New Sales Entry
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Receiver Details</th>
                                    <th>Vehicle Details</th>
                                    <th>Items</th>
                                    <th className="text-right">Total Amount</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                                ) : sales.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-4">No records found.</td></tr>
                                ) : (
                                    sales.map(s => (
                                        <tr key={s._id}>
                                            <td>{new Date(s.date).toLocaleDateString()}</td>
                                            <td>
                                                <div className="font-bold text-primary">{s.customerName}</div>
                                                <div className="text-xs text-white-dark mt-1">📞 {s.phoneNumber}</div>
                                            </td>
                                            <td>
                                                <div className="font-bold">{s.vehicleName}</div>
                                                <div className="text-xs text-white-dark mt-1">{s.vehicleNumber} | {s.machineType}</div>
                                            </td>
                                            <td>
                                                <div className="text-xs">
                                                    {s.items?.map((i: any, idx: number) => (
                                                        <div key={idx}>- {i.spareName} ({i.quantity})</div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="text-right font-bold text-lg text-success">
                                                ₹{s.totalAmount?.toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="text-info" title="Edit" onClick={() => handleEdit(s)}>
                                                        <IconEdit className="w-5 h-5 mx-auto" />
                                                    </button>
                                                    <button className="text-danger" onClick={() => setDeleteId(s._id)}>
                                                        <IconTrash className="w-5 h-5 mx-auto" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="panel animate__animated animate__fadeIn">
                    <div className="flex items-center justify-between mb-5 border-b pb-4">
                        <h5 className="font-bold text-lg">{editId ? 'Edit Sales Entry' : 'Create Sales Entry'}</h5>
                        <button className="btn btn-outline-danger btn-sm" onClick={resetForm}><IconX /> Close</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6 bg-dark-light/5 p-5 rounded-lg border border-primary/10 mb-6">
                            <h6 className="font-bold uppercase text-primary">1. Specify the Asset</h6>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Ownership Selection */}
                                <div className="md:col-span-3">
                                    <label className="text-xs font-bold uppercase mb-1">Ownership *</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'Own', name: 'Own Asset' },
                                            { id: 'Vendor', name: 'Vendor Asset' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                    formData.vehicleOwnership === opt.id ? 'bg-primary text-white shadow-lg' : 'bg-primary/5 text-primary hover:bg-primary/10'
                                                }`}
                                                onClick={() => setFormData(p => ({ ...p, vehicleOwnership: opt.id, transportVendorId: '', assetId: '', vehicleNumber: '', vehicleName: '', assetType: '' }))}
                                            >
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Vendor Selection (Conditional) */}
                                {formData.vehicleOwnership === 'Vendor' && (
                                    <div className="md:col-span-3 animate-fadeIn">
                                        <label className="text-xs font-bold uppercase mb-1">Vendor / Transport Name *</label>
                                        <select 
                                            className="form-select h-12 rounded-xl" 
                                            required 
                                            value={formData.transportVendorId} 
                                            onChange={(e) => setFormData(p => ({ ...p, transportVendorId: e.target.value, assetType: '', vehicleNumber: '', vehicleName: '' }))}
                                        >
                                            <option value="">Choose Vendor...</option>
                                            {vendors.map(v => (
                                                <option key={v._id} value={v._id}>
                                                    {v.name}{v.companyName ? ` (${v.companyName})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Asset Type Selection */}
                                {(formData.vehicleOwnership === 'Own' || formData.transportVendorId) && (
                                    <div className="animate-fadeIn">
                                        <label className="text-xs font-bold uppercase mb-1">Mechine / Vehicle *</label>
                                        <select name="assetType" className="form-select h-12 rounded-xl font-bold" required value={formData.assetType} onChange={handleChange}>
                                            <option value="">Select Option</option>
                                            <option value="Machine">Machine</option>
                                            <option value="Vehicle">Vehicle</option>
                                        </select>
                                    </div>
                                )}

                                {/* Specific Asset Selection (Machine) */}
                                {formData.assetType === 'Machine' && (
                                    <div className="md:col-span-2 animate-fadeIn">
                                        <label className="text-xs font-bold uppercase mb-1">Select Machine *</label>
                                        <select name="assetId" className="form-select h-12 rounded-xl border-primary" required value={formData.assetId} onChange={handleAssetSelect}>
                                            <option value="">Choose Machine...</option>
                                            {allAssets
                                                .filter(a => a.type === 'Machine')
                                                .map(a => (
                                                    <option key={a._id} value={a._id}>{a.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                {/* Specific Asset Selection (Vehicle) */}
                                {formData.assetType === 'Vehicle' && (
                                    <div className="md:col-span-2 animate-fadeIn">
                                        <label className="text-xs font-bold uppercase mb-1">Vehicle Number Select *</label>
                                        {formData.vehicleOwnership === 'Own' ? (
                                            <select name="assetId" className="form-select h-12 rounded-xl border-primary font-bold" required value={formData.assetId} onChange={handleAssetSelect}>
                                                <option value="">Select Own Vehicle...</option>
                                                {allAssets
                                                    .filter(a => a.type === 'Vehicle' && (a.ownershipType === 'Own' || !a.ownershipType))
                                                    .map(a => (
                                                        <option key={a._id} value={a._id}>{a.name} ({a.vehicleNumber || a.registrationNumber})</option>
                                                    ))}
                                            </select>
                                        ) : (
                                            <select 
                                                className="form-select h-12 rounded-xl border-primary font-bold" 
                                                required 
                                                value={formData.vehicleNumber} 
                                                onChange={(e) => handleVendorVehicleSelect(e.target.value)}
                                            >
                                                <option value="">Select Vendor Vehicle...</option>
                                                {vendors.find(v => v._id === formData.transportVendorId)?.vehicles?.map((v: any, idx: number) => (
                                                    <option key={idx} value={v.vehicleNumber}>{v.vehicleNumber}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4 bg-warning/5 p-4 rounded-lg border border-warning/20">
                                <h6 className="font-bold uppercase text-xs text-warning mb-2">🚗 Selected Asset Info</h6>
                                <div>
                                    <label className="text-xs font-bold uppercase mb-1">Asset Name</label>
                                    <input type="text" name="vehicleName" className="form-input bg-white/50" readOnly required value={formData.vehicleName} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase mb-1">Number / Details</label>
                                    <input type="text" name="vehicleNumber" className="form-input bg-white/50" readOnly value={formData.vehicleNumber} />
                                </div>
                            </div>

                            <div className="space-y-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
                                <h6 className="font-bold uppercase text-xs text-primary mb-2">👤 Receiver Details (Who took it?)</h6>
                                <div>
                                    <label className="text-xs font-bold uppercase mb-1">Receiver Name *</label>
                                    <input type="text" name="customerName" className="form-input" required value={formData.customerName} onChange={handleChange} />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold uppercase mb-1">Contact Number</label>
                                        <input type="text" name="phoneNumber" className="form-input" required value={formData.phoneNumber} onChange={handleChange} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold uppercase mb-1">Date *</label>
                                        <input type="date" name="date" className="form-input" required value={formData.date} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h6 className="font-bold uppercase text-xs">🔧 Spare Items</h6>
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addItem}>+ Add Item</button>
                            </div>
                            <table className="table-hover table-bordered">
                                <thead>
                                    <tr>
                                        <th>Spare Part</th>
                                        <th className="w-32">Price (₹)</th>
                                        <th className="w-24">Qty</th>
                                        <th className="w-32 text-right">Total (₹)</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <select name="sparePart" className="form-select" required value={item.sparePart} onChange={e => handleItemChange(idx, e)}>
                                                    <option value="">Select Spare Part</option>
                                                    {spareParts.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.currentStock})</option>)}
                                                </select>
                                            </td>
                                            <td><input type="number" className="form-input" disabled value={item.price} /></td>
                                            <td><input type="number" name="quantity" className="form-input" min="1" required value={item.quantity} onChange={e => handleItemChange(idx, e)} /></td>
                                            <td className="text-right font-bold text-primary">₹{item.total.toLocaleString()}</td>
                                            <td>
                                                <button type="button" className="text-danger" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                                                    <IconTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end mt-4">
                                <div className="bg-primary/10 px-6 py-3 rounded-lg flex items-center gap-4">
                                    <span className="font-bold uppercase text-sm">Grand Total:</span>
                                    <span className="font-black text-2xl text-primary">₹{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button type="button" className="btn btn-outline-danger mr-4" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-8">{editId ? 'Update Record' : 'Save Record'}</button>
                        </div>
                    </form>
                </div>
            )}

            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Sale Record"
                message="Are you sure? This will delete the record and restore the stock of the items sold."
            />
        </div>
    );
};

export default SparePartsSales;
