'use client';
import React, { useState, useEffect, useRef } from 'react';
import api from '@/utils/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

interface ProductType {
    _id: string;
    name: string;
    category: string;
    unit: string;
}
interface Customer {
    _id: string;
    name: string;
}
interface Supplier {
    _id: string;
    name: string;
}

const WeighmentEntryForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductType[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [vehicleTare, setVehicleTare] = useState<{ emptyWeightMT: number; updatedAt?: string } | null>(null);
    const [lookingUpTare, setLookingUpTare] = useState(false);
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    const [form, setForm] = useState({
        slipType: 'Inward',
        slipDate: new Date().toISOString().split('T')[0],
        slipTime: new Date().toTimeString().slice(0, 5),
        vehicleNumber: '',
        driverName: '',
        partyName: '',
        partyId: '',
        partyModel: 'Supplier',
        material: '',
        purpose: 'Purchase',
        grossWeight: '',
        remarks: '',
    });

    useEffect(() => {
        fetchDropdowns();
    }, []);

    useEffect(() => {
        // Auto-set purpose and partyModel based on slipType
        if (form.slipType === 'Inward') {
            setForm(f => ({ ...f, purpose: 'Purchase', partyModel: 'Supplier', partyId: '' }));
        } else {
            setForm(f => ({ ...f, purpose: 'Sale', partyModel: 'Customer', partyId: '' }));
        }
    }, [form.slipType]);

    const fetchDropdowns = async () => {
        try {
            const [prodRes, custRes, suppRes] = await Promise.all([
                api.get('/products?status=active'),
                api.get('/customers?status=active'),
                api.get('/suppliers?status=active'),
            ]);
            setProducts(prodRes.data.data || []);
            setCustomers(custRes.data.data || []);
            setSuppliers(suppRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch dropdowns', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));

        // Auto-lookup vehicle tare when vehicle number is typed
        if (name === 'vehicleNumber') {
            const cleaned = value.toUpperCase().replace(/\s/g, '');
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (cleaned.length >= 5) {
                debounceRef.current = setTimeout(async () => {
                    setLookingUpTare(true);
                    try {
                        const res = await api.get(`/weighment/vehicle-tare?vehicleNumber=${encodeURIComponent(cleaned)}`);
                        if (res.data.found && res.data.data?.hasStoredTare) {
                            setVehicleTare({
                                emptyWeightMT: res.data.data.emptyWeightMT,
                                updatedAt: res.data.data.emptyWeightUpdatedAt
                            });
                        } else {
                            setVehicleTare(null);
                        }
                    } catch {
                        setVehicleTare(null);
                    } finally {
                        setLookingUpTare(false);
                    }
                }, 600);
            } else {
                setVehicleTare(null);
            }
        }

        // Auto-fill party name when party selected from dropdown
        if (name === 'partyId') {
            const list = form.partyModel === 'Supplier' ? suppliers : customers;
            const found = list.find((p: any) => p._id === value);
            if (found) setForm(f => ({ ...f, partyId: value, partyName: found.name }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.vehicleNumber.trim()) return Swal.fire('Error', 'Vehicle number is required', 'error');
        if (!form.material) return Swal.fire('Error', 'Please select material', 'error');
        if (!form.grossWeight || parseFloat(form.grossWeight) <= 0) return Swal.fire('Error', 'Please enter gross weight', 'error');

        setLoading(true);
        try {
            const payload = {
                ...form,
                grossWeight: parseFloat(form.grossWeight),
                vehicleNumber: form.vehicleNumber.toUpperCase().trim(),
            };
            const res = await api.post('/weighment', payload);
            const slip = res.data.data;

            await Swal.fire({
                icon: 'success',
                title: 'Weighment Slip Created!',
                html: `
                    <div style="text-align:left; font-size:14px; line-height:1.8">
                        <b>Slip No:</b> ${slip.slipNumber}<br/>
                        <b>Vehicle:</b> ${slip.vehicleNumber}<br/>
                        <b>Gross Weight:</b> ${slip.grossWeight} MT<br/>
                        <b>Status:</b> <span style="color:orange">OPEN — Awaiting 2nd Weigh</span>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Close Another Slip',
                cancelButtonText: 'Go to Register',
            }).then(result => {
                if (result.isConfirmed) {
                    router.push('/weighment/close');
                } else {
                    router.push('/weighment/register');
                }
            });
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to create weighment slip', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        form.slipType === 'Inward' ? p.category !== 'Output' : p.category !== 'Input'
    );

    return (
        <div className="panel max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">⚖️</div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Weighment Entry</h1>
                    <p className="text-sm text-gray-500">1st Weigh — Records gross weight and opens the slip</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Slip Type Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    {(['Inward', 'Outward'] as const).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, slipType: type }))}
                            className={`py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                form.slipType === type
                                    ? type === 'Inward'
                                        ? 'bg-green-500 text-white shadow-md'
                                        : 'bg-orange-500 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {type === 'Inward' ? '⬇️ INWARD' : '⬆️ OUTWARD'}
                        </button>
                    ))}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date <span className="text-red-500">*</span></label>
                        <input type="date" name="slipDate" value={form.slipDate} onChange={handleChange} className="form-input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                        <input type="time" name="slipTime" value={form.slipTime} onChange={handleChange} className="form-input" />
                    </div>
                </div>

                {/* Vehicle */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="vehicleNumber"
                            value={form.vehicleNumber}
                            onChange={handleChange}
                            placeholder="e.g. TN 01 AB 1234"
                            className="form-input uppercase"
                            required
                        />
                        {/* Vehicle tare info badge */}
                        {lookingUpTare && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <span className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full inline-block"></span>
                                Looking up vehicle...
                            </p>
                        )}
                        {!lookingUpTare && vehicleTare && (
                            <div className="mt-1 px-2 py-1.5 bg-teal-50 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-700 rounded-lg flex items-center gap-2 text-xs">
                                <span>💾</span>
                                <span className="text-teal-800 dark:text-teal-300">
                                    Stored tare: <b>{vehicleTare.emptyWeightMT} MT</b>
                                    {vehicleTare.updatedAt && <span className="text-teal-500 ml-1">(verified {new Date(vehicleTare.updatedAt).toLocaleDateString('en-IN')})</span>}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver Name</label>
                        <input type="text" name="driverName" value={form.driverName} onChange={handleChange} placeholder="Driver name" className="form-input" />
                    </div>
                </div>

                {/* Party */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {form.slipType === 'Inward' ? 'Supplier' : 'Customer'}
                        </label>
                        <select name="partyId" value={form.partyId} onChange={handleChange} className="form-select">
                            <option value="">-- Select {form.slipType === 'Inward' ? 'Supplier' : 'Customer'} --</option>
                            {(form.slipType === 'Inward' ? suppliers : customers).map((p: any) => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Party Name (Manual)</label>
                        <input type="text" name="partyName" value={form.partyName} onChange={handleChange} placeholder="Or type manually" className="form-input" />
                    </div>
                </div>

                {/* Material & Purpose */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material <span className="text-red-500">*</span></label>
                        <select name="material" value={form.material} onChange={handleChange} className="form-select" required>
                            <option value="">-- Select Material --</option>
                            {filteredProducts.map(p => (
                                <option key={p._id} value={p._id}>{p.name} ({p.unit})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                        <select name="purpose" value={form.purpose} onChange={handleChange} className="form-select">
                            {form.slipType === 'Inward'
                                ? <><option value="Purchase">Purchase</option><option value="Return">Return</option><option value="Internal">Internal</option></>
                                : <><option value="Sale">Sale</option><option value="Return">Return</option><option value="Internal">Internal</option></>
                            }
                        </select>
                    </div>
                </div>

                {/* Gross Weight */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                        🏋️ Gross Weight (MT) — 1st Weigh (Loaded Vehicle) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="grossWeight"
                        value={form.grossWeight}
                        onChange={handleChange}
                        placeholder="Enter gross weight in Metric Tons"
                        step="0.001"
                        min="0"
                        className="form-input text-xl font-bold text-blue-700 dark:text-blue-300"
                        required
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Tare weight will be entered when vehicle returns empty (2nd weigh).</p>
                </div>

                {/* Remarks */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                    <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={2} placeholder="Optional notes..." className="form-textarea" />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-3 text-base font-bold rounded-xl"
                    id="submit-weighment-entry"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Creating Slip...
                        </span>
                    ) : `⚖️ Create ${form.slipType} Weighment Slip`}
                </button>
            </form>
        </div>
    );
};

export default WeighmentEntryForm;
