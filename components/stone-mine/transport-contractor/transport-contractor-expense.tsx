'use client';
import React, { useState, useEffect, Fragment } from 'react';
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import IconSave from '@/components/icon/icon-save';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSearch from '@/components/icon/icon-search';
import api, { getFileUrl } from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';

const TransportContractorExpense = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        _id: '',
        category: 'Transport Contractor',
        date: new Date().toISOString().split('T')[0],
        transportVendorId: '',
        vehicleNumber: '',
        transportExpenseType: 'Toll', // Default
        amount: '',
        billUrl: '',
        description: ''
    });

    const [filterDate, setFilterDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const expenseTypes = ['Toll', 'Food', 'Spare Parts', 'Maintenance', 'Penalty', 'Advance', 'Unloading', 'Loading', 'RTO/Police', 'Other'];

    useEffect(() => {
        fetchInitialData();
        fetchExpenses();
    }, []);

    const fetchInitialData = async () => {
        setLoadingData(true);
        try {
            const { data } = await api.get('/vendors/transport');
            if (data.success) setVendors(data.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/expenses', { params: { category: 'Transport Contractor' } });
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
                                    reject(new Error('Conversion failed'));
                                }
                            }, 'image/jpeg', 0.8);
                        };
                        img.src = e.target?.result as string;
                    };
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
            showToast('Upload failed: ' + (error.message || 'Error'), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.date || !formData.transportVendorId) {
            showToast('Please fill required fields (Date, Vendor, Amount)', 'error');
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
            category: 'Transport Contractor',
            date: new Date().toISOString().split('T')[0],
            transportVendorId: '',
            vehicleNumber: '',
            transportExpenseType: 'Toll',
            amount: '',
            billUrl: '',
            description: ''
        });
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

    const handleDelete = (id: string) => {
        setSelectedId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedId) return;
        try {
            const { data } = await api.delete(`/expenses/${selectedId}`);
            if (data.success) {
                showToast('Deleted successfully', 'success');
                setShowDeleteModal(false);
                setSelectedId(null);
                fetchExpenses();
            }
        } catch (error) {
            showToast('Delete failed', 'error');
        }
    };

    const selectedVendor = vendors.find(v => v._id === formData.transportVendorId);
    const vendorVehicles = selectedVendor?.vehicles || [];

    const filteredExpenses = expenses.filter(exp => {
        const vendor = vendors.find(v => v._id === exp.transportVendorId);
        const vendorName = vendor ? vendor.name : 'Unknown';
        const matchesDate = !filterDate || exp.date.startsWith(filterDate);
        const matchesSearch = !searchTerm || 
            vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.transportExpenseType?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDate && matchesSearch;
    });

    return (
        <div className="panel p-0 border-0 overflow-hidden mb-5">
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f1f2f3] dark:border-[#1b1b1b]">
                <div>
                    <h5 className="text-lg font-black uppercase tracking-tighter text-[#3b3f5c] dark:text-white-light">
                        Transport Contractor Expense
                    </h5>
                    <p className="text-xs font-bold text-white-dark mt-1">Manage and track Toll, Food, and other maintenance costs for contractors</p>
                </div>
                <button
                    type="button"
                    className="btn btn-primary flex items-center gap-2 rounded-xl font-bold uppercase tracking-widest text-xs py-3"
                    onClick={() => setShowForm(true)}
                >
                    <IconPlus className="w-4 h-4" />
                    Add Contractor Expense
                </button>
            </div>

            <div className="bg-primary/5 p-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase text-white-dark mb-1 block">Search Contractor / Vehicle / Type</label>
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
                <button className="btn btn-outline-danger h-10 rounded-xl px-4" onClick={() => { setFilterDate(''); setSearchTerm(''); }}>
                    <IconX className="w-4 h-4" />
                </button>
            </div>

            <div className="table-responsive bg-white dark:bg-black p-5">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#f1f2f3] dark:border-[#1b1b1b] text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                            <th className="py-3 text-left">Date</th>
                            <th className="py-3 text-left">Contractor & Vehicle</th>
                            <th className="py-3 text-left">Expense Type</th>
                            <th className="py-3 text-right">Amount (₹)</th>
                            <th className="py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f2f3] dark:divide-[#1b1b1b]">
                        {loading ? (
                            <tr><td colSpan={5} className="py-8 text-center text-white-dark font-bold">Loading records...</td></tr>
                        ) : filteredExpenses.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-white-dark font-bold uppercase tracking-widest text-xs">No records found</td></tr>
                        ) : (
                            filteredExpenses.map((exp: any) => {
                                const vendor = vendors.find(v => v._id === exp.transportVendorId);
                                return (
                                    <tr key={exp._id} className="group hover:bg-gray-50/50 dark:hover:bg-dark/50 transition-colors">
                                        <td className="py-4">
                                            <div className="text-xs font-black text-[#1e293b] dark:text-white-light uppercase">
                                                {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-xs font-black text-primary">
                                                    {vendor?.name || 'Unknown'} {vendor?.companyName ? `(${vendor.companyName})` : ''}
                                                </div>
                                                <div className="text-[10px] items-center flex gap-1 font-bold text-white-dark">
                                                    <span className="bg-primary/5 px-2 py-0.5 rounded uppercase">{exp.vehicleNumber || 'No Vehicle'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-[10px] font-black px-2 py-1 bg-info/10 text-info rounded-full uppercase">
                                                {exp.transportExpenseType}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="text-xs font-black text-danger">₹ {exp.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center justify-center gap-4">
                                                {exp.billUrl && (
                                                    <a href={getFileUrl(exp.billUrl)} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary hover:underline uppercase">
                                                        View Bill
                                                    </a>
                                                )}
                                                <button onClick={() => handleEdit(exp)} className="p-2 hover:bg-info/10 text-info rounded-lg"><IconEdit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(exp._id)} className="p-2 hover:bg-danger/10 text-danger rounded-lg"><IconTrashLines className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Transition appear show={showForm} as={Fragment}>
                <Dialog as="div" open={showForm} onClose={() => resetForm()} className="relative z-[1000]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel w-full max-w-2xl overflow-hidden rounded-3xl border-0 p-0 text-black dark:text-white-dark shadow-2xl">
                                    <button type="button" onClick={() => resetForm()} className="absolute top-6 right-6 text-white-dark hover:text-danger outline-none"><IconX className="w-5 h-5" /></button>
                                    <div className="bg-primary/5 px-8 py-8">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">{editMode ? 'Edit' : 'Add'} Contractor Expense</h2>
                                        <p className="text-xs font-bold text-white-dark mt-1">Record Toll, Maintenance, or Food expenses for specific vendor vehicles</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Date *</label>
                                                <input type="date" className="form-input h-12 rounded-xl" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} required />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Select Transport Contractor *</label>
                                                <select className="form-select h-12 rounded-xl" value={formData.transportVendorId} onChange={(e) => setFormData(p => ({ ...p, transportVendorId: e.target.value, vehicleNumber: '' }))} required>
                                                    <option value="">{loadingData ? 'Fetching Vendors...' : 'Choose a Vendor...'}</option>
                                                    {vendors.map(v => (
                                                        <option key={v._id} value={v._id}>{v.name} {v.companyName ? `(${v.companyName})` : ''}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Vehicle Number</label>
                                                <select className="form-select h-12 rounded-xl" value={formData.vehicleNumber} onChange={(e) => setFormData(p => ({ ...p, vehicleNumber: e.target.value }))}>
                                                    <option value="">Select Vendor Vehicle...</option>
                                                    {vendorVehicles.map((v: any, idx: number) => (
                                                        <option key={idx} value={v.vehicleNumber}>{v.vehicleNumber}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Expense Description / Type *</label>
                                                <input
                                                    type="text"
                                                    className="form-input h-12 rounded-xl font-bold"
                                                    placeholder="e.g. Toll, Food, Spare Parts..."
                                                    value={formData.transportExpenseType}
                                                    onChange={(e) => setFormData(p => ({ ...p, transportExpenseType: e.target.value }))}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Amount (₹) *</label>
                                                <input type="number" className="form-input h-12 rounded-xl font-black text-danger" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))} required />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Bill Copy / Receipt</label>
                                                <div className="flex flex-col gap-2">
                                                    <label className={`cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 rounded-xl px-4 h-12 hover:border-primary/60 transition-all bg-primary/5 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                        <span className="text-sm text-primary font-bold uppercase tracking-tight">{uploading ? 'Processing...' : formData.billUrl ? 'Change Receipt' : 'Upload Receipt'}</span>
                                                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
                                                    </label>
                                                    {formData.billUrl && (
                                                        <div className="flex items-center justify-between bg-primary/10 rounded-xl px-4 py-2 border border-primary/20">
                                                            <span className="text-[10px] font-black text-primary uppercase">Bill Attached ✓</span>
                                                            <a href={getFileUrl(formData.billUrl)} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary hover:underline">View</a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1.5 block">Additional Notes</label>
                                                <textarea className="form-textarea rounded-2xl min-h-[100px] bg-primary/5 border-primary/10 font-bold text-xs" placeholder="Describe the expense details..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}></textarea>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <button type="submit" className="btn btn-primary flex-1 h-14 rounded-2xl font-black uppercase tracking-[2px] text-xs shadow-xl shadow-primary/30" disabled={uploading}>
                                                <IconSave className="w-4 h-4 mr-2" />
                                                {editMode ? 'Update Expense' : 'Save Contractor Expense'}
                                            </button>
                                            <button type="button" className="btn btn-outline-danger h-14 rounded-2xl font-black uppercase tracking-[2px] text-xs px-8" onClick={() => resetForm()}>Cancel</button>
                                        </div>
                                    </form>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Custom Delete Confirmation Modal */}
            <Transition appear show={showDeleteModal} as={Fragment}>
                <Dialog as="div" open={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="relative z-[1001]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel w-full max-w-sm overflow-hidden rounded-2xl border-0 p-0 text-black dark:text-white-dark shadow-2xl">
                                    <div className="bg-danger/5 px-6 py-6 text-center">
                                        <div className="bg-danger/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-danger/20">
                                            <IconTrashLines className="w-8 h-8 text-danger" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-danger">Confirm Delete</h3>
                                        <p className="text-xs font-bold text-white-dark mt-2 px-4">Are you sure you want to permanently delete this expense record?</p>
                                    </div>
                                    <div className="p-6 flex gap-3">
                                        <button type="button" className="btn btn-outline-primary flex-1 h-12 rounded-xl font-black uppercase text-xs" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                        <button type="button" className="btn btn-danger flex-1 h-12 rounded-xl font-black uppercase text-xs shadow-lg shadow-danger/20" onClick={confirmDelete}>Yes, Delete</button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default TransportContractorExpense;
