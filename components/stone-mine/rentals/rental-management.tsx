'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import api from '@/utils/api';

const RENTAL_TYPES = ['Day', 'Day/Night', 'Trip', 'Kilometer'];
const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid'];

const defaultForm = {
    date: new Date().toISOString().split('T')[0],
    assetType: 'Vehicle',
    customerName: '',
    vehicleId: '',
    driverName: '',
    rentalType: 'Day',
    duration: 1,
    rate: 0,
    totalAmount: 0,
    paymentStatus: 'Pending',
    description: '',
    startTime: '',
    endTime: '',
    operatorBata: 0,
    bucketType: '',
};

const RentalManagement = () => {
    const { showToast } = useToast();
    const [rentals, setRentals] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>(defaultForm);

    // Driver/Operator name mode: 'select' or 'manual'
    const [driverNameMode, setDriverNameMode] = useState<'select' | 'manual'>('select');

    // Filters
    const [filterMonth, setFilterMonth] = useState<number | string>('');
    const [filterYear, setFilterYear] = useState<number | string>('');
    const [filterAssetType, setFilterAssetType] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterMonth && filterYear) {
                params.startDate = new Date(Number(filterYear), Number(filterMonth) - 1, 1).toISOString().split('T')[0];
                params.endDate = new Date(Number(filterYear), Number(filterMonth), 0).toISOString().split('T')[0];
            } else if (filterYear) {
                params.startDate = `${filterYear}-01-01`;
                params.endDate = `${filterYear}-12-31`;
            }

            if (filterAssetType) params.assetType = filterAssetType;

            const [rentalsRes, assetsRes] = await Promise.all([
                api.get('/rentals', { params }),
                api.get('/master/vehicles'),
            ]);

            if (rentalsRes.data.success) setRentals(rentalsRes.data.data);
            if (assetsRes.data.success) {
                const all = assetsRes.data.data;
                setVehicles(all.filter((a: any) => a.type === 'Vehicle' && a.ownershipType === 'Own'));
                setMachines(all.filter((a: any) => a.type === 'Machine' && a.ownershipType === 'Own'));
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load rental data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filterMonth, filterYear, filterAssetType]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev: any) => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate total amount
            const duration = parseFloat(name === 'duration' ? value : prev.duration) || 0;
            const rate = parseFloat(name === 'rate' ? value : prev.rate) || 0;
            const bata = parseFloat(name === 'operatorBata' ? value : prev.operatorBata) || 0;
            updated.totalAmount = parseFloat((duration * rate + bata).toFixed(2));

            // Reset asset-specific fields on asset type change
            if (name === 'assetType') {
                updated.vehicleId = '';
                updated.driverName = '';
                updated.rentalType = value === 'Vehicle' ? 'Day' : '';
                updated.startTime = '';
                updated.endTime = '';
                updated.operatorBata = 0;
                updated.bucketType = '';
                setDriverNameMode('select');
            }

            return updated;
        });
    };

    // Get the currently selected asset object
    const getSelectedAsset = () => {
        const list = formData.assetType === 'Vehicle' ? vehicles : machines;
        return list.find((a: any) => a._id === formData.vehicleId);
    };

    // Get suggested driver/operator names from selected asset
    const getSuggestedNames = (): string[] => {
        const asset = getSelectedAsset();
        if (!asset) return [];
        const names: string[] = [];
        if (formData.assetType === 'Vehicle') {
            // For vehicles: only show driverName
            if (asset.driverName && isNaN(Number(asset.driverName))) names.push(asset.driverName);
        } else {
            // For machines: only show operatorName
            if (asset.operatorName && isNaN(Number(asset.operatorName))) names.push(asset.operatorName);
        }
        return names;
    };

    const handleVehicleSelect = (e: any) => {
        const id = e.target.value;
        setFormData((prev: any) => ({
            ...prev,
            vehicleId: id,
            driverName: '', // reset driver name on asset change
        }));
        setDriverNameMode('select');
    };

    const isVehicle = formData.assetType === 'Vehicle';
    const driverLabel = isVehicle ? 'Driver Name' : 'Operator Name';
    const assetList = isVehicle ? vehicles : machines;
    const suggestedNames = getSuggestedNames();

    const resetForm = () => {
        setFormData(defaultForm);
        setEditId(null);
        setShowForm(false);
        setDriverNameMode('select');
    };

    const handleEdit = (record: any) => {
        setFormData({
            date: record.date ? record.date.split('T')[0] : defaultForm.date,
            assetType: record.assetType || 'Vehicle',
            customerName: record.customerName || '',
            vehicleId: record.vehicleId?._id || record.vehicleId || '',
            driverName: record.driverName || '',
            rentalType: record.rentalType || 'Day',
            duration: record.duration || 1,
            rate: record.rate || 0,
            totalAmount: record.totalAmount || 0,
            paymentStatus: record.paymentStatus || 'Pending',
            description: record.description || '',
            startTime: record.startTime || '',
            endTime: record.endTime || '',
            operatorBata: record.operatorBata || 0,
            bucketType: record.bucketType || '',
        });
        setEditId(record._id);
        setShowForm(true);
        setDriverNameMode(record.driverName ? 'manual' : 'select');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vehicleId) { showToast('Please select a vehicle or machine', 'error'); return; }
        if (!formData.rate || formData.rate <= 0) { showToast('Please enter a valid rate', 'error'); return; }

        try {
            const payload = { ...formData };
            if (editId) {
                const res = await api.put(`/rentals/${editId}`, payload);
                if (res.data.success) { showToast('Rental record updated!', 'success'); resetForm(); fetchData(); }
            } else {
                const res = await api.post('/rentals', payload);
                if (res.data.success) { showToast('Rental record added!', 'success'); resetForm(); fetchData(); }
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || 'Failed to save record', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`/rentals/${deleteId}`);
            if (res.data.success) { showToast('Record deleted!', 'success'); setDeleteId(null); fetchData(); }
        } catch { showToast('Failed to delete record', 'error'); }
    };

    const totalRevenue = rentals.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
    const pendingRevenue = rentals.filter((r: any) => r.paymentStatus !== 'Paid').reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header — always visible */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">🏗️ Rental Management</h1>
                    <p className="text-xs text-white-dark mt-0.5">Track vehicle & machine rentals — own assets only</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditId(null); setFormData(defaultForm); setDriverNameMode('select'); }}
                        className="btn btn-primary gap-2 rounded-xl font-bold"
                    >
                        <IconPlus className="w-4 h-4" /> New Rental Entry
                    </button>
                )}
            </div>

            {/* Summary Cards & Filters — only when form is hidden */}
            {!showForm && (<>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="panel rounded-2xl border-l-4 border-primary bg-gradient-to-br from-primary/5 to-white">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total Records</div>
                    <div className="text-3xl font-black text-secondary">{rentals.length}</div>
                </div>
                <div className="panel rounded-2xl border-l-4 border-success bg-gradient-to-br from-success/5 to-white">
                    <div className="text-[10px] font-black text-success uppercase tracking-widest mb-1">Total Revenue</div>
                    <div className="text-3xl font-black text-secondary">₹{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="panel rounded-2xl border-l-4 border-warning bg-gradient-to-br from-warning/5 to-white">
                    <div className="text-[10px] font-black text-warning uppercase tracking-widest mb-1">Pending Collection</div>
                    <div className="text-3xl font-black text-secondary">₹{pendingRevenue.toLocaleString()}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="panel rounded-2xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Month</label>
                        <select className="form-select border-2 rounded-xl h-10 font-bold" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                            <option value="">All Months</option>
                            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Year</label>
                        <select className="form-select border-2 rounded-xl h-10 font-bold" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                            <option value="">All Years</option>
                            {Array.from({ length: 5 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Asset Type</label>
                        <select className="form-select border-2 rounded-xl h-10 font-bold" value={filterAssetType} onChange={e => setFilterAssetType(e.target.value)}>
                            <option value="">All Types</option>
                            <option value="Vehicle">Vehicle</option>
                            <option value="Machine">Machine</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setFilterMonth('');
                                setFilterYear('');
                                setFilterAssetType('');
                            }}
                            className="btn btn-outline-primary w-full h-10 rounded-xl font-bold text-sm"
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>
            </div>
            </>)}

            {/* Add/Edit Form — only when form is open */}
            {showForm && (
                <div className="panel rounded-2xl border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-primary font-black uppercase text-sm tracking-wider">
                            <IconEdit className="w-4 h-4" />
                            {editId ? 'Edit Rental Record' : 'New Rental Entry'}
                        </div>
                        <button onClick={resetForm} className="text-white-dark hover:text-danger transition-colors"><IconX className="w-5 h-5" /></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                            {/* 1. Date */}
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Date *</label>
                                <input type="date" name="date" className="form-input border-2 rounded-xl h-12 font-bold" value={formData.date} onChange={handleChange} required />
                            </div>

                            {/* 2. Asset Type Toggle */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Asset Type *</label>
                                <div className="flex bg-primary/5 p-1 rounded-2xl w-fit gap-1">
                                    {['Vehicle', 'Machine'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handleChange({ target: { name: 'assetType', value: type } })}
                                            className={`px-8 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${formData.assetType === type ? 'bg-primary text-white shadow-lg' : 'text-primary hover:bg-primary/10'}`}
                                        >
                                            {type === 'Vehicle' ? '🚛 Vehicle' : '🏗️ Machine'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Customer Name */}
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Customer / Renter Name</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="Enter customer / renter name..."
                                />
                            </div>

                            {/* 4. Select Vehicle / Machine */}
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Select {formData.assetType} *</label>
                                <select
                                    name="vehicleId"
                                    className="form-select border-2 focus:border-primary transition-all font-bold rounded-xl h-12"
                                    value={formData.vehicleId}
                                    onChange={handleVehicleSelect}
                                    required
                                >
                                    <option value="">Select {formData.assetType}...</option>
                                    {assetList.map((a: any) => (
                                        <option key={a._id} value={a._id}>
                                            {a.name} {a.vehicleNumber ? `(${a.vehicleNumber})` : a.registrationNumber ? `(${a.registrationNumber})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {assetList.length === 0 && (
                                    <p className="text-[10px] text-warning mt-1">No own {formData.assetType.toLowerCase()}s found. Add them in Machine & Vehicle section.</p>
                                )}
                            </div>

                            {/* 5. Driver / Operator Name — select from asset or manual */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest">{driverLabel}</label>
                                    <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() => { setDriverNameMode('select'); setFormData((p: any) => ({ ...p, driverName: '' })); }}
                                            className={`text-[9px] px-2 py-1 rounded-md font-black uppercase transition-all ${driverNameMode === 'select' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                        >Select</button>
                                        <button
                                            type="button"
                                            onClick={() => { setDriverNameMode('manual'); setFormData((p: any) => ({ ...p, driverName: '' })); }}
                                            className={`text-[9px] px-2 py-1 rounded-md font-black uppercase transition-all ${driverNameMode === 'manual' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                        >Type</button>
                                    </div>
                                </div>

                                {driverNameMode === 'select' ? (
                                    <select
                                        name="driverName"
                                        className="form-select border-2 focus:border-primary transition-all font-bold rounded-xl h-12"
                                        value={formData.driverName}
                                        onChange={handleChange}
                                        disabled={!formData.vehicleId}
                                    >
                                        <option value="">{formData.vehicleId ? `Select ${driverLabel}...` : `Select ${formData.assetType} first`}</option>
                                        {suggestedNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        name="driverName"
                                        className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12"
                                        value={formData.driverName}
                                        onChange={handleChange}
                                        placeholder={`Enter ${driverLabel.toLowerCase()}...`}
                                    />
                                )}
                                {driverNameMode === 'select' && formData.vehicleId && suggestedNames.length === 0 && (
                                    <p className="text-[10px] text-warning mt-1">No driver/operator recorded for this asset. Use 'Type' to enter manually.</p>
                                )}
                            </div>

                            {/* Bucket Type — only for Machines */}
                            {!isVehicle && (
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Machine Bucket Type</label>
                                    <select 
                                        name="bucketType" 
                                        className="form-select border-2 focus:border-primary transition-all font-bold rounded-xl h-12" 
                                        value={formData.bucketType} 
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Bucket...</option>
                                        <option value="Breaker">🔨 Breaker</option>
                                        <option value="Normal Bucket">🥣 Normal Bucket</option>
                                        <option value="Rock Bucket">🪨 Rock Bucket</option>
                                    </select>
                                </div>
                            )}

                            {/* Rental Type — only for Vehicles */}
                            {isVehicle && (
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Rental Type *</label>
                                    <select name="rentalType" className="form-select border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.rentalType} onChange={handleChange} required>
                                        {RENTAL_TYPES.map(s => (
                                            <option key={s} value={s}>
                                                {s === 'Day' ? '☀️ Day' : s === 'Day/Night' ? '🌙 Day / Night' : s === 'Trip' ? '🔄 Trip' : '🛣️ Kilometer'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Duration */}
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">
                                    {isVehicle ? (
                                        formData.rentalType === 'Trip' ? 'No. of Trips *' : 
                                        formData.rentalType === 'Kilometer' ? 'No. of KMs *' : 
                                        'No. of Days *'
                                    ) : 'No. of Hours *'}
                                </label>
                                <input type="number" name="duration" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.duration} onChange={handleChange} min="0.5" step="0.5" required />
                            </div>

                            {/* Rate */}
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">
                                    {isVehicle ? (
                                        formData.rentalType === 'Trip' ? 'Rate per Trip (₹) *' : 
                                        formData.rentalType === 'Kilometer' ? 'Rate per KM (₹) *' : 
                                        formData.rentalType === 'Day/Night' ? 'Rate per Day/Night (₹) *' :
                                        'Rate per Day (₹) *'
                                    ) : 'Rate per Hour (₹) *'}
                                </label>
                                <input type="number" name="rate" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.rate} onChange={handleChange} min="0" required />
                            </div>

                            {/* Total Amount (auto-calculated) */}
                            <div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">Total Amount (₹)</label>
                                <div className="form-input border-2 border-primary/40 rounded-xl h-12 flex items-center font-black text-lg text-primary bg-primary/5">
                                    ₹{Number(formData.totalAmount).toLocaleString()}
                                </div>
                            </div>

                            {/* Specific fields for Machines */}
                            {!isVehicle && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Start Time</label>
                                        <input type="time" name="startTime" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.startTime} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">End Time</label>
                                        <input type="time" name="endTime" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.endTime} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Operator Bata (₹)</label>
                                        <input type="number" name="operatorBata" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.operatorBata} onChange={handleChange} min="0" />
                                    </div>
                                </>
                            )}

                            {/* Payment Status */}
                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Payment Status</label>
                                <select name="paymentStatus" className="form-select border-2 focus:border-success transition-all font-bold rounded-xl h-12" value={formData.paymentStatus} onChange={handleChange}>
                                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Description / Remarks</label>
                                <textarea name="description" className="form-textarea border-2 focus:border-primary transition-all font-bold rounded-xl" rows={2} value={formData.description} onChange={handleChange} placeholder="Optional notes..." />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 justify-end">
                            <button type="button" onClick={resetForm} className="btn btn-outline-danger rounded-xl font-bold">Cancel</button>
                            <button type="submit" className="btn btn-primary rounded-xl font-bold px-8">
                                {editId ? 'Update Record' : 'Save Rental'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Records Table — only when form is hidden */}
            {!showForm && (
            <div className="panel rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 font-black text-primary uppercase text-xs tracking-wider mb-4">
                    <span>Rental Records</span>
                    <span className="badge badge-outline-primary">{rentals.length}</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span></div>
                ) : rentals.length === 0 ? (
                    <div className="text-center py-12 text-white-dark">
                        <div className="text-5xl mb-3">🏗️</div>
                        <p className="font-bold">No rental records found for this period.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table-hover w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5 text-[10px] uppercase tracking-wider font-black text-secondary">
                                    <th className="py-3 px-3 text-left">Date</th>
                                    <th className="py-3 px-3 text-left">Type</th>
                                    <th className="py-3 px-3 text-left">Customer</th>
                                    <th className="py-3 px-3 text-left">Asset</th>
                                    <th className="py-3 px-3 text-left">Driver / Operator</th>
                                    <th className="py-3 px-3 text-left">Rental Detail</th>
                                    <th className="py-3 px-3 text-left">Duration</th>
                                    <th className="py-3 px-3 text-left">Rate</th>
                                    <th className="py-3 px-3 text-left">Total</th>
                                    <th className="py-3 px-3 text-left">Status</th>
                                    <th className="py-3 px-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentals.map((r: any) => (
                                    <tr key={r._id} className="border-b border-[#eee] hover:bg-primary/5 transition-colors">
                                        <td className="py-3 px-3 font-bold whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                        <td className="py-3 px-3">
                                            <span className={`badge ${r.assetType === 'Vehicle' ? 'badge-outline-secondary' : 'badge-outline-info'}`}>
                                                {r.assetType === 'Vehicle' ? '🚛 Vehicle' : '🏗️ Machine'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-medium">{r.customerName || '-'}</td>
                                        <td className="py-3 px-3">
                                            <div className="font-bold">{r.vehicleId?.name || '-'}</div>
                                            <div className="text-[10px] text-white-dark">{r.vehicleId?.vehicleNumber || r.vehicleId?.registrationNumber || ''}</div>
                                        </td>
                                        <td className="py-3 px-3 font-medium">
                                            {r.driverName || '-'}
                                            {r.assetType === 'Machine' && r.bucketType && (
                                                <div className="text-[9px] text-primary font-bold uppercase mt-1 px-2 py-0.5 bg-primary/10 rounded-md w-fit whitespace-nowrap">
                                                    {r.bucketType}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-3">
                                            {r.assetType === 'Vehicle' ? (
                                                <span className="badge badge-outline-primary text-[10px]">{r.rentalType || 'Day'}</span>
                                            ) : (
                                                <span className="text-xs text-white-dark">
                                                    {r.startTime && r.endTime ? `${r.startTime} – ${r.endTime}` : 'Per Hour'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 font-bold">
                                            {r.duration} {r.assetType === 'Vehicle' ? (
                                                r.rentalType === 'Trip' ? 'Trips' : 
                                                r.rentalType === 'Kilometer' ? 'KMs' : 
                                                'Day(s)'
                                            ) : 'Hr(s)'}
                                        </td>
                                        <td className="py-3 px-3">₹{(r.rate || 0).toLocaleString()}</td>
                                        <td className="py-3 px-3 font-black text-primary">
                                            ₹{(r.totalAmount || 0).toLocaleString()}
                                            {r.operatorBata > 0 && (
                                                <div className="text-[9px] text-white-dark font-bold uppercase tracking-tighter">
                                                    Incl. ₹{r.operatorBata} Bata
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={`badge text-[10px] font-black ${
                                                r.paymentStatus === 'Paid' ? 'badge-outline-success' :
                                                r.paymentStatus === 'Partial' ? 'badge-outline-warning' :
                                                'badge-outline-danger'
                                            }`}>{r.paymentStatus}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEdit(r)} className="btn btn-sm btn-outline-primary rounded-lg p-1.5" title="Edit">
                                                    <IconEdit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(r._id)} className="btn btn-sm btn-outline-danger rounded-lg p-1.5" title="Delete">
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-primary/5 font-black text-sm">
                                    <td colSpan={8} className="py-3 px-3 text-right text-secondary uppercase tracking-wider">Grand Total:</td>
                                    <td className="py-3 px-3 text-primary text-base">₹{totalRevenue.toLocaleString()}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
            )}

            <DeleteConfirmModal show={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Rental Record" message="Are you sure you want to delete this rental record? This action cannot be undone." />
        </div>
    );
};

export default RentalManagement;
