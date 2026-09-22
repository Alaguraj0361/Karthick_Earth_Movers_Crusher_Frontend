'use client';
import React, { useState, useEffect } from 'react';
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
        slipType: 'Outward', // 'Outward' (Customer) | 'Inward' (Supplier)
        firstWeighType: 'Loaded Vehicle (Gross)', // 'Loaded Vehicle (Gross)' | 'Empty Vehicle (Tare)'
        partyCategory: 'Customer',
        slipDate: new Date().toISOString().split('T')[0],
        slipTime: new Date().toTimeString().slice(0, 5),
        entryGate: 'Gate 1',
        vehicleNumber: '',
        driverName: '',
        driverMobile: '',
        transportCompany: '',
        partyName: '',
        partyId: '',
        partyModel: 'Customer',
        material: '',
        purpose: 'Sale',
        initialWeight: '',
        challanNo: '',
        volumeM3: '',
        moisturePercentage: '0',
        weighbridgeCharges: '0',
        operatorName: 'admin',
        remarks: '',
    });

    useEffect(() => {
        fetchDropdowns();
    }, []);

    const handleSlipTypeChange = (type: 'Outward' | 'Inward') => {
        if (type === 'Outward') {
            setForm(f => ({
                ...f,
                slipType: 'Outward',
                partyCategory: 'Customer',
                partyModel: 'Customer',
                purpose: 'Sale',
                partyId: '',
                partyName: ''
            }));
        } else {
            setForm(f => ({
                ...f,
                slipType: 'Inward',
                partyCategory: 'Supplier',
                partyModel: 'Supplier',
                purpose: 'Purchase',
                partyId: '',
                partyName: ''
            }));
        }
    };

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

        if (name === 'vehicleNumber') {
            const cleaned = value.toUpperCase().replace(/\s/g, '');
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (cleaned.length >= 5) {
                debounceRef.current = setTimeout(async () => {
                    setLookingUpTare(true);
                    try {
                        const res = await api.get(`/weighment/vehicle-tare?vehicleNumber=${encodeURIComponent(cleaned)}`);
                        if (res.data.found && res.data.data) {
                            if (res.data.data.driverName && !form.driverName) {
                                setForm(f => ({ ...f, driverName: res.data.data.driverName }));
                            }
                            if (res.data.data.hasStoredTare) {
                                const tareVal = res.data.data.emptyWeightMT;
                                setVehicleTare({
                                    emptyWeightMT: tareVal,
                                    updatedAt: res.data.data.emptyWeightUpdatedAt
                                });
                                // Auto-fill weight if first weigh type is Empty Vehicle (Tare) or initial weight is empty
                                setForm(f => ({
                                    ...f,
                                    driverName: res.data.data.driverName || f.driverName,
                                    initialWeight: f.firstWeighType === 'Empty Vehicle (Tare)' ? String(tareVal) : f.initialWeight
                                }));
                            }
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

        if (name === 'partyId') {
            const list = form.slipType === 'Inward' ? suppliers : customers;
            const found = list.find((p: any) => p._id === value);
            if (found) setForm(f => ({ ...f, partyId: value, partyName: found.name }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.vehicleNumber.trim()) {
            return Swal.fire({
                icon: 'warning',
                title: 'Vehicle Number Required',
                text: 'Please enter a valid vehicle registration number',
                customClass: {
                    popup: 'rounded-2xl p-6 border border-[#f5d49e]/50 shadow-2xl',
                    confirmButton: 'btn bg-[#e79b21] hover:bg-[#cf8716] text-white font-bold px-5 py-2.5 rounded-xl text-xs border-0 cursor-pointer'
                },
                buttonsStyling: false
            });
        }
        if (form.firstWeighType === 'Loaded Vehicle (Gross)' && !form.material) {
            return Swal.fire({
                icon: 'warning',
                title: 'Material Required',
                text: 'Please select an aggregate material for loaded vehicle weighment',
                customClass: {
                    popup: 'rounded-2xl p-6 border border-[#f5d49e]/50 shadow-2xl',
                    confirmButton: 'btn bg-[#e79b21] hover:bg-[#cf8716] text-white font-bold px-5 py-2.5 rounded-xl text-xs border-0 cursor-pointer'
                },
                buttonsStyling: false
            });
        }
        if (!form.initialWeight || parseFloat(form.initialWeight) <= 0) {
            return Swal.fire({
                icon: 'warning',
                title: 'Weight Required',
                text: 'Please enter a valid 1st weighment reading in Metric Tons (MT)',
                customClass: {
                    popup: 'rounded-2xl p-6 border border-[#f5d49e]/50 shadow-2xl',
                    confirmButton: 'btn bg-[#e79b21] hover:bg-[#cf8716] text-white font-bold px-5 py-2.5 rounded-xl text-xs border-0 cursor-pointer'
                },
                buttonsStyling: false
            });
        }

        setLoading(true);
        try {
            const isEmptyEntry = form.firstWeighType === 'Empty Vehicle (Tare)';
            const payload = {
                ...form,
                vehicleNumber: form.vehicleNumber.toUpperCase().trim(),
                partyId: form.partyId || undefined,
                material: isEmptyEntry ? undefined : (form.material || undefined),
                firstWeighType: form.firstWeighType,
                tareWeight: isEmptyEntry ? parseFloat(form.initialWeight) : 0,
                grossWeight: isEmptyEntry ? 0 : parseFloat(form.initialWeight),
            };
            const res = await api.post('/weighment', payload);
            const slip = res.data.data;

            await Swal.fire({
                html: `
                    <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 2px;">
                        <div style="width: 58px; height: 58px; border-radius: 50%; background: #fdf5e8; border: 2px solid #e79b21; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin: 4px auto 12px auto; box-shadow: 0 4px 14px rgba(231,155,33,0.22);">
                            ${isEmptyEntry ? '🚛' : '🚚'}
                        </div>
                        <h3 style="font-size: 20px; font-weight: 900; color: #032237; margin: 0 0 4px 0; letter-spacing: -0.2px;">
                            ${isEmptyEntry ? 'Step 1 Empty Tare Entry Created!' : 'Step 1 Gross Entry Created!'}
                        </h3>
                        <p style="font-size: 12px; color: #78829d; margin: 0 0 14px 0; font-weight: 600;">முதல் எடை பதிவு வெற்றிகரமாக உருவாக்கப்பட்டது</p>

                        <div style="background: #ffffff; border: 1.5px solid #e79b21; border-radius: 14px; padding: 16px; box-shadow: 0 4px 18px rgba(231,155,33,0.08); text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #f5d49e; padding-bottom: 10px; margin-bottom: 12px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 13px;">📄</span>
                                    <span style="font-size: 11px; font-weight: 900; color: #032237; text-transform: uppercase; letter-spacing: 0.5px;">WEIGHMENT SLIP</span>
                                </div>
                                <span style="background: #fdf5e8; color: #e79b21; font-weight: 900; font-family: monospace; font-size: 13px; padding: 3px 10px; border-radius: 8px; border: 1px solid #f5d49e;">
                                    ${slip.slipNumber}
                                </span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                                <div style="background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Vehicle No</span>
                                    <b style="font-size: 13px; font-family: monospace; color: #032237;">${slip.vehicleNumber}</b>
                                </div>
                                <div style="background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Direction</span>
                                    <b style="color: ${form.slipType === 'Inward' ? '#16a34a' : '#e79b21'}; font-weight: 800;">${slip.slipType} (${form.slipType === 'Inward' ? 'Supplier' : 'Customer'})</b>
                                </div>
                                <div style="background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Party Name</span>
                                    <b style="color: #032237; font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${slip.partyName || '—'}</b>
                                </div>
                                <div style="background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Material</span>
                                    <b style="color: #032237; font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${products.find(p => p._id === form.material)?.name || '—'}</b>
                                </div>
                            </div>
                            <div style="background: #fdf5e8; border: 1.5px solid #f5d49e; border-radius: 10px; padding: 10px 14px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 11px; font-weight: 800; color: #032237; text-transform: uppercase;">1st Weight Captured:</span>
                                <span style="font-size: 16px; font-weight: 900; color: #e79b21; font-family: monospace;">
                                    ${form.initialWeight} MT <span style="font-size: 11px; font-weight: 700; color: #64748b;">(${isEmptyEntry ? 'Empty Tare' : 'Loaded Gross'})</span>
                                </span>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 14px;">
                            <span style="background: #fdf5e8; color: #b45309; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; border: 1px solid #fde68a; display: inline-block;">
                                ⏳ STEP 1 OPEN — Awaiting 2nd Weight
                            </span>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: '🖨️ Print Slip',
                denyButtonText: '➡️ Step 2 (Close)',
                cancelButtonText: '📋 View Register',
                customClass: {
                    popup: 'rounded-2xl p-6 border border-[#f5d49e]/50 shadow-2xl',
                    confirmButton: 'btn bg-[#e79b21] hover:bg-[#cf8716] text-white font-extrabold px-5 py-2.5 mx-1 rounded-xl text-xs shadow-md shadow-[#e79b21]/30 transition-all border-0 cursor-pointer',
                    denyButton: 'btn bg-[#032237] hover:bg-[#053556] text-white font-bold px-5 py-2.5 mx-1 rounded-xl text-xs transition-all border-0 cursor-pointer',
                    cancelButton: 'btn bg-[#032237]/10 hover:bg-[#032237]/20 text-[#032237] dark:text-gray-200 font-bold px-4 py-2.5 mx-1 rounded-xl text-xs border border-[#032237]/20 transition-all cursor-pointer'
                },
                buttonsStyling: false
            }).then(result => {
                if (result.isConfirmed) {
                    window.open(`/weighment/print/${slip._id}`, '_blank');
                    router.push('/weighment/register');
                } else if (result.isDenied) {
                    router.push('/weighment/close');
                } else {
                    router.push('/weighment/register');
                }
            });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.error || 'Failed to create weighment slip',
                customClass: {
                    popup: 'rounded-2xl p-6 border border-[#f5d49e]/50 shadow-2xl',
                    confirmButton: 'btn bg-[#e79b21] hover:bg-[#cf8716] text-white font-bold px-5 py-2.5 rounded-xl text-xs border-0 cursor-pointer'
                },
                buttonsStyling: false
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel max-w-4xl mx-auto shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl shadow-lg">🚛</div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">1st Weighment Entry (முதல் எடை பதிவேடு)</h1>
                        <p className="text-sm text-gray-500">Record vehicle details, customer/supplier, material, and 1st weighbridge reading</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Entry Slip Type Selector (Outward Customer vs Inward Supplier) */}
                <div>
                    <label className="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Weighment Direction (எடை பதிவேடு திசை) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSlipTypeChange('Outward')}
                            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                form.slipType === 'Outward'
                                    ? 'bg-orange-600 text-white border-orange-600 shadow-md scale-102'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-500'
                            }`}
                        >
                            <span className="font-bold text-sm">⬆️ Outward Sale (வாடிக்கையாளர் விற்பனை - Customer)</span>
                            <span className="text-[11px] opacity-80 mt-0.5">Dispatched material loaded into customer vehicle</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSlipTypeChange('Inward')}
                            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                form.slipType === 'Inward'
                                    ? 'bg-green-600 text-white border-green-600 shadow-md scale-102'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-500'
                            }`}
                        >
                            <span className="font-bold text-sm">⬇️ Inward Purchase (சப்ளையர் கொள்முதல் - Supplier)</span>
                            <span className="text-[11px] opacity-80 mt-0.5">Raw material stone / supplies arriving from supplier</span>
                        </button>
                    </div>
                </div>

                {/* First Weight Stage Selector (Gross First vs Tare First) */}
                <div>
                    <label className="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                        1st Weighment Type (முதல் எடை வகை) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'Loaded Vehicle (Gross)', label: '🚚 Loaded Vehicle (Gross Weight)', sub: 'Vehicles carrying material (Standard Entry)' },
                            { id: 'Empty Vehicle (Tare)', label: '🚛 Empty Vehicle (Tare Weight)', sub: 'Empty truck entering for initial tare recording' }
                        ].map(stage => (
                            <button
                                key={stage.id}
                                type="button"
                                onClick={() => setForm(f => ({
                                    ...f,
                                    firstWeighType: stage.id,
                                    initialWeight: (stage.id === 'Empty Vehicle (Tare)' && vehicleTare) ? String(vehicleTare.emptyWeightMT) : ''
                                }))}
                                className={`p-3 rounded-xl border flex flex-col items-start transition-all ${
                                    form.firstWeighType === stage.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-500'
                                }`}
                            >
                                <span className="font-bold text-xs">{stage.label}</span>
                                <span className="text-[10px] opacity-80 mt-0.5">{stage.sub}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vehicle & Driver Details */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <h3 className="text-xs font-black text-primary uppercase tracking-wider">Vehicle & Driver Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="vehicleNumber"
                                value={form.vehicleNumber}
                                onChange={handleChange}
                                placeholder="e.g. TN 38 AB 1234"
                                className="form-input font-bold uppercase text-lg"
                                required
                            />
                            {lookingUpTare && <p className="text-[10px] text-blue-500 font-bold mt-1 animate-pulse">🔍 Checking vehicle tare master...</p>}
                            {!lookingUpTare && vehicleTare && (
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, initialWeight: String(vehicleTare.emptyWeightMT) }))}
                                    className="mt-1 flex items-center gap-1 px-2 py-0.5 bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 rounded text-[11px] font-bold hover:bg-teal-100 transition shadow-xs"
                                    title="Click to auto-fill saved empty weight"
                                >
                                    💾 Saved Empty Weight: <b className="text-teal-800 dark:text-teal-200">{vehicleTare.emptyWeightMT} MT</b>
                                    <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-200 dark:bg-teal-800 px-1 rounded ml-1">⚡ Auto-Fill</span>
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Driver Name</label>
                            <input type="text" name="driverName" value={form.driverName} onChange={handleChange} placeholder="Driver Name" className="form-input font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Driver Mobile No.</label>
                            <input type="text" name="driverMobile" value={form.driverMobile} onChange={handleChange} placeholder="e.g. 9876543210" className="form-input font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Transport Company</label>
                            <input type="text" name="transportCompany" value={form.transportCompany} onChange={handleChange} placeholder="Lorry Transport Name" className="form-input font-bold" />
                        </div>
                        {form.firstWeighType === 'Loaded Vehicle (Gross)' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Challan No (சலான் எண்)</label>
                                    <input type="text" name="challanNo" value={form.challanNo} onChange={handleChange} placeholder="e.g. 24" className="form-input font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Concrete Design Vol (m³)</label>
                                    <input type="number" step="0.001" name="volumeM3" value={form.volumeM3} onChange={handleChange} placeholder="e.g. 19.760" className="form-input font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Moisture (%) (ஈரப்பதம் சதவீதம்)</label>
                                    <input type="number" step="0.1" name="moisturePercentage" value={form.moisturePercentage} onChange={handleChange} placeholder="0" className="form-input font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Weigh Operator Name</label>
                                    <input type="text" name="operatorName" value={form.operatorName} onChange={handleChange} placeholder="admin" className="form-input font-bold" />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Entry Date &amp; Time</label>
                            <div className="flex gap-2">
                                <input type="date" name="slipDate" value={form.slipDate} onChange={handleChange} className="form-input text-xs font-bold" required />
                                <input type="time" name="slipTime" value={form.slipTime} onChange={handleChange} className="form-input text-xs font-bold" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Party Name & Product Selection */}
                <div className={`grid grid-cols-1 ${form.firstWeighType === 'Loaded Vehicle (Gross)' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-black text-primary uppercase tracking-wider mb-3">
                            {form.slipType === 'Inward' ? '🏬 Supplier Selection (சப்ளையர்)' : '👤 Customer Selection (வாடிக்கையாளர்)'}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Select Registered {form.slipType === 'Inward' ? 'Supplier' : 'Customer'}
                                </label>
                                <select name="partyId" value={form.partyId} onChange={handleChange} className="form-select font-bold">
                                    <option value="">-- Choose Registered {form.slipType === 'Inward' ? 'Supplier' : 'Customer'} --</option>
                                    {(form.slipType === 'Inward' ? suppliers : customers).map((p: any) => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Or Type Name Manually</label>
                                <input type="text" name="partyName" value={form.partyName} onChange={handleChange} placeholder={`${form.slipType === 'Inward' ? 'Supplier' : 'Customer'} Company Name`} className="form-input font-bold" />
                            </div>
                        </div>
                    </div>

                    {form.firstWeighType === 'Loaded Vehicle (Gross)' && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs font-black text-primary uppercase tracking-wider mb-3">Product Selection (பொருள்)</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Select Aggregate Material <span className="text-red-500">*</span></label>
                                <select name="material" value={form.material} onChange={handleChange} className="form-select font-bold text-base" required>
                                    <option value="">-- Choose Material (Jelly 40mm, M-Sand, etc.) --</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.unit})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual Weight Entry Section */}
                <div className={`p-5 rounded-2xl border-2 transition-all ${
                    form.firstWeighType === 'Loaded Vehicle (Gross)'
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-400 dark:border-blue-600'
                        : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600'
                }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <label className={`block text-sm font-black uppercase tracking-wide ${
                            form.firstWeighType === 'Loaded Vehicle (Gross)' ? 'text-blue-900 dark:text-blue-200' : 'text-amber-900 dark:text-amber-200'
                        }`}>
                            {form.firstWeighType === 'Loaded Vehicle (Gross)'
                                ? '🚚 1st Weight — Gross Weight (பார எடை - MT)'
                                : '🚛 1st Weight — Tare Weight (வெற்று எடை - MT)'} <span className="text-red-500">*</span>
                        </label>
                        {form.initialWeight && !isNaN(parseFloat(form.initialWeight)) && parseFloat(form.initialWeight) > 0 && (
                            <span className="text-xs font-mono font-bold bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm text-gray-700 dark:text-gray-300">
                                = {Math.round(parseFloat(form.initialWeight) * 1000).toLocaleString('en-IN')} kg
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            name="initialWeight"
                            value={form.initialWeight}
                            onChange={handleChange}
                            placeholder="0.000"
                            step="0.001"
                            min="0"
                            className={`form-input text-3xl font-black font-mono tracking-wider h-14 pl-4 pr-16 rounded-xl border-2 ${
                                form.firstWeighType === 'Loaded Vehicle (Gross)' 
                                    ? 'text-blue-700 dark:text-blue-300 focus:border-blue-600' 
                                    : 'text-amber-700 dark:text-amber-300 focus:border-amber-600'
                            }`}
                            autoFocus
                            required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-400 text-sm pointer-events-none">
                            MT
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Enter 1st weighment reading in <b>Metric Tons (MT)</b>. 2nd weighment will be entered after Loading/Unloading.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Remarks / Entry Notes</label>
                    <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={2} placeholder="Optional entry remarks..." className="form-textarea font-medium" />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-3.5 text-base font-bold rounded-xl shadow-lg"
                    id="submit-weighment-entry"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Creating Entry...
                        </span>
                    ) : (
                        `⚖️ Save 1st Weighment & Generate Ticket`
                    )}
                </button>
            </form>
        </div>
    );
};

export default WeighmentEntryForm;
