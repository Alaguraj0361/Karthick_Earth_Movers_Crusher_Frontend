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
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import { useToast } from '@/components/stone-mine/toast-notification';
import IconEye from '@/components/icon/icon-eye';
import IconFile from '@/components/icon/icon-file';
import IconDownload from '@/components/icon/icon-download';
import * as XLSX from 'xlsx';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import { canEditRecord } from '@/utils/permissions';

const VehicleDetails = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const canSeeFinancials = currentUser?.role?.toLowerCase() !== 'supervisor';

    const { showToast } = useToast();
    const [assets, setAssets] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formView, setFormView] = useState(false);
    const [detailsView, setDetailsView] = useState<any>(null);
    const [editItem, setEditItem] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('own');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [stats, setStats] = useState<any[]>([]);
    const [filterDates, setFilterDates] = useState({ start: '', end: '' });
    const [newItem, setNewItem] = useState({
        name: '',
        category: '',
        description: '',
        type: 'Vehicle',
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

    const [categories, setCategories] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vehicleRes, vendorRes, categoryRes, reportRes] = await Promise.all([
                api.get('/master/vehicles'),
                api.get('/vendors/transport'),
                api.get('/master/vehicle-categories'),
                api.get('/reports/vehicle-cost')
            ]);

            if (vehicleRes.data.success) {
                setAssets(vehicleRes.data.data.filter((asset: any) => asset.type === 'Vehicle'));
            }
            if (vendorRes.data.success) {
                setVendors(vendorRes.data.data);
            }
            if (categoryRes.data.success) {
                setCategories(categoryRes.data.data);
            }
            if (reportRes.data.success) {
                setStats(reportRes.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setNewItem(prev => {
            const updated = { ...prev, [name]: value };

            if (name === 'ownershipType') {
                if (value === 'Own') {
                    updated.contractor = '';
                }
            }

            if (name === 'contractor') {
                const vendor = vendors.find(v => v._id === value);
                setSelectedVendor(vendor);
            }

            return updated;
        });
    };

    const handleVendorVehicleSelect = (vehicle: any) => {
        setNewItem(prev => ({
            ...prev,
            vehicleNumber: vehicle.vehicleNumber,
            category: vehicle.vehicleType || 'Lorry',
            name: vehicle.vehicleName || '',
            driverName: vehicle.driverName || '',
            ownerName: selectedVendor?.name || ''
        }));
    };

    const handleAdd = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...newItem,
                type: 'Vehicle',
                contractor: newItem.contractor && newItem.contractor.trim() !== '' ? newItem.contractor : null
            };

            const endpoint = editItem
                ? `/master/vehicles/${editItem._id}`
                : '/master/vehicles';

            const method = editItem ? 'put' : 'post';

            const { data: json } = await (api as any)[method](endpoint, payload);
            if (json.success) {
                showToast(editItem ? 'Vehicle updated successfully!' : 'Vehicle registered successfully!', 'success');
                resetForm();
                fetchData();
            }
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Error saving vehicle data';
            showToast(message, 'error');
        }
    };

    const resetForm = () => {
        setNewItem({
            name: '', category: '', description: '', type: 'Vehicle', vehicleNumber: '', mobile: '',
            modelNumber: '', registrationNumber: '', purchaseDate: '', purchaseCost: '',
            currentCondition: '', operatorName: '', ownerName: '', driverName: '',
            rcInsuranceDetails: '', permitExpiryDate: '', mileageDetails: '',
            ownershipType: activeTab === 'own' ? 'Own' : 'Contract',
            contractor: ''
        });
        setEditItem(null);
        setSelectedVendor(null);
        setFormView(false);
        setDetailsView(null);
    };

    const [expenseHistory, setExpenseHistory] = useState({
        diesel: [],
        maintenance: []
    });

    const handleViewDetails = async (asset: any) => {
        setLoading(true);
        try {
            const plateNum = asset.vehicleNumber || asset.registrationNumber;
            const displayName = asset.category ? `${asset.category} (${plateNum})` : (plateNum ? `${asset.name} (${plateNum})` : asset.name);

            const dateQuery = filterDates.start && filterDates.end ? `&startDate=${filterDates.start}&endDate=${filterDates.end}` : '';

            const [dieselRes, maintenanceRes, statsRes] = await Promise.all([
                api.get(`/reports/fuel-tracking?vehicleOrMachine=${encodeURIComponent(displayName)}${dateQuery}`),
                api.get(`/reports/maintenance-history?vehicleOrMachine=${encodeURIComponent(displayName)}${dateQuery}`),
                api.get(`/reports/vehicle-cost?${dateQuery.replace('&', '')}`)
            ]);

            setExpenseHistory({
                diesel: dieselRes.data.success ? dieselRes.data.data : [],
                maintenance: maintenanceRes.data.success ? maintenanceRes.data.data : []
            });

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            setDetailsView(asset);
        } catch (error) {
            console.error(error);
            showToast('Error loading expense details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!detailsView) return;

        const wb = XLSX.utils.book_new();

        // 1. Diesel Data
        if (expenseHistory.diesel.length > 0) {
            const dieselData = expenseHistory.diesel.map((e: any) => ({
                Date: new Date(e.date).toLocaleDateString(),
                Reading: e.meterReading || '-',
                'Qty (L)': e.quantity,
                Rate: e.rate,
                Amount: e.amount,
                'Payment Mode': e.paymentMode
            }));
            const ws = XLSX.utils.json_to_sheet(dieselData);
            XLSX.utils.book_append_sheet(wb, ws, 'Diesel Expenses');
        }

        // 2. Maintenance Data
        if (expenseHistory.maintenance.length > 0) {
            const maintData = expenseHistory.maintenance.map((e: any) => ({
                Date: new Date(e.date).toLocaleDateString(),
                Type: e.maintenanceType || 'Regular',
                'Vendor/Description': e.vendorName || e.description || '-',
                'Spare Parts Cost': e.sparePartsCost || 0,
                'Labour Charge': e.labourCharge || 0,
                'Total Amount': e.amount
            }));
            const ws = XLSX.utils.json_to_sheet(maintData);
            XLSX.utils.book_append_sheet(wb, ws, 'Maintenance');
        }

        const fileName = `${detailsView.name}_Expenses_${filterDates.start || 'All'}_to_${filterDates.end || 'Now'}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    useEffect(() => {
        if (detailsView) {
            handleViewDetails(detailsView);
        }
    }, [filterDates.start, filterDates.end]);

    const handleEdit = (item: any) => {
        setEditItem(item);
        const vendor = item.contractor?._id ? vendors.find(v => v._id === item.contractor._id) : null;
        setSelectedVendor(vendor);

        setNewItem({
            name: item.name,
            category: item.category || '',
            description: item.description || '',
            type: 'Vehicle',
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
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const { data } = await api.delete(`/master/vehicles/${deleteId}`);
            if (data.success) {
                showToast('Vehicle deleted successfully!', 'success');
                fetchData();
            }
        } catch (error) {
            console.error(error);
            showToast('Error deleting vehicle', 'error');
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
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Vehicle Details</span></li>
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
                                <h5 className="text-xl font-black text-black dark:text-white-light uppercase tracking-tight">{editItem ? 'Edit Vehicle Profile' : 'Register New Fleet Vehicle'}</h5>
                                <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Fleet Asset Management Portal</p>
                            </div>
                        </div>
                    </div>

                    <form className="max-w-5xl mx-auto space-y-10" onSubmit={handleAdd}>
                        <div className="space-y-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-[0.2em] border-b border-primary/10 pb-3 mb-4">
                                <IconPlus className="w-4 h-4" />
                                1. Registration Type (பதிவு வகை)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Ownership Type</label>
                                    <select
                                        name="ownershipType"
                                        className="form-select border-2 font-bold rounded-xl h-12 border-primary"
                                        value={newItem.ownershipType}
                                        onChange={handleChange}
                                    >
                                        <option value="Own">Own Vehicle (சொந்த வாகனம்)</option>
                                        <option value="Contract">Contract / Vendor Vehicle (ஒப்பந்த வாகனம்)</option>
                                    </select>
                                </div>
                                {newItem.ownershipType === 'Contract' && (
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Select Transport Vendor</label>
                                        <select
                                            name="contractor"
                                            className="form-select border-2 font-bold rounded-xl h-12 border-warning"
                                            value={newItem.contractor}
                                            onChange={handleChange}
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

                            {newItem.ownershipType === 'Contract' && selectedVendor && selectedVendor.vehicles?.length > 0 && (
                                <div className="mt-6 p-5 bg-warning/5 rounded-2xl border border-warning/20">
                                    <label className="text-[10px] font-black text-warning uppercase tracking-widest mb-3 block">Vendor&apos;s Registered Vehicles</label>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedVendor.vehicles.map((v: any, idx: number) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={`px-4 py-3 rounded-xl text-xs font-black transition-all border shadow-sm ${newItem.vehicleNumber === v.vehicleNumber ? 'bg-warning text-white border-warning scale-105' : 'bg-white text-warning border-warning/30 hover:bg-warning/10'}`}
                                                onClick={() => handleVendorVehicleSelect(v)}
                                            >
                                                {v.vehicleNumber} ({v.vehicleType})
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-white-dark mt-3 font-bold opacity-70">Click to auto-fill vehicle details.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 bg-info/5 p-6 rounded-2xl border border-info/10">
                            <div className="flex items-center gap-2 text-info font-black uppercase text-xs tracking-[0.2em] border-b border-info/10 pb-3 mb-4">
                                <IconPlus className="w-4 h-4" />
                                2. Vehicle Specifications (வாகன விவரங்கள்)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Vehicle Category</label>
                                    <select
                                        name="category"
                                        className="form-select border-2 font-bold rounded-xl h-12"
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat: any) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Vehicle Name / Model</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input border-2 font-bold rounded-xl h-12"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        required
                                        placeholder="Enter Vehicle Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Vehicle Plate Number (Unique)</label>
                                    <input
                                        type="text"
                                        name="vehicleNumber"
                                        className="form-input border-2 font-bold rounded-xl h-12 uppercase"
                                        value={newItem.vehicleNumber}
                                        onChange={(e) => setNewItem({ ...newItem, vehicleNumber: e.target.value })}
                                        placeholder="TN 99 XX 1234"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Owner Name</label>
                                    <input type="text" placeholder="Enter Owner Name" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.ownerName} onChange={(e) => setNewItem({ ...newItem, ownerName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Driver Name</label>
                                    <input type="text" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.driverName} onChange={(e) => setNewItem({ ...newItem, driverName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Driver Mobile Number</label>
                                    <input type="text" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.mobile} onChange={(e) => setNewItem({ ...newItem, mobile: e.target.value })} placeholder="Enter Mobile Number" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Permit Expiry Date</label>
                                    <input type="date" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.permitExpiryDate} onChange={(e) => setNewItem({ ...newItem, permitExpiryDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-4">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">RC / Insurance Details</label>
                                    <input type="text" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.rcInsuranceDetails} onChange={(e) => setNewItem({ ...newItem, rcInsuranceDetails: e.target.value })} placeholder="Policy Number, Expiry, etc." />
                                </div>
                            </div>
                        </div>

                        {canSeeFinancials && (
                            <div className="space-y-6 bg-success/5 p-6 rounded-2xl border border-success/10">
                                <div className="flex items-center gap-2 text-success font-black uppercase text-xs tracking-[0.2em] border-b border-success/10 pb-3 mb-4">
                                    <IconPlus className="w-4 h-4" />
                                    3. Financials & Condition (நிதி மற்றும் நிலை)
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Purchase Cost (₹)</label>
                                        <input type="number" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.purchaseCost} onChange={(e) => setNewItem({ ...newItem, purchaseCost: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Mileage / Stats</label>
                                        <input type="text" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.mileageDetails} onChange={(e) => setNewItem({ ...newItem, mileageDetails: e.target.value })} placeholder="Kmpl information" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Purchase Date</label>
                                        <input type="date" className="form-input border-2 font-bold rounded-xl h-12" value={newItem.purchaseDate} onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 pt-4">
                                    <div>
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Notes</label>
                                        <textarea
                                            className="form-textarea border-2 font-bold rounded-xl min-h-[100px]"
                                            value={newItem.description}
                                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-4 pt-10 border-t-2 border-primary/5">
                            <button type="button" className="btn btn-outline-danger px-10 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-14 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_20px_rgba(67,97,238,0.3)]">
                                <IconSave className="ltr:mr-2 rtl:ml-2 w-4 h-4" />
                                {editItem ? 'Update Vehicle' : 'Save Vehicle'}
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
                                            <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{detailsView.vehicleNumber}</span>
                                        </div>
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{detailsView.category} • {detailsView.ownershipType === 'Own' ? 'Own Fleet' : 'Contractor Fleet'}</p>
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
                                            disabled={expenseHistory.diesel.length === 0 && expenseHistory.maintenance.length === 0}
                                        >
                                            <IconDownload className="w-4 h-4 mr-2" /> Export XL
                                        </button>
                                    )}
                                    {canEditRecord(currentUser, detailsView.createdAt) && (
                                        <button onClick={() => handleEdit(detailsView)} className="btn btn-info rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest h-10">
                                            <IconEdit className="w-4 h-4 mr-2" /> Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Profile Stats */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white-light dark:bg-[#1b2a47] p-5 rounded-2xl border border-gray-100 dark:border-white-light/5">
                                        <h6 className="text-xs font-black uppercase text-white-dark tracking-widest mb-4">Core Info</h6>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-white-dark block mb-1">Driver</span>
                                                <span className="text-sm font-black">{detailsView.driverName || 'N/A'} {detailsView.mobile ? `(${detailsView.mobile})` : ''}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-black">{detailsView.vehicleNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-white-dark block mb-1">Owner</span>
                                                <span className="text-sm font-black">{detailsView.ownerName || (detailsView.ownershipType === 'Own' ? 'Internal' : detailsView.contractor?.name) || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-white-dark block mb-1">Condition</span>
                                                <span className="text-sm font-black">{detailsView.currentCondition || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-white-dark block mb-1">Purchase Date</span>
                                                <span className="text-sm font-black">{detailsView.purchaseDate ? new Date(detailsView.purchaseDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {(() => {
                                        const plateNum = detailsView.vehicleNumber || detailsView.registrationNumber;
                                        const displayName = detailsView.category ? `${detailsView.category} (${plateNum})` : (plateNum ? `${detailsView.name} (${plateNum})` : detailsView.name);
                                        const vehicleStats = stats.find(s => s._id === displayName);

                                        return canSeeFinancials && (
                                            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                                                <h6 className="text-xs font-black uppercase text-primary tracking-widest mb-4">Cost Analytics</h6>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-bold text-white-dark">Diesel</span>
                                                        <span className="font-black text-black dark:text-white">₹ {(vehicleStats?.fuelCost || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-bold text-white-dark">Maintenance</span>
                                                        <span className="font-black text-black dark:text-white">₹ {(vehicleStats?.maintenanceCost || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="pt-3 border-t border-primary/20 flex justify-between items-center">
                                                        <span className="text-xs font-black uppercase text-primary">Total Exp.</span>
                                                        <span className="text-lg font-black text-primary">₹ {(vehicleStats?.totalCost || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Detailed History Tabs */}
                                <div className="lg:col-span-3">
                                    <div className="panel bg-[#f6f8fa] dark:bg-black p-4 rounded-2xl">
                                        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-white-light/10 pb-2">
                                            <h6 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Expense Tracks</h6>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Diesel Section */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase text-[#e91e63] tracking-widest">
                                                    <span>⛽ Diesel History</span>
                                                </div>
                                                <div className="table-responsive">
                                                    <table className="table-hover table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Date</th>
                                                                <th>Reading</th>
                                                                <th>Qty (L)</th>
                                                                <th>Rate</th>
                                                                <th className="text-right">Amount</th>
                                                                <th>Mode</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {expenseHistory.diesel.length > 0 ? expenseHistory.diesel.slice(0, 5).map((e: any, idx: number) => (
                                                                <tr key={idx}>
                                                                    <td className="font-bold">{new Date(e.date).toLocaleDateString()}</td>
                                                                    <td className="font-black text-info">{e.meterReading || '-'}</td>
                                                                    <td className="font-bold">{e.quantity}</td>
                                                                    <td>{e.rate}</td>
                                                                    <td className="text-right font-black text-danger">₹ {e.amount.toLocaleString()}</td>
                                                                    <td><span className="badge badge-outline-dark uppercase text-[9px]">{e.paymentMode}</span></td>
                                                                </tr>
                                                            )) : (
                                                                <tr><td colSpan={6} className="text-center py-4 italic opacity-50">No diesel records found</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Maintenance Section */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase text-[#00bcd4] tracking-widest">
                                                    <span>🛠️ Service & Maintenance</span>
                                                </div>
                                                <div className="table-responsive">
                                                    <table className="table-hover table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Date</th>
                                                                <th>Type</th>
                                                                <th>Vendor / Desc</th>
                                                                <th className="text-right">Parts</th>
                                                                <th className="text-right">Labour</th>
                                                                <th className="text-right font-black">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {expenseHistory.maintenance.length > 0 ? expenseHistory.maintenance.slice(0, 5).map((e: any, idx: number) => (
                                                                <tr key={idx}>
                                                                    <td className="font-bold">{new Date(e.date).toLocaleDateString()}</td>
                                                                    <td><span className="text-[10px] font-black uppercase px-2 py-0.5 bg-info/10 text-info rounded">{e.maintenanceType || 'Regular'}</span></td>
                                                                    <td className="max-w-[150px] truncate font-bold">{e.vendorName || e.description || '-'}</td>
                                                                    <td className="text-right">{(e.sparePartsCost || 0).toLocaleString()}</td>
                                                                    <td className="text-right">{(e.labourCharge || 0).toLocaleString()}</td>
                                                                    <td className="text-right font-black text-danger">₹ {e.amount.toLocaleString()}</td>
                                                                </tr>
                                                            )) : (
                                                                <tr><td colSpan={6} className="text-center py-4 italic opacity-50">No maintenance records found</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h5 className="text-2xl font-black text-black dark:text-white-light uppercase tracking-tight">Vehicle Details</h5>
                            <p className="text-white-dark text-sm font-bold mt-1">Manage Lorries, Tippers, and Transport Fleet</p>
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
                                <IconPlus className="mr-2" /> Add Vehicle
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="panel h-72 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-3xl"></div>
                            ))
                        ) : filteredAssets.length === 0 ? (
                            <div className="col-span-full panel py-20 text-center uppercase font-black tracking-[0.2em] opacity-20 text-xl">No {activeTab === 'own' ? 'Own' : 'Contract'} Vehicles Found</div>
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
                                                    <span className={`font-black text-[10px] uppercase tracking-[0.2em] block leading-none ${activeTab === 'own' ? 'text-primary' : 'text-warning'}`}>{asset.category || 'Vehicle'}</span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${activeTab === 'own' ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                                                        {activeTab === 'own' ? 'Own Fleet' : asset.contractor?.name || 'Contractor'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleViewDetails(asset)} className="p-2 bg-white/50 dark:bg-white/10 rounded-lg hover:text-primary transition-colors shadow-sm" title="View Details">
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
                                            <div className="flex justify-between items-start mb-1">
                                                <h6 className="text-xl font-black text-black dark:text-white-light line-clamp-1">{asset.name}</h6>
                                                <span className="text-[10px] font-black italic text-info uppercase">{asset.mileageDetails || '- KMPL'}</span>
                                            </div>
                                            <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-widest mb-4 inline-block">
                                                {asset.vehicleNumber || 'No Plate'}
                                            </span>

                                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white-light/5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-white-dark block tracking-widest mb-1">Driver</span>
                                                        <span className="text-sm font-bold text-black dark:text-white-light truncate block">{asset.driverName || 'Not Assigned'}</span>
                                                        {asset.mobile && <span className="text-[10px] font-black text-info">{asset.mobile}</span>}
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-white-dark block tracking-widest mb-1">Owner</span>
                                                        <span className="text-sm font-bold text-black dark:text-white-light truncate block">{asset.ownerName || '-'}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-white-light/5 p-3 rounded-xl border border-gray-100 dark:border-white-light/5">
                                                    <span className="text-[9px] font-black uppercase text-white-dark block tracking-widest mb-1">Permit Status</span>
                                                    <span className={`text-sm font-black ${asset.permitExpiryDate && new Date(asset.permitExpiryDate) < new Date() ? 'text-danger animate-pulse' : 'text-success'}`}>
                                                        {asset.permitExpiryDate ? new Date(asset.permitExpiryDate).toLocaleDateString() : 'No Data'}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-white-dark font-bold truncate">
                                                    RC/Ins: {asset.rcInsuranceDetails || 'Not Provided'}
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
                title="Delete Vehicle"
                message="Are you sure you want to delete this vehicle? This action cannot be undone."
            />
        </div>
    );
};

export default VehicleDetails;
