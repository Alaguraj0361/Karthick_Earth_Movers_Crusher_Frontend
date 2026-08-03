'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconSave from '@/components/icon/icon-save';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import api from '@/utils/api';
import Link from 'next/link';
import { useToast } from '@/components/stone-mine/toast-notification';
import IconSettings from '@/components/icon/icon-settings';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import { canEditRecord } from '@/utils/permissions';
import IconEye from '@/components/icon/icon-eye';
import IconDownload from '@/components/icon/icon-download';
import * as XLSX from 'xlsx';

const MachineDetails = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const { showToast } = useToast();
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const canSeeFinancials = currentUser?.role?.toLowerCase() !== 'supervisor';

    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formView, setFormView] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('own');
    const [detailsView, setDetailsView] = useState<any>(null);
    const [productionHistory, setProductionHistory] = useState<any[]>([]);
    const [filterDates, setFilterDates] = useState({ start: '', end: '' });
    const [prodEditId, setProdEditId] = useState<string | null>(null);
    const [showProdModal, setShowProdModal] = useState(false);
    const [prodForm, setProdForm] = useState({
        startTime: '08:00',
        endTime: '18:00',
        breakTime: 0,
        workType: '',
        startHmr: 0,
        endHmr: 0,
        remarks: '',
        date: '',
        dieselLiters: 0,
        operator: ''
    });
    const [liveHours, setLiveHours] = useState(0);

    const [newItem, setNewItem] = useState({
        name: '',
        category: '',
        description: '',
        type: 'Machine',
        vehicleNumber: '',
        mobile: '',
        modelNumber: '',
        registrationNumber: '',
        purchaseDate: '',
        purchaseCost: '',
        currentCondition: '',
        operatorName: '',
        ownerName: '',
        driverName: '',
        rcInsuranceDetails: '',
        permitExpiryDate: '',
        mileageDetails: '',
        ownershipType: 'Own',
        contractor: ''
    });
    const [vendors, setVendors] = useState<any[]>([]);

    const categories = ['JCB', 'Hitachi', 'Loader', 'Generator', 'Compressor', 'Driller', 'Tractor', 'Stone Crusher', 'Other'];

    const [machineCategories, setMachineCategories] = useState<any[]>([]);
    const [operators, setOperators] = useState<any[]>([]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/master/vehicles');
            if (data.success) {
                setAssets(data.data.filter((asset: any) => asset.type === 'Machine'));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/master/machine-categories');
            if (data.success) {
                setMachineCategories(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOperators = async () => {
        try {
            const { data } = await api.get('/labour');
            if (data.success) {
                const filtered = data.data.filter((l: any) =>
                    l.workType?.toLowerCase().includes('operator')
                );
                setOperators(filtered);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchVendors = async () => {
        try {
            const { data } = await api.get('/vendors/transport');
            if (data.success) setVendors(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchAssets();
        fetchCategories();
        fetchOperators();
        fetchVendors();
    }, []);

    const handleAdd = async (e: any) => {
        e.preventDefault();
        try {
            const endpoint = editItem
                ? `/master/vehicles/${editItem._id}`
                : '/master/vehicles';

            const method = editItem ? 'put' : 'post';

            const { data: json } = await (api as any)[method](endpoint, { ...newItem, type: 'Machine', contractor: newItem.contractor || null });
            if (json.success) {
                showToast(editItem ? 'Machine details updated!' : 'Machine registered successfully!', 'success');
                resetForm();
                fetchAssets();
            }
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Error saving data';
            showToast(message, 'error');
        }
    };

    const resetForm = () => {
        setNewItem({
            name: '', category: '', description: '', type: 'Machine', vehicleNumber: '', mobile: '',
            modelNumber: '', registrationNumber: '', purchaseDate: '', purchaseCost: '',
            currentCondition: '', operatorName: '', ownerName: '', driverName: '',
            rcInsuranceDetails: '', permitExpiryDate: '', mileageDetails: '',
            ownershipType: activeTab === 'own' ? 'Own' : 'Contract',
            contractor: ''
        });
        setEditItem(null);
        setFormView(false);
        setDetailsView(null);
        setProdEditId(null);
        setShowProdModal(false);
    };

    const handleViewDetails = async (asset: any) => {
        setDetailsView(asset);
        try {
            const { data } = await api.get(`/machine-production?machineId=${asset._id}`);
            if (data.success) {
                setProductionHistory(data.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Error fetching machine history', 'error');
        }
    };

    const handleEditProd = (log: any) => {
        setProdEditId(log._id);
        setProdForm({
            startTime: log.startTime,
            endTime: log.endTime,
            breakTime: log.breakTime || 0,
            workType: log.workType || '',
            startHmr: log.startHmr || 0,
            endHmr: log.endHmr || 0,
            remarks: log.remarks || '',
            date: new Date(log.date).toISOString().split('T')[0],
            dieselLiters: log.dieselLiters || 0,
            operator: log.operator?._id || ''
        });
        setShowProdModal(true);
    };

    const handleProdSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const { data } = await api.put(`/machine-production/${prodEditId}`, prodForm);
            if (data.success) {
                showToast('Production log updated!', 'success');
                setShowProdModal(false);
                // Refresh history
                if (detailsView?._id) {
                    const { data: refreshData } = await api.get(`/machine-production?machineId=${detailsView._id}`);
                    if (refreshData.success) {
                        setProductionHistory(refreshData.data);
                    }
                }
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error updating log', 'error');
        }
    };

    const handleProdDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this log?')) return;
        try {
            const { data } = await api.delete(`/machine-production/${id}`);
            if (data.success) {
                showToast('Log deleted!', 'success');
                if (detailsView?._id) {
                    const { data: refreshData } = await api.get(`/machine-production?machineId=${detailsView._id}`);
                    if (refreshData.success) {
                        setProductionHistory(refreshData.data);
                    }
                }
            }
        } catch (error) {
            showToast('Error deleting log', 'error');
        }
    };

    // Live recalculation for form
    useEffect(() => {
        if (!prodForm.startTime || !prodForm.endTime) {
            setLiveHours(0);
            return;
        }
        const [h1, m1] = prodForm.startTime.split(':').map(Number);
        const [h2, m2] = prodForm.endTime.split(':').map(Number);
        let diff = (h2 + m2 / 60) - (h1 + m1 / 60);
        if (diff < 0) diff += 24;
        const total = Math.max(0, diff - (prodForm.breakTime / 60));
        setLiveHours(total);
    }, [prodForm.startTime, prodForm.endTime, prodForm.breakTime]);

    const calculateHours = (start: string, end: string, breakMins: number) => {
        if (!start || !end) return 0;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 + m2 / 60) - (h1 + m1 / 60);
        if (diff < 0) diff += 24;
        return Math.max(0, diff - (breakMins / 60));
    };

    const handleExportExcel = () => {
        const dataToExport = productionHistory.map(log => ({
            Date: new Date(log.date).toLocaleDateString(),
            'Work Type': log.workType,
            Operator: log.operator?.name || 'N/A',
            'Start HMR': log.startHmr,
            'End HMR': log.endHmr,
            'Total Hours': log.totalHours,
            'Diesel (L)': log.dieselLiters || 0,
            Remarks: log.remarks || ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Production History');
        XLSX.writeFile(wb, `${detailsView.name}_Production_Report.xlsx`);
    };

    const handleEdit = (item: any) => {
        setEditItem(item);
        setNewItem({
            name: item.name,
            category: item.category || '',
            description: item.description || '',
            type: 'Machine',
            vehicleNumber: item.vehicleNumber || '',
            mobile: item.mobile || '',
            modelNumber: item.modelNumber || '',
            registrationNumber: item.registrationNumber || '',
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
            purchaseCost: item.purchaseCost || '',
            currentCondition: item.currentCondition || '',
            operatorName: item.operatorName || '',
            ownerName: item.ownerName || '',
            driverName: item.driverName || '',
            rcInsuranceDetails: item.rcInsuranceDetails || '',
            permitExpiryDate: item.permitExpiryDate ? new Date(item.permitExpiryDate).toISOString().split('T')[0] : '',
            mileageDetails: item.mileageDetails || '',
            ownershipType: item.ownershipType || 'Own',
            contractor: item.contractor?._id || (typeof item.contractor === 'string' ? item.contractor : '')
        });
        setFormView(true);
        setDetailsView(null);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const { data } = await api.delete(`/master/vehicles/${deleteId}`);
            if (data.success) {
                showToast('Machine deleted successfully!', 'success');
                fetchAssets();
            }
        } catch (error) {
            console.error(error);
            showToast('Error deleting machine', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const filteredAssets = assets.filter(asset => {
        if (activeTab === 'own') return asset.ownershipType === 'Own' || !asset.ownershipType;
        return asset.ownershipType === 'Contract';
    });

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Machine & Vehicle</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Machine Details</span></li>
            </ul>

            {formView ? (
                <div className="panel shadow-2xl rounded-2xl border-none">
                    <div className="mb-8 flex items-center justify-between border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-5">
                        <div className="flex items-center">
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm ltr:mr-4 rtl:ml-4 flex items-center justify-center rounded-xl w-10 h-10 p-0 shadow-lg shadow-primary/20"
                                onClick={resetForm}
                            >
                                <IconArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h5 className="text-xl font-black text-black dark:text-white-light uppercase tracking-tight">{editItem ? 'Edit Machine Profile' : 'Register New Heavy Equipment'}</h5>
                                <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Machine Asset Management Portal</p>
                            </div>
                        </div>
                    </div>

                    <form className="max-w-5xl mx-auto space-y-10" onSubmit={handleAdd}>
                        <div className="space-y-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-[0.2em] border-b border-primary/10 pb-3 mb-4">
                                <span className="bg-primary text-white w-6 h-6 rounded-lg inline-flex items-center justify-center text-[10px]">1</span>
                                Registration Type (பதிவு வகை)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Ownership Type</label>
                                    <select
                                        name="ownershipType"
                                        className="form-select border-2 font-bold rounded-xl h-12 border-primary/20"
                                        value={newItem.ownershipType}
                                        onChange={(e) => setNewItem({ ...newItem, ownershipType: e.target.value })}
                                    >
                                        <option value="Own">Own Asset (சொந்த இயந்திரம்)</option>
                                        <option value="Contract">Contract / Rental Asset (ஒப்பந்த இயந்திரம்)</option>
                                    </select>
                                </div>
                                {newItem.ownershipType === 'Contract' && (
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Select Transport Vendor</label>
                                        <select
                                            name="contractor"
                                            className="form-select border-2 font-bold rounded-xl h-12 border-warning/20 shadow-sm"
                                            value={newItem.contractor}
                                            onChange={(e) => setNewItem({ ...newItem, contractor: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Vendor...</option>
                                            {vendors.map(v => (
                                                <option key={v._id} value={v._id}>{v.name} {v.companyName ? `(${v.companyName})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6 bg-info/5 p-6 rounded-2xl border border-info/10">
                            <div className="flex items-center gap-2 text-info font-black uppercase text-xs tracking-[0.2em] border-b border-info/10 pb-3 mb-4">
                                <span className="bg-info text-white w-6 h-6 rounded-lg inline-flex items-center justify-center text-[10px]">2</span>
                                Machine Specifications (இயந்திர விவரங்கள்)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Machine Category</label>
                                    <select
                                        className="form-select border-2 font-bold rounded-xl h-12"
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {machineCategories.map((cat: any) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                                        {machineCategories.length === 0 && categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Machine Name / Model</label>
                                    <input
                                        type="text"
                                        className="form-input border-2 font-bold rounded-xl h-12"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        required
                                        placeholder="e.g. Hitachi EX200"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Registration / Serial No (Unique)</label>
                                    <input type="text" className="form-input border-2 font-bold rounded-xl h-12 uppercase" value={newItem.registrationNumber} onChange={(e) => setNewItem({ ...newItem, registrationNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Owner Name</label>
                                    <input type="text" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.ownerName} onChange={(e) => setNewItem({ ...newItem, ownerName: e.target.value })} placeholder="Enter Owner Name" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Current Condition</label>
                                    <select className="form-select border-2 font-bold rounded-xl h-12" value={newItem.currentCondition} onChange={(e) => setNewItem({ ...newItem, currentCondition: e.target.value })}>
                                        <option value="Excellent">Excellent</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Requires Service">Requires Service</option>
                                        <option value="In Repair">In Repair</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 bg-success/5 p-6 rounded-2xl border border-success/10">
                            <div className="flex items-center gap-2 text-success font-black uppercase text-xs tracking-[0.2em] border-b border-success/10 pb-3 mb-4">
                                <span className="bg-success text-white w-6 h-6 rounded-lg inline-flex items-center justify-center text-[10px]">3</span>
                                Financials & Operator (நிதி மற்றும் பணியாளர்)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {canSeeFinancials && (
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Purchase Cost (₹)</label>
                                        <input type="number" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.purchaseCost} onChange={(e) => setNewItem({ ...newItem, purchaseCost: e.target.value })} />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Hour Meter Start</label>
                                    <input type="text" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.mileageDetails} onChange={(e) => setNewItem({ ...newItem, mileageDetails: e.target.value })} placeholder="Initial HR" />
                                </div>
                                {canSeeFinancials && (
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Purchase / Entry Date</label>
                                        <input type="date" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.purchaseDate} onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })} />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Operator Name</label>
                                    <select
                                        className="form-select border-2 font-bold rounded-xl h-12"
                                        value={newItem.operatorName}
                                        onChange={(e) => {
                                            const opName = e.target.value;
                                            const operator = operators.find((op: any) => op.name === opName);
                                            setNewItem({ ...newItem, operatorName: opName, mobile: operator?.mobile || '' });
                                        }}
                                    >
                                        <option value="">Select Operator (இயக்குபவர்)</option>
                                        {operators.map((op: any) => (
                                            <option key={op._id} value={op.name}>{op.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Operator Mobile Number</label>
                                    <input type="text" className="form-input border-2 font-bold rounded-xl h-12 bg-gray-100 dark:bg-gray-800 cursor-not-allowed" value={newItem.mobile} readOnly placeholder="Enter Mobile Number" />
                                </div>
                            </div>
                            <div className="pt-4">
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Remarks / Notes</label>
                                <textarea
                                    className="form-textarea border-2 font-bold rounded-xl min-h-[100px]"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-10 border-t-2 border-primary/5">
                            <button type="button" className="btn btn-outline-danger px-10 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-14 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_20px_rgba(67,97,238,0.3)]">
                                <IconSave className="ltr:mr-2 rtl:ml-2 w-4 h-4" />
                                {editItem ? 'Update machine' : 'Save machine'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : detailsView ? (
                <div className="space-y-6">
                    <div className="panel shadow-2xl rounded-2xl border-none overflow-hidden">
                        <div className="p-0">
                            <div className="bg-primary/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-primary/10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setDetailsView(null)} className="btn btn-outline-primary btn-sm flex items-center justify-center rounded-xl w-10 h-10 p-0 shadow-lg shadow-primary/20">
                                        <IconArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h5 className="text-2xl font-black text-black dark:text-white-light uppercase tracking-tight">{detailsView.name}</h5>
                                            <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{detailsView.registrationNumber || detailsView.vehicleNumber}</span>
                                        </div>
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{detailsView.category} • {detailsView.ownershipType === 'Own' ? 'Internal Asset' : 'Rental Asset'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0">
                                    <div className="flex items-center gap-2 bg-white dark:bg-[#1b2a47] p-1.5 rounded-xl border border-primary/20 shadow-sm">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-[9px] font-black uppercase text-white-dark">From</span>
                                            <input
                                                type="date"
                                                className="form-input form-input-sm border-none bg-transparent font-bold text-xs p-0 focus:ring-0 w-32"
                                                value={filterDates.start}
                                                onChange={(e) => setFilterDates(prev => ({ ...prev, start: e.target.value }))}
                                            />
                                        </div>
                                        <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700"></div>
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-[9px] font-black uppercase text-white-dark">To</span>
                                            <input
                                                type="date"
                                                className="form-input form-input-sm border-none bg-transparent font-bold text-xs p-0 focus:ring-0 w-32"
                                                value={filterDates.end}
                                                onChange={(e) => setFilterDates(prev => ({ ...prev, end: e.target.value }))}
                                            />
                                        </div>
                                        {(filterDates.start || filterDates.end) && (
                                            <button
                                                onClick={() => setFilterDates({ start: '', end: '' })}
                                                className="p-1 hover:text-danger text-white-dark transition-colors"
                                                title="Clear Filters"
                                            >
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={handleExportExcel}
                                            className="btn btn-outline-success rounded-xl px-5 font-bold uppercase text-[10px] tracking-widest h-10"
                                            disabled={productionHistory.length === 0}
                                        >
                                            <IconDownload className="w-4 h-4 mr-2" /> Export XL
                                        </button>
                                    )}
                                    {canEditRecord(currentUser, detailsView.createdAt) && (
                                        <button onClick={() => handleEdit(detailsView)} className="btn btn-info rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest h-10">
                                            <IconEdit className="w-4 h-4 mr-2" /> Edit Machine
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white-light dark:bg-[#1b2a47] p-5 rounded-2xl border border-gray-100 dark:border-white-light/5">
                                        <h6 className="text-xs font-black uppercase text-white-dark tracking-widest mb-4">Core Info</h6>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-white-dark block mb-1">Assigned Operator</span>
                                                <span className="text-sm font-black">{detailsView.operatorName || 'N/A'} {detailsView.mobile ? `(${detailsView.mobile})` : ''}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-black">{detailsView.registrationNumber || detailsView.vehicleNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-white-dark block mb-1">Condition</span>
                                                <span className="text-sm font-black">{detailsView.currentCondition || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-white-dark block mb-1">Asset Owner</span>
                                                <span className="text-sm font-black">{detailsView.ownerName || (detailsView.ownershipType === 'Own' ? 'Own Asset' : detailsView.contractor?.name) || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-success/5 p-5 rounded-2xl border border-success/10">
                                        <h6 className="text-xs font-black uppercase text-success tracking-widest mb-4">Usage Summary</h6>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-white-dark">Total HR Run</span>
                                                <span className="font-black text-black dark:text-white">{productionHistory.reduce((acc, log) => acc + (log.totalHours || 0), 0).toFixed(2)} Hrs</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-primary">
                                                <span className="font-bold">Initial Meter</span>
                                                <span className="font-black">{detailsView.mileageDetails || 0} HR</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm py-2 border-t border-success/10">
                                                <span className="font-bold text-white-dark">Avg Fuel/HR</span>
                                                <span className="font-black text-black dark:text-white">{productionHistory.length > 0 ? (productionHistory.reduce((acc, log) => acc + (log.dieselLiters || 0), 0) / (productionHistory.reduce((acc, log) => acc + (log.totalHours || 0), 0) || 1)).toFixed(2) : 0} L/HR</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-3">
                                    <div className="panel p-0 border border-gray-100 dark:border-white-light/5 rounded-2xl overflow-hidden">
                                        <div className="p-4 bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white-light/5 flex justify-between items-center">
                                            <h6 className="text-xs font-black uppercase tracking-widest">Production & Productivity Logs</h6>
                                        </div>
                                        <div className="table-responsive">
                                            <table>
                                                <thead>
                                                    <tr className="bg-gray-50/50 dark:bg-white-light/5">
                                                        <th className="font-black uppercase text-[10px] tracking-widest">Date</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest">Operator</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest text-center">Start Time</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest text-center">End Time</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest text-center">Break (Hr)</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest text-center">Working Hours</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest text-center">Diesel</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest">Work Details</th>
                                                        <th className="font-black uppercase text-[10px] tracking-widest text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-bold">
                                                    {productionHistory
                                                        .filter(log => {
                                                            const logDate = new Date(log.date).toISOString().split('T')[0];
                                                            if (filterDates.start && logDate < filterDates.start) return false;
                                                            if (filterDates.end && logDate > filterDates.end) return false;
                                                            return true;
                                                        })
                                                        .length === 0 ? (
                                                        <tr><td colSpan={8} className="text-center py-10 opacity-50 uppercase text-xs">No Production Records found</td></tr>
                                                    ) : (
                                                        productionHistory
                                                            .filter(log => {
                                                                const logDate = new Date(log.date).toISOString().split('T')[0];
                                                                if (filterDates.start && logDate < filterDates.start) return false;
                                                                if (filterDates.end && logDate > filterDates.end) return false;
                                                                return true;
                                                            })
                                                            .map((log: any) => (
                                                                <tr key={log._id} className="hover:bg-primary/5 transition-colors border-b border-gray-50 dark:border-white-light/5 last:border-0 font-bold">
                                                                    <td className="text-xs py-4">{new Date(log.date).toLocaleDateString()}</td>
                                                                    <td className="text-xs font-black text-black">
                                                                        {log.operator?.name}
                                                                    </td>
                                                                    <td className="text-xs font-black text-center text-primary">{log.startTime || '-'}</td>
                                                                    <td className="text-xs font-black text-center text-primary">{log.endTime || '-'}</td>
                                                                    <td className="text-center text-xs font-bold text-danger">{(log.breakTime / 60).toFixed(2)}</td>
                                                                    <td className="text-center"><span className="badge badge-outline-success font-black text-[10px]">{calculateHours(log.startTime, log.endTime, log.breakTime || 0).toFixed(2)} Hrs</span></td>
                                                                    <td className="text-center font-black text-info text-xs">{log.dieselLiters || 0} L</td>
                                                                    <td className="text-xs">
                                                                        <div className="uppercase tracking-tight text-[10px] text-primary">{log.workType}</div>
                                                                        <div className="text-[11px] opacity-60 line-clamp-1">{log.remarks || '-'}</div>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            {canEditRecord(currentUser, log.createdAt || log.date) && (
                                                                                <button onClick={() => handleEditProd(log)} className="text-primary hover:opacity-70 p-1">
                                                                                    <IconEdit className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                            {isOwner && (
                                                                                <button onClick={() => handleProdDelete(log._id)} className="text-danger hover:opacity-70 p-1">
                                                                                    <IconTrashLines className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Production Edit Modal */}
                    {showProdModal && (
                        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-[#0e1726] rounded-3xl w-full max-w-xl shadow-2xl p-8 border border-white/10">
                                <h3 className="text-xl font-black uppercase mb-6 text-white-dark tracking-tight">Edit Production Log</h3>
                                <form onSubmit={handleProdSubmit} className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-2">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white-dark block mb-1">Start Time</label>
                                            <input type="time" className="form-input rounded-xl font-bold" value={prodForm.startTime} onChange={(e) => setProdForm({ ...prodForm, startTime: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white-dark block mb-1">End Time</label>
                                            <input type="time" className="form-input rounded-xl font-bold" value={prodForm.endTime} onChange={(e) => setProdForm({ ...prodForm, endTime: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white-dark block mb-1 ml-1">Break Time (Mins)</label>
                                        <input type="number" className="form-input rounded-xl font-bold" value={prodForm.breakTime} onChange={(e) => setProdForm({ ...prodForm, breakTime: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white-dark block mb-1 ml-1">Final Production HR</label>
                                        <div className="bg-success/20 text-success font-black text-lg py-2 rounded-xl text-center border border-success/20">
                                            {liveHours.toFixed(2)} Hrs
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black uppercase text-white-dark block mb-1 ml-1">Work Type</label>
                                        <input type="text" className="form-input rounded-xl font-bold" placeholder="e.g. Loading, Drilling" value={prodForm.workType} onChange={(e) => setProdForm({ ...prodForm, workType: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 col-span-2">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white-dark block mb-1 ml-1">Start HMR</label>
                                            <input type="number" className="form-input rounded-xl font-bold" value={prodForm.startHmr} onChange={(e) => setProdForm({ ...prodForm, startHmr: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white-dark block mb-1 ml-1">End HMR</label>
                                            <input type="number" className="form-input rounded-xl font-bold" value={prodForm.endHmr} onChange={(e) => setProdForm({ ...prodForm, endHmr: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setShowProdModal(false)} className="btn btn-outline-danger px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">Close</button>
                                        <button type="submit" className="btn btn-primary px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">Update Record</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h5 className="text-2xl font-black text-black dark:text-white-light uppercase tracking-tight">Machine Details</h5>
                            <p className="text-white-dark text-sm font-bold mt-1">Manage Heavy Equipment & Quarry Machinery</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-white-light dark:bg-[#1b2a47] p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('own')}
                                    className={`px-6 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'own' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white-dark hover:text-primary transition-colors'}`}
                                >
                                    Own Fleet
                                </button>
                                <button
                                    onClick={() => setActiveTab('contract')}
                                    className={`px-6 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'contract' ? 'bg-warning text-white shadow-lg shadow-warning/20' : 'text-white-dark hover:text-warning transition-colors'}`}
                                >
                                    Contractor Fleet
                                </button>
                            </div>
                            {activeTab === 'contract' && (
                                <Link
                                    href="/vendors/transport"
                                    className="btn btn-outline-warning shadow-[0_10px_20px_rgba(230,165,11,0.3)] rounded-xl py-3 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-2"
                                >
                                    <span>⚙️</span> Transport Vendors
                                </Link>
                            )}
                            <button
                                onClick={() => {
                                    resetForm();
                                    setFormView(true);
                                }}
                                className="btn btn-primary shadow-[0_10px_20px_rgba(67,97,238,0.3)] rounded-xl py-3 px-8 font-black uppercase tracking-widest text-xs"
                            >
                                <IconPlus className="mr-2" /> Add Machine
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="panel h-72 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-3xl"></div>
                            ))
                        ) : filteredAssets.length === 0 ? (
                            <div className="col-span-full panel py-20 text-center uppercase font-black tracking-[0.2em] opacity-20 text-xl">No {activeTab === 'own' ? 'Own' : 'Rental'} Equipment Found</div>
                        ) : (
                            filteredAssets.map((asset) => (
                                <div key={asset._id} className="relative group">
                                    <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-3xl blur opacity-20 group-hover:opacity-100 transition duration-500 ${activeTab === 'own' ? 'from-primary to-blue-600' : 'from-warning to-orange-600'}`}></div>
                                    <div className="relative panel p-0 rounded-3xl bg-white dark:bg-black border-none shadow-xl transform group-hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                        <div className={`p-5 flex items-center justify-between ${activeTab === 'own' ? 'bg-primary/10' : 'bg-warning/10'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl text-white shadow-lg ${activeTab === 'own' ? 'bg-primary shadow-primary/20' : 'bg-warning shadow-warning/20'}`}>
                                                    <IconMenuWidgets className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className={`font-black text-[10px] uppercase tracking-[0.2em] block leading-none ${activeTab === 'own' ? 'text-primary' : 'text-warning'}`}>{asset.category || 'Machine'}</span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${activeTab === 'own' ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                                                        {activeTab === 'own' ? 'Own Fleet' : asset.contractor?.name || 'Contractor'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleViewDetails(asset)} className="p-2 bg-white/50 dark:bg-white/10 rounded-lg hover:text-primary transition-colors shadow-sm" title="View Production History">
                                                    <IconEye className="w-4 h-4" />
                                                </button>
                                                {canEditRecord(currentUser, asset.createdAt) && (
                                                    <button onClick={() => handleEdit(asset)} className="p-2 bg-white/50 dark:bg-white/10 rounded-lg hover:text-info transition-colors shadow-sm">
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {isOwner && (<button onClick={() => handleDelete(asset._id)} className="p-2 bg-white/50 dark:bg-white/10 rounded-lg hover:text-danger transition-colors shadow-sm">
                                                    <IconTrashLines className="w-4 h-4" />
                                                </button>)}
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <h6 className="text-xl font-black text-black dark:text-white-light mb-1 line-clamp-1">{asset.name}</h6>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {asset.registrationNumber || 'No Serial'}
                                                </span>
                                                <span className="text-[10px] font-bold text-white-dark uppercase tracking-widest">
                                                    Mod: {asset.modelNumber || 'STD'}
                                                </span>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white-light/5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-white-dark block tracking-widest mb-1">Operator</span>
                                                        <span className="text-sm font-bold text-black dark:text-white-light truncate block">{asset.operatorName || 'Not Assigned'}</span>
                                                        {asset.mobile && <span className="text-[10px] font-black text-info">{asset.mobile}</span>}
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-white-dark block tracking-widest mb-1">Condition</span>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block ${asset.currentCondition === 'Excellent' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{asset.currentCondition || 'Good'}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-white-light/5 p-3 rounded-xl border border-gray-100 dark:border-white-light/5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase text-white-dark tracking-widest">Entry Date</span>
                                                        <span className="text-[11px] font-bold">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-[9px] font-black uppercase text-white-dark tracking-widest">Initial HR</span>
                                                        <span className="text-[11px] font-black text-info">{asset.mileageDetails || '0'} HR</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Machine Record"
                message="Are you sure you want to delete this machine? This action cannot be undone."
            />
        </div>
    );
};

export default MachineDetails;
