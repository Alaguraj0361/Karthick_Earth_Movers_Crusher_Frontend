'use client';
import React, { useState, useEffect, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import IconSave from '@/components/icon/icon-save';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSearch from '@/components/icon/icon-search';
import IconCalendar from '@/components/icon/icon-calendar';
import api, { getFileUrl } from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';

const PoliceExpenseManagement = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [ownVehicles, setOwnVehicles] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [formData, setFormData] = useState({
        _id: '',
        category: 'Police',
        date: new Date().toISOString().split('T')[0],
        vehicleOwnership: 'Own', // 'Own' or 'Vendor'
        transportVendorId: '',
        vehicleNumber: '',
        contractorName: '',
        policeTime: '',
        fromLocation: '',
        amount: '',
        billUrl: '',
        description: ''
    });

    const [filterDate, setFilterDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOwnership, setFilterOwnership] = useState('');
    const [filterContractor, setFilterContractor] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');

    useEffect(() => {
        fetchInitialData();
        fetchExpenses();
    }, []);

    const fetchInitialData = async () => {
        setLoadingData(true);
        try {
            const [vendorRes, vehicleRes] = await Promise.all([
                api.get('/vendors/transport'),
                api.get('/master/vehicles')
            ]);
            if (vendorRes.data.success) setVendors(vendorRes.data.data);
            if (vehicleRes.data.success) setOwnVehicles(vehicleRes.data.data);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/expenses', { params: { category: 'Police' } });
            if (data.success) setExpenses(data.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            let fileToUpload = file;

            // Converter for JFIF to JPG
            if (file.name.toLowerCase().endsWith('.jfif')) {
                const convertedFile = await new Promise<File>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0);
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' }));
                                } else {
                                    reject(new Error('Canvas to Blob conversion failed'));
                                }
                            }, 'image/jpeg', 0.8);
                        };
                        img.onerror = () => reject(new Error('Image load failed'));
                        img.src = e.target?.result as string;
                    };
                    reader.onerror = () => reject(new Error('File reader failed'));
                    reader.readAsDataURL(file);
                });
                fileToUpload = convertedFile;
            }

            const uploadData = new FormData();
            uploadData.append('bill', fileToUpload);
            const { data } = await api.post('/upload', uploadData);
            if (data.success) {
                setFormData(prev => ({ ...prev, billUrl: data.filePath }));
                showToast('Bill uploaded successfully', 'success');
            }
        } catch (error: any) {
            showToast('Upload failed: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.date || !formData.vehicleNumber) {
            showToast('Please fill required fields (Date, Vehicle, Amount)', 'error');
            return;
        }

        try {
            const payload = { ...formData, amount: Number(formData.amount) };
            let res;
            if (editMode && formData._id) {
                res = await api.put(`/expenses/${formData._id}`, payload);
            } else {
                const { _id, ...newPayload } = payload;
                res = await api.post('/expenses', newPayload);
            }

            if (res.data.success) {
                showToast(`Expense ${editMode ? 'updated' : 'added'} successfully`, 'success');
                resetForm();
                fetchExpenses();
            }
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Action failed', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            _id: '',
            category: 'Police',
            date: new Date().toISOString().split('T')[0],
            vehicleOwnership: 'Own',
            transportVendorId: '',
            vehicleNumber: '',
            contractorName: '',
            policeTime: '',
            fromLocation: '',
            amount: '',
            billUrl: '',
            description: ''
        });
        setSelectedFile(null);
        setEditMode(false);
        setShowForm(false);
    };

    const handleEdit = (expense: any) => {
        setFormData({
            ...expense,
            amount: expense.amount.toString(),
            date: expense.date.split('T')[0]
        });
        setEditMode(true);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            const { data } = await api.delete(`/expenses/${id}`);
            if (data.success) {
                showToast('Deleted successfully', 'success');
                fetchExpenses();
            }
        } catch (error) {
            showToast('Delete failed', 'error');
        }
    };

    const selectedVendor = vendors.find(v => v._id === formData.transportVendorId);
    const vendorVehicles = selectedVendor?.vehicles || [];
    const filteredExpenses = expenses.filter(exp => {
        const matchesDate = !filterDate || exp.date.startsWith(filterDate);
        const matchesSearch = !searchTerm || 
            exp.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.fromLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.contractorName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesOwnership = !filterOwnership || exp.vehicleOwnership === filterOwnership;
        
        // Match transport/contractor name for filter
        let expContractorName = exp.contractorName || '';
        if (!expContractorName && exp.vehicleOwnership === 'Vendor') {
            expContractorName = vendors.find(v => v._id === exp.transportVendorId)?.name || '';
        }
        const matchesContractor = !filterContractor || expContractorName.includes(filterContractor) || (exp.transportVendorId === filterContractor);
        const matchesVehicle = !filterVehicle || exp.vehicleNumber === filterVehicle;

        return matchesDate && matchesSearch && matchesOwnership && matchesContractor && matchesVehicle;
    });

    return (
        <div className="panel p-0 border-0 overflow-hidden mb-5">
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f1f2f3] dark:border-[#1b1b1b]">
                <div>
                    <h5 className="text-lg font-black uppercase tracking-tighter text-[#3b3f5c] dark:text-white-light">
                        Police Expense Management
                    </h5>
                    <p className="text-xs font-bold text-white-dark mt-1">Manage and track all police-related vehicle expenses</p>
                </div>
                <button
                    type="button"
                    className="btn btn-primary flex items-center gap-2 rounded-xl font-bold uppercase tracking-widest text-xs py-3"
                    onClick={() => setShowForm(true)}
                >
                    <IconPlus className="w-4 h-4" />
                    Add New Expense
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-primary/5 p-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase text-white-dark mb-1 block">Search Vehicle / Location</label>
                    <div className="relative">
                        <input
                            type="text"
                            className="form-input ltr:pr-10 rtl:pl-10 h-10 rounded-xl"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <IconSearch className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dark" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-white-dark mb-1 block">Filter Date</label>
                    <input
                        type="date"
                        className="form-input h-10 rounded-xl"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <button 
                    className="btn btn-outline-danger h-10 rounded-xl px-4"
                    onClick={() => { 
                        setFilterDate(''); 
                        setSearchTerm(''); 
                        setFilterOwnership('');
                        setFilterContractor('');
                        setFilterVehicle('');
                    }}
                >
                    <IconX className="w-4 h-4" />
                </button>
            </div>

            {/* Sub-Filters Bar */}
            <div className="bg-primary/5 px-4 pb-4 flex flex-wrap gap-4 items-end border-t border-primary/10">
                <div className="flex-1 min-w-[150px]">
                    <label className="text-[10px] font-bold uppercase text-white-dark mb-1 block">Ownership</label>
                    <select 
                        className="form-select h-10 rounded-xl text-xs uppercase font-bold"
                        value={filterOwnership}
                        onChange={(e) => { setFilterOwnership(e.target.value); setFilterContractor(''); setFilterVehicle(''); }}
                    >
                        <option value="">All Ownership</option>
                        <option value="Own">Own Vehicle</option>
                        <option value="Vendor">Vendor Vehicle</option>
                    </select>
                </div>

                {filterOwnership === 'Vendor' && (
                    <div className="flex-1 min-w-[200px] animate-fadeIn">
                        <label className="text-[10px] font-bold uppercase text-white-dark mb-1 block">Transport Vendor</label>
                        <select 
                            className="form-select h-10 rounded-xl text-xs uppercase font-bold"
                            value={filterContractor}
                            onChange={(e) => { setFilterContractor(e.target.value); setFilterVehicle(''); }}
                        >
                            <option value="">All Vendors</option>
                            {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                        </select>
                    </div>
                )}

                {(filterOwnership || searchTerm) && (
                    <div className="flex-1 min-w-[150px] animate-fadeIn">
                        <label className="text-[10px] font-bold uppercase text-white-dark mb-1 block">Vehicle Number</label>
                        <select 
                            className="form-select h-10 rounded-xl text-xs uppercase font-bold"
                            value={filterVehicle}
                            onChange={(e) => setFilterVehicle(e.target.value)}
                        >
                            <option value="">All Vehicles</option>
                            {Array.from(new Set(
                                expenses
                                    .filter(exp => (!filterOwnership || exp.vehicleOwnership === filterOwnership) && (!filterContractor || exp.transportVendorId === filterContractor || exp.contractorName?.includes(filterContractor)))
                                    .map(exp => exp.vehicleNumber)
                            )).map(vNum => (
                                <option key={vNum} value={vNum}>{vNum}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Expenses Table */}
            <div className="table-responsive bg-white dark:bg-black p-5">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#f1f2f3] dark:border-[#1b1b1b] text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                            <th className="py-3 text-left">Date</th>
                            <th className="py-3 text-left">Ownership</th>
                            <th className="py-3 text-left">Transport Name</th>
                            <th className="py-3 text-left">Vehicle Number</th>
                            <th className="py-3 text-left">Time & Location</th>
                            <th className="py-3 text-right">Amount (₹)</th>
                            <th className="py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f2f3] dark:divide-[#1b1b1b]">
                        {loading ? (
                            <tr><td colSpan={7} className="py-8 text-center text-white-dark font-bold">Loading records...</td></tr>
                        ) : filteredExpenses.length === 0 ? (
                            <tr><td colSpan={7} className="py-8 text-center text-white-dark font-bold uppercase tracking-widest text-xs">No records found</td></tr>
                        ) : (
                            filteredExpenses.map((exp: any) => (
                                <tr key={exp._id} className="group hover:bg-gray-50/50 dark:hover:bg-dark/50 transition-colors">
                                    <td className="py-4">
                                        <div className="text-xs font-black text-[#1e293b] dark:text-white-light uppercase">
                                            {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                            exp.vehicleOwnership === 'Own' ? 'bg-success/10 text-success' : 
                                            exp.vehicleOwnership === 'Contractor' ? 'bg-info/10 text-info' :
                                            'bg-warning/10 text-warning'}`}>
                                            {exp.vehicleOwnership}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="text-xs font-bold text-[#475569] dark:text-white-dark uppercase">
                                            {exp.contractorName || (() => {
                                                if (exp.vehicleOwnership === 'Vendor' && exp.transportVendorId) {
                                                    const v = vendors.find(vend => vend._id === exp.transportVendorId);
                                                    return v ? `${v.name}${v.companyName ? ` (${v.companyName})` : ''}` : 'N/A';
                                                }
                                                return 'N/A';
                                            })()}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="text-xs font-black text-primary px-2 py-1 bg-primary/5 rounded inline-block">
                                            {exp.vehicleNumber}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="text-xs font-bold text-[#475569] dark:text-white-dark">
                                            {exp.policeTime || 'N/A'} at {exp.fromLocation || 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="text-xs font-black text-danger">₹ {exp.amount.toLocaleString()}</div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {exp.billUrl && (
                                                <a href={getFileUrl(exp.billUrl)} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary hover:underline px-2 mr-2">
                                                    View Bill
                                                </a>
                                            )}
                                            <button onClick={() => handleEdit(exp)} className="p-2 hover:bg-info/10 text-info rounded-lg">
                                                <IconEdit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(exp._id)} className="p-2 hover:bg-danger/10 text-danger rounded-lg">
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            <Transition appear show={showForm} as={Fragment}>
                <Dialog as="div" open={showForm} onClose={() => resetForm()} className="relative z-[1000]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel w-full max-w-2xl overflow-hidden rounded-3xl border-0 p-0 text-black dark:text-white-dark shadow-2xl">
                                    <button
                                        type="button"
                                        onClick={() => resetForm()}
                                        className="absolute top-6 right-6 text-white-dark hover:text-danger outline-none"
                                    >
                                        <IconX className="w-5 h-5" />
                                    </button>
                                    <div className="bg-primary/5 px-8 py-8">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">
                                            {editMode ? 'Edit' : 'Add New'} Police Expense
                                        </h2>
                                        <p className="text-xs font-bold text-white-dark mt-1">Fill in the details to record a new vehicle management expense</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Date */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Effective Date *</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        className="form-input h-12 rounded-xl"
                                                        value={formData.date}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Vehicle Ownership */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Vehicle Ownership *</label>
                                                <div className="flex gap-2">
                                                    {['Own', 'Vendor'].map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            className={`flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
                                                                formData.vehicleOwnership === type 
                                                                ? 'bg-primary text-white shadow-lg' 
                                                                : 'bg-primary/5 text-primary hover:bg-primary/10'
                                                            }`}
                                                            onClick={() => setFormData(p => ({ ...p, vehicleOwnership: type, transportVendorId: '', vehicleNumber: '', contractorName: '' }))}
                                                        >
                                                            {type} Vehicle
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Vendor Select (Conditional) */}
                                            {formData.vehicleOwnership === 'Vendor' && (
                                                <div className="md:col-span-2 animate-fadeIn">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Select Transport Vendor *</label>
                                                    <select
                                                        className="form-select h-12 rounded-xl"
                                                        value={formData.transportVendorId}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, transportVendorId: e.target.value, vehicleNumber: '' }))}
                                                        required={formData.vehicleOwnership === 'Vendor'}
                                                    >
                                                        <option value="">Choose a Vendor...</option>
                                                        {vendors.map(v => (
                                                            <option key={v._id} value={v._id}>
                                                                {v.name} {v.companyName ? `(${v.companyName})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Vehicle Number Select */}
                                            <div className={formData.vehicleOwnership === 'Vendor' ? 'md:col-span-2' : ''}>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Vehicle Number *</label>
                                                <select
                                                    className="form-select h-12 rounded-xl"
                                                    value={formData.vehicleNumber}
                                                    onChange={(e) => {
                                                        const vNum = e.target.value;
                                                        let cName = '';
                                                        if (formData.vehicleOwnership === 'Vendor') {
                                                            if (selectedVendor) {
                                                                cName = `${selectedVendor.name}${selectedVendor.companyName ? ` (${selectedVendor.companyName})` : ''}`;
                                                            }
                                                        }
                                                        setFormData(prev => ({ ...prev, vehicleNumber: vNum, contractorName: cName }));
                                                    }}
                                                    required
                                                >
                                                    <option value="">
                                                        {loadingData ? 'Fetching Data...' : 
                                                         formData.vehicleOwnership === 'Own' && ownVehicles.filter(v => (v.ownershipType === 'Own' || !v.ownershipType) && v.type === 'Vehicle').length === 0 ? 'No Own Vehicles found' : 
                                                         formData.vehicleOwnership === 'Vendor' && !formData.transportVendorId ? 'Select Vendor first' : 
                                                         formData.vehicleOwnership === 'Vendor' && vendorVehicles.length === 0 ? 'No vehicles for this Vendor' :
                                                         'Select Vehicle...'}
                                                    </option>
                                                    {formData.vehicleOwnership === 'Own' ? (
                                                        ownVehicles
                                                            .filter(v => (v.status === 'active' || !v.status) && (v.ownershipType === 'Own' || !v.ownershipType) && v.type === 'Vehicle')
                                                            .map(v => {
                                                                const vNum = v.vehicleNumber || v.registrationNumber || v.name;
                                                                return <option key={v._id} value={vNum}>{vNum}</option>;
                                                            })
                                                    ) : (
                                                        vendorVehicles.map((v: any, idx: number) => (
                                                            <option key={idx} value={v.vehicleNumber}>{v.vehicleNumber}</option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>

                                            {/* Transport Name */}
                                            {formData.vehicleOwnership === 'Vendor' && (
                                                <div className="md:col-span-2 animate-fadeIn">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">
                                                        Transport Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-input h-12 rounded-xl bg-primary/5 border-primary/10"
                                                        placeholder="Name will be populated automatically..."
                                                        value={formData.contractorName}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, contractorName: e.target.value }))}
                                                    />
                                                </div>
                                            )}

                                            {/* Time */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Incident Time</label>
                                                <input
                                                    type="time"
                                                    className="form-input h-12 rounded-xl"
                                                    value={formData.policeTime}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, policeTime: e.target.value }))}
                                                />
                                            </div>

                                            {/* Location */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Location / Site</label>
                                                <input
                                                    type="text"
                                                    className="form-input h-12 rounded-xl"
                                                    placeholder="Enter site name..."
                                                    value={formData.fromLocation}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, fromLocation: e.target.value }))}
                                                />
                                            </div>

                                            {/* Amount */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Fine / Penalty Amount (₹) *</label>
                                                <input
                                                    type="number"
                                                    className="form-input h-12 rounded-xl font-black text-danger"
                                                    placeholder="0.00"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                                    required
                                                />
                                            </div>

                                            {/* Bill Upload */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Bill Copy / Receipt</label>
                                                <div className="flex flex-col gap-2">
                                                    <label className={`cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 rounded-xl px-4 h-12 hover:border-primary/60 transition-all bg-primary/5 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="17 8 12 3 7 8" />
                                                            <line x1="12" y1="3" x2="12" y2="15" />
                                                        </svg>
                                                        <span className="text-sm text-primary font-bold uppercase tracking-tight">
                                                            {uploading ? 'Processing...' : formData.billUrl ? 'Change Receipt' : 'Upload Receipt'}
                                                        </span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setSelectedFile(file);
                                                                    handleFileUpload(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    {formData.billUrl && (
                                                        <div className="flex items-center justify-between bg-primary/10 rounded-xl px-4 py-2 border border-primary/20 animate-fadeIn">
                                                            <span className="text-[10px] font-black text-primary uppercase">Receipt Attached ✓</span>
                                                            <a href={getFileUrl(formData.billUrl)} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary hover:underline">View File</a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reason / Description */}
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Reason for Expense *</label>
                                                <textarea
                                                    className="form-textarea rounded-2xl min-h-[100px] bg-primary/5 border-primary/10 focus:border-primary/30 transition-all font-bold text-xs"
                                                    placeholder="Enter specific details or reason for the penalty..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                    required
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <button
                                                type="submit"
                                                className="btn btn-primary flex-1 h-14 rounded-2xl font-black uppercase tracking-[2px] text-xs shadow-xl shadow-primary/30"
                                                disabled={uploading}
                                            >
                                                <IconSave className="w-4 h-4 mr-2" />
                                                {editMode ? 'Update Record' : 'Save Expense'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger h-14 rounded-2xl font-black uppercase tracking-[2px] text-xs px-8"
                                                onClick={() => resetForm()}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default PoliceExpenseManagement;
