'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import api, { getFileUrl } from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import { canEditRecord } from '@/utils/permissions';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSearch from '@/components/icon/icon-search';
import IconX from '@/components/icon/icon-x';
import IconSave from '@/components/icon/icon-save';
import IconDownload from '@/components/icon/icon-download';
import * as XLSX from 'xlsx';

const TripManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';

    const { showToast } = useToast();
    const [trips, setTrips] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filter states
    const [search, setSearch] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterMaterial, setFilterMaterial] = useState('');
    const [filterSaleType, setFilterSaleType] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 50;


    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        vehicleId: '',
        vehicleType: 'Own',
        driverId: '',
        driverName: '',
        fromLocation: 'Quarry',
        toLocation: '',
        stoneTypeId: '',
        customerId: '',
        permitId: '',
        loadQuantity: '',
        loadUnit: 'Tons',
        notes: '',
        billUrl: '',
        billNumber: '',
        manualVehicleNumber: '',
        saleType: 'Direct',
        entityType: 'Customer',
        contractorId: ''
    };

    const [formData, setFormData] = useState(initialForm);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [labours, setLabours] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [contractors, setContractors] = useState<any[]>([]);
    const [stoneTypes, setStoneTypes] = useState<any[]>([]);
    const [vehicleCategories, setVehicleCategories] = useState<any[]>([]);
    const [permits, setPermits] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tripRes, vehicleRes, labourRes, customerRes, stoneRes, categoryRes, salesRes, permitRes, contractorRes] = await Promise.all([
                api.get('/trips'),
                api.get('/master/vehicles'),
                api.get('/labour'),
                api.get('/master/customers'),
                api.get('/master/stone-types'),
                api.get('/master/vehicle-categories'),
                api.get('/sales'),
                api.get('/permits'),
                api.get('/vendors/transport'),
            ]);

            if (tripRes.data.success) {
                const sortedTrips = tripRes.data.data.sort((a: any, b: any) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b._id || '').localeCompare(a._id || '');
                });
                setTrips(sortedTrips);
            }
            if (vehicleRes.data.success) {
                // Filter out MACHINES (JCBs, etc.) from Transport Trip Management
                const transportOnly = vehicleRes.data.data.filter((v: any) => v.type === 'Vehicle');
                setVehicles(transportOnly);

                // Default to filtering by "Own" as per initial form state
                const owned = transportOnly.filter((v: any) => {
                    const ownership = v.ownershipType?.toLowerCase();
                    const category = v.category?.toLowerCase();
                    return ownership === 'own' || (!ownership && (category === 'own' || category === 'lorry'));
                });
                setFilteredVehicles(owned);
            }
            if (labourRes.data.success) setLabours(labourRes.data.data);
            if (customerRes.data.success) setCustomers(customerRes.data.data);
            if (stoneRes.data.success) setStoneTypes(stoneRes.data.data);
            if (categoryRes.data.success) setVehicleCategories(categoryRes.data.data);
            if (salesRes && salesRes.data.success) {
                const sortedSales = salesRes.data.data.sort((a: any, b: any) => {
                    const dateA = new Date(a.invoiceDate).getTime();
                    const dateB = new Date(b.invoiceDate).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b._id || '').localeCompare(a._id || '');
                });
                setSales(sortedSales);
            }
            if (permitRes.data.success) setPermits(permitRes.data.data);
            if (contractorRes.data.success) setContractors(contractorRes.data.data);
        } catch (error) {
            console.error(error);
            showToast('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setFilterVehicle('');
        setFilterCustomer('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterMaterial('');
        setFilterSaleType('');
    };

    const filteredTrips = useMemo(() => {
        return trips.filter((t: any) => {
            const vNum = t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || '';
            const dName = t.driverName || t.driverId?.name || '';
            const cName = t.customerId?.name || '';
            const invoiceNum = t.saleId?.invoiceNumber || '';
            const material = t.stoneTypeId?.name || '';

            const matchesSearch = !search ||
                vNum.toLowerCase().includes(search.toLowerCase()) ||
                dName.toLowerCase().includes(search.toLowerCase()) ||
                cName.toLowerCase().includes(search.toLowerCase()) ||
                invoiceNum.toLowerCase().includes(search.toLowerCase()) ||
                material.toLowerCase().includes(search.toLowerCase()) ||
                t.fromLocation?.toLowerCase().includes(search.toLowerCase()) ||
                t.toLocation?.toLowerCase().includes(search.toLowerCase());

            const matchesVehicle = !filterVehicle || vNum === filterVehicle;
            const cId = t.customerId?._id || t.customerId || '';
            const matchesCustomer = !filterCustomer || cId === filterCustomer;

            const tripDate = t.date ? new Date(t.date).toISOString().split('T')[0] : '';
            const matchesStart = !filterStartDate || tripDate >= filterStartDate;
            const matchesEnd = !filterEndDate || tripDate <= filterEndDate;

            const matId = t.stoneTypeId?._id || t.stoneTypeId || '';
            const matchesMaterial = !filterMaterial || matId === filterMaterial;
            const matchesSaleType = !filterSaleType || t.saleType === filterSaleType;

            return matchesSearch && matchesVehicle && matchesCustomer && matchesStart && matchesEnd && matchesMaterial && matchesSaleType;
        });
    }, [trips, search, filterVehicle, filterCustomer, filterStartDate, filterEndDate, filterMaterial, filterSaleType]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterVehicle, filterCustomer, filterStartDate, filterEndDate, filterMaterial, filterSaleType]);

    const filterVehiclesBy = (allVehicles: any[], type: string) => {
        if (type === '3rd Party') {
            setFilteredVehicles([]);
            return;
        }
        if (!type || type === 'All') {
            setFilteredVehicles(allVehicles);
            return;
        }
        const filtered = allVehicles.filter((v: any) => {
            const ownership = v.ownershipType?.toLowerCase();
            const category = v.category?.toLowerCase();

            if (type === 'Own') {
                return ownership === 'own' || (!ownership && (category === 'own' || category === 'lorry'));
            }
            if (type === 'Contractor') {
                // If ownership is explicitly 'contractor' OR if it's not 'own' (and category isn't own)
                return ownership === 'contractor' || (ownership && ownership !== 'own') || category === 'contractor';
            }
            return category === type.toLowerCase() || ownership === type.toLowerCase();
        });
        setFilteredVehicles(filtered);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'vehicleType') {
            filterVehiclesBy(vehicles, value);
            // Reset vehicle selection when type changes
            setFormData(prev => ({ ...prev, vehicleId: '', manualVehicleNumber: '', driverName: '', driverId: '' }));
        }

        if (name === 'vehicleId') {
            const selectedVehicle = vehicles.find((v: any) => v._id === value);
            if (selectedVehicle) {
                // If the vehicle has a driver, auto-fill it
                if (selectedVehicle.driverName) {
                    const vName = selectedVehicle.driverName;
                    const worker = labours.find((l: any) => l.name?.trim().toLowerCase() === vName.trim().toLowerCase());
                    setFormData(prev => ({ ...prev, driverName: vName, driverId: worker ? worker._id : '' }));
                } else if (selectedVehicle.operatorName) {
                    const vName = selectedVehicle.operatorName;
                    const worker = labours.find((l: any) => l.name?.trim().toLowerCase() === vName.trim().toLowerCase());
                    setFormData(prev => ({ ...prev, driverName: vName, driverId: worker ? worker._id : '' }));
                }
            }
        }

        if (name === 'customerId') {
            setFormData(prev => ({ ...prev, customerId: value, fromLocation: 'Quarry', toLocation: '' }));
            return;
        }



        if (name === 'driverName') {
            const worker = labours.find((l: any) => l.name?.trim().toLowerCase() === value.trim().toLowerCase());
            setFormData(prev => ({ ...prev, driverId: worker ? worker._id : '' }));
        }

        // When permit is selected → auto-fill vehicle & driver IF unique
        if (name === 'permitId') {
            if (!value) return;
            const permit = permits.find(p => p._id === value);
            if (permit) {
                // Only auto-fill vehicle if it's a single-vehicle permit and currently unselected
                if (permit.vehicleIds?.length === 1 && !formData.vehicleId) {
                    const vObj = permit.vehicleIds[0];
                    const vId = vObj._id || vObj;
                    const vType = vObj.category || 'Lorry';
                    const dName = vObj.driverName || vObj.operatorName || '';

                    setFormData(prev => ({
                        ...prev,
                        vehicleId: vId,
                        vehicleType: vType,
                        driverName: dName
                    }));

                    if (dName) {
                        const worker = labours.find((l: any) => l.name?.trim().toLowerCase() === dName.trim().toLowerCase());
                        setFormData(prev => ({ ...prev, driverId: worker ? worker._id : '' }));
                    }
                    filterVehiclesBy(vehicles, vType);
                }
            }
        }
    };


    const convertJfifToJpg = async (file: File): Promise<File> => {
        if (!file.name.toLowerCase().endsWith('.jfif')) return file;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const convertedFile = new File([blob], file.name.replace(/\.jfif$/i, '.jpg'), { type: 'image/jpeg' });
                            resolve(convertedFile);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    }, 'image/jpeg', 0.9);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];
            setUploading(true);
            try {
                if (file.name.toLowerCase().endsWith('.jfif')) {
                    showToast('Converting JFIF to JPG...', 'info');
                    file = await convertJfifToJpg(file);
                }
                const uploadData = new FormData();
                uploadData.append('bill', file);
                const { data } = await api.post('/upload', uploadData);
                if (data.success) {
                    setFormData(prev => ({ ...prev, billUrl: data.filePath }));
                    setSelectedFile(file);
                    showToast('Bill uploaded successfully!', 'success');
                }
            } catch (err) {
                console.error('File upload failed:', err);
                showToast('Upload failed. Please try again.', 'error');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleConvertToSale = async (tripId: string) => {
        if (isSaving) return;
        try {
            setIsSaving(true);
            const { data } = await api.post(`/trips/${tripId}/convert-to-sale`);
            if (data.success) {
                showToast('Trip converted to Sale successfully!', 'success');
                fetchData();
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error converting trip', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (isSaving) return;



        try {
            setIsSaving(true);
            const payload = { ...formData };
            if (payload.vehicleType === '3rd Party') {
                payload.vehicleId = ''; // Ensure no vehicle link for 3rd party
            }
            if (payload.vehicleId === 'manual') payload.vehicleId = '';
            if (editId) {
                await api.put(`/trips/${editId}`, payload);
                showToast('Record updated successfully!', 'success');
            } else {
                await api.post('/trips', payload);
                showToast('Record recorded successfully!', 'success');
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error saving record', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (trip: any) => {
        let vType = trip.vehicleType;
        if (!vType) {
            if (trip.manualVehicleNumber) {
                vType = '3rd Party';
            } else if (trip.vehicleId?.ownershipType === 'Own' || trip.vehicleId?.category?.toLowerCase() === 'own') {
                vType = 'Own';
            } else {
                vType = 'Contractor';
            }
        }
        filterVehiclesBy(vehicles, vType);
        setFormData({
            date: trip.date ? new Date(trip.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            vehicleId: trip.vehicleId?._id || trip.vehicleId || '',
            vehicleType: vType,
            saleType: trip.saleType || 'Direct',
            driverId: trip.driverId?._id || trip.driverId || '',
            driverName: trip.driverName || trip.driverId?.name || '',
            fromLocation: trip.fromLocation || 'Quarry',
            toLocation: trip.toLocation || '',
            stoneTypeId: trip.stoneTypeId?._id || trip.stoneTypeId || '',
            customerId: trip.customerId?._id || trip.customerId || '',
            permitId: trip.permitId?._id || trip.permitId || '',
            loadQuantity: trip.loadQuantity || '',
            loadUnit: trip.loadUnit || 'Tons',
            billNumber: trip.billNumber || '',
            billUrl: trip.billUrl || '',
            notes: trip.notes || '',
            manualVehicleNumber: trip.manualVehicleNumber || '',
            entityType: trip.contractorId ? 'Contractor' : 'Customer',
            contractorId: trip.contractorId?._id || trip.contractorId || '',
        });
        setEditId(trip._id);
        setShowForm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/trips/${deleteId}`);
            showToast('Record deleted successfully!', 'success');
            fetchData();
        } catch (error) {
            console.error(error);
            showToast('Error deleting record', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditId(null);
        setShowForm(false);
        setFilteredVehicles(vehicles);
    };

    // Sales for the selected customer that have remaining quantity
    const customerSales = formData.customerId
        ? sales.filter((s: any) => {
            const cId = s.customer?._id || s.customer;
            return cId === formData.customerId && s.status !== 'cancelled';
        })
        : [];

    // Materials available
    const saleMaterials: any[] = stoneTypes;

    const handleDownloadExcel = () => {
        try {
            if (filteredTrips.length === 0) return showToast('No data to export', 'error');
            const filtered = filteredTrips;

            const exportData = filtered.map((t: any) => ({
                'Date': new Date(t.date).toLocaleDateString('en-GB'),
                'Vehicle Number': t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.manualVehicleNumber || 'Unknown',
                'Driver': t.driverName || t.driverId?.name || 'N/A',
                'From': t.fromLocation || '',
                'To': t.toLocation || '',
                'Customer/Contractor': t.contractorId?.name || t.customerId?.name || 'Internal',
                'Material': t.stoneTypeId?.name || '',
                'Tons': t.loadQuantity || 0,
                'Bill Number': t.billNumber || '—',
                'Sale Type': t.saleType || 'Direct'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');
            XLSX.writeFile(workbook, `Trip_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast('Excel file downloaded successfully!', 'success');
        } catch (error) {
            console.error('Excel Download Error:', error);
            showToast('Failed to download Excel file', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">வாகன பயண மேலாண்மை (Vehicle Trip Management)</h2>
                    <p className="text-white-dark text-sm mt-1">Record and manage vehicle trips, loads and income</p>
                </div>
                <div className="flex items-center gap-2">
                    {isOwner && (
                        <button className="btn btn-outline-success gap-2" onClick={handleDownloadExcel}>
                            <IconDownload className="w-5 h-5" /> Download XL
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <IconPlus className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> Add New Trip
                    </button>
                </div>
            </div>


            {showForm && (
                <div className="panel animate__animated animate__fadeIn">
                    <div className="flex items-center justify-between mb-5 border-b pb-3 border-[#ebedf2] dark:border-[#1b2e4b]">
                        <h5 className="font-bold text-lg">{editId ? 'Edit Record' : 'New Trip Registration'}</h5>
                        <button onClick={resetForm} className="text-white-dark hover:text-danger">
                            <IconX />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 mb-6 group transition-all hover:bg-primary/10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h6 className="text-primary font-black uppercase text-[10px] tracking-widest">Sale Classification (விற்பனை வகை)</h6>
                                    <p className="text-[11px] text-white-dark font-bold">Categorize this trip for billing calculations</p>
                                </div>
                                <div className="flex items-center bg-white dark:bg-black/20 p-1.5 rounded-xl border border-primary/10 shadow-inner">
                                    <button
                                        type="button"
                                        className={`px-8 py-2 rounded-lg text-sm font-black transition-all duration-300 ${formData.saleType === 'Direct' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white-dark hover:text-primary'}`}
                                        onClick={() => setFormData(p => ({ ...p, saleType: 'Direct' }))}
                                    >
                                        DIRECT SALE
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-8 py-2 rounded-lg text-sm font-black transition-all duration-300 ${formData.saleType === '3rd Party' ? 'bg-warning text-white shadow-lg shadow-warning/30' : 'text-white-dark hover:text-warning'}`}
                                        onClick={() => setFormData(p => ({ ...p, saleType: '3rd Party' }))}
                                    >
                                        3RD PARTY SALE
                                    </button>
                                </div>
                            </div>
                        </div>

                        {formData.saleType === '3rd Party' && (
                            <div className="bg-warning/5 p-4 rounded-xl border border-warning/10 mb-6 group transition-all hover:bg-warning/10 animate__animated animate__fadeIn">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h6 className="text-warning font-black uppercase text-[10px] tracking-widest">Select Entity Type (அமைப்பு வகை)</h6>
                                        <p className="text-[10px] text-white-dark font-bold italic">Selling to a Customer or via a Transport Contractor?</p>
                                    </div>
                                    <div className="flex items-center bg-white dark:bg-black/20 p-1.5 rounded-xl border border-warning/10 shadow-inner">
                                        <button
                                            type="button"
                                            className={`px-6 py-1.5 rounded-lg text-xs font-black transition-all duration-300 ${formData.entityType === 'Customer' ? 'bg-primary text-white shadow-sm' : 'text-white-dark hover:text-primary'}`}
                                            onClick={() => setFormData(p => ({ ...p, entityType: 'Customer', contractorId: '' }))}
                                        >
                                            CUSTOMER
                                        </button>
                                        <button
                                            type="button"
                                            className={`px-6 py-1.5 rounded-lg text-xs font-black transition-all duration-300 ${formData.entityType === 'Contractor' ? 'bg-warning text-white shadow-sm' : 'text-white-dark hover:text-warning'}`}
                                            onClick={() => setFormData(p => ({ ...p, entityType: 'Contractor', customerId: '' }))}
                                        >
                                            CONTRACTOR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Trip Date</label>
                                <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Vehicle Category</label>
                                <select name="vehicleType" className="form-select border-primary" value={formData.vehicleType} onChange={handleChange} required>
                                    <option value="Own">Own Vehicle</option>
                                    <option value="Contractor">Contractor Vehicle</option>
                                    <option value="3rd Party">3rd Party Vehicle (Manual)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Vehicle Number</label>
                                {formData.vehicleType === '3rd Party' ? (
                                    <input
                                        type="text"
                                        name="manualVehicleNumber"
                                        className="form-input border-warning font-bold animate__animated animate__pulse"
                                        placeholder="Type Vehicle Number..."
                                        value={formData.manualVehicleNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                ) : (
                                    <select name="vehicleId" className="form-select border-primary" value={formData.vehicleId} onChange={handleChange} required>
                                        <option value="">Select Vehicle</option>
                                        {filteredVehicles.map((v: any) => (
                                            <option key={v._id} value={v._id}>
                                                {v.vehicleNumber || v.registrationNumber} ({v.name})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block font-primary">Driver Name (சாரதி பெயர்)</label>
                                <div className="relative">
                                    <input
                                        name="driverName"
                                        list="trip-labor-list"
                                        className="form-input font-bold"
                                        value={formData.driverName}
                                        onChange={handleChange}
                                        placeholder="Enter Driver Name..."
                                        required
                                    />
                                    <datalist id="trip-labor-list">
                                        {labours.map(l => (
                                            <option key={l._id} value={l.name}>{l.workType || 'Worker'}</option>
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Permit Link */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-primary">
                                    {formData.entityType === 'Contractor' ? 'Transport Contractor (போக்குவரத்து ஒப்பந்ததாரர்)' : 'Customer (வாடிக்கையாளர்)'} *
                                </label>
                                {formData.entityType === 'Contractor' ? (
                                    <select name="contractorId" className="form-select border-primary" value={formData.contractorId} onChange={handleChange}>
                                        <option value="">-- Select Contractor --</option>
                                        {contractors.map((v: any) => (
                                            <option key={v._id} value={v._id}>{v.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <select name="customerId" className="form-select border-primary" value={formData.customerId} onChange={handleChange}>
                                        <option value="">-- Select Customer --</option>
                                        {customers.map((c: any) => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-warning">Link Transport Permit</label>
                                <select
                                    name="permitId"
                                    className="form-select border-warning"
                                    value={formData.permitId}
                                    onChange={handleChange}
                                >
                                    <option value="">-- No Permit --</option>
                                    {permits
                                        .filter(p => {
                                            const isActive = p.status === 'Active' || p._id === formData.permitId;
                                            if (!isActive) return false;
                                            // Handle multi-vehicle check
                                            if (!p.vehicleIds || p.vehicleIds.length === 0) return true; // Global
                                            if (!formData.vehicleId) return true; // Show all if vehicle not picked yet
                                            return p.vehicleIds.some((v: any) => (v._id || v) === formData.vehicleId);
                                        })
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((p: any) => {
                                            const isToday = new Date(p.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                                            const rem = p.remainingTrips ?? (p.totalTripsAllowed - (p.usedTrips || 0));
                                            const vInfo = (p.vehicleIds || []).map((v: any) => v.vehicleNumber || v.registrationNumber).join(', ');
                                            return (
                                                <option key={p._id} value={p._id}>
                                                    {isToday ? '🆕 ' : ''}{p.permitNumber} — {vInfo || 'GLOBAL'} ({rem} left) {isToday ? '[TODAY]' : ''}
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>
                        </div>

                        {/* Auto-filled Location (read-only when sale selected) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <input
                                    type="text" name="fromLocation"
                                    className="form-input font-bold text-primary"
                                    value={formData.fromLocation}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="text" name="toLocation"
                                    className="form-input"
                                    value={formData.toLocation}
                                    onChange={handleChange}
                                    placeholder="Destination address"
                                    required
                                />
                            </div>
                        </div>

                        {/* Material / Quantity / Unit */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">
                                    Material Type
                                </label>
                                <select name="stoneTypeId" className="form-select" value={formData.stoneTypeId} onChange={handleChange} required>
                                    <option value="">Select Material</option>
                                    {saleMaterials.map((s: any) => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">
                                    Quantity (This Trip)
                                </label>
                                <input
                                    type="number" name="loadQuantity"
                                    className="form-input"
                                    value={formData.loadQuantity}
                                    onChange={handleChange}
                                    required step="0.01"
                                    placeholder="Enter qty for this trip"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block">Unit</label>
                                <select name="loadUnit" className="form-select" value={formData.loadUnit} onChange={handleChange} required>
                                    <option value="Tons">Tons</option>
                                    <option value="Units">Units</option>
                                    <option value="Loads">Loads</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-primary">Bill / LR Number *</label>
                                <input type="text" name="billNumber" className="form-input border-primary/20" value={formData.billNumber || ''} onChange={handleChange} placeholder="Invoice / LR Num" required />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white-dark uppercase mb-2 block text-primary">Bill Attachment</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <label className={`cursor-pointer flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 rounded-xl px-4 h-12 hover:border-primary/60 transition-all bg-white dark:bg-black/20 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                            <span className="text-xs text-primary font-bold uppercase">{uploading ? 'Uploading...' : 'Upload Bill'}</span>
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                                        </label>
                                        {(formData.billUrl || selectedFile) && !uploading && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm rounded-xl h-12"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, billUrl: '' }));
                                                    setSelectedFile(null);
                                                }}
                                            >
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    {formData.billUrl && (
                                        <div className="relative w-20 h-20 border-2 border-primary/20 rounded-xl overflow-hidden group shadow-sm">
                                            {formData.billUrl.match(/\.(jpg|jpeg|png|jfif|webp)$/i) || !formData.billUrl.includes('.') ? (
                                                <img src={getFileUrl(formData.billUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Bill Preview" />
                                            ) : (
                                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] uppercase">PDF</div>
                                            )}
                                            <a href={getFileUrl(formData.billUrl)} target="_blank" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase transition-opacity">
                                                View
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-info/5 p-4 rounded-lg">
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Remarks / Notes</label>
                            <textarea name="notes" className="form-textarea min-h-[80px]" value={formData.notes || ''} onChange={handleChange}></textarea>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4">
                            <button type="button" className="btn btn-outline-danger" onClick={resetForm} disabled={isSaving}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-8" disabled={isSaving}>
                                {isSaving ? (
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 ltr:mr-2 rtl:ml-2 inline-block"></span>
                                ) : (
                                    <IconSave className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                )}
                                {isSaving ? 'Saving...' : editId ? 'Update Record' : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <div className="panel">
                    <div className="flex flex-col gap-5 mb-5">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <h5 className="font-bold text-lg dark:text-white-light">Journey Logs (பயணப் பதிவுகள்)</h5>
                        </div>

                        {/* Filter Panel */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end bg-primary/5 p-4 rounded-xl">
                            {/* Search */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-bold uppercase mb-1 block">Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Vehicle, driver, route..."
                                        className="form-input ltr:pr-10 rtl:pl-10 h-10"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                                </div>
                            </div>
                            {/* Vehicle */}
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Vehicle</label>
                                <select className="form-select h-10" value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                                    <option value="">All Vehicles</option>
                                    {Array.from(new Set(vehicles.map((v: any) => v.vehicleNumber || v.registrationNumber))).map(num => (
                                        <option key={num as string} value={num as string}>{num as string}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Customer */}
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Customer</label>
                                <select className="form-select h-10" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
                                    <option value="">All Customers</option>
                                    {customers.map((c: any) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">From Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            {/* Date To */}
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">To Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                            {/* Material */}
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Material</label>
                                <select className="form-select h-10 border-info/20" value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
                                    <option value="">All Materials</option>
                                    {stoneTypes.map((st: any) => (
                                        <option key={st._id} value={st._id}>{st.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Sale Type */}
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Sale Type</label>
                                <select className="form-select h-10 border-warning/20" value={filterSaleType} onChange={(e) => setFilterSaleType(e.target.value)}>
                                    <option value="">All Types</option>
                                    <option value="Direct">Direct Sale</option>
                                    <option value="3rd Party">3rd Party Sale</option>
                                </select>
                            </div>
                            {/* Clear Filter */}
                            <div className="flex items-center">
                                <button
                                    type="button"
                                    className="btn btn-outline-danger h-10 w-full group overflow-hidden relative flex items-center justify-center gap-2 rounded-xl transition-all hover:bg-danger hover:text-white"
                                    onClick={clearFilters}
                                >
                                    <IconX className="w-4 h-4 transition-transform group-hover:rotate-90" />
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Clear All</span>
                                </button>
                            </div>
                        </div>
                    </div>


                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Vehicle / Driver</th>
                                    <th>Route & Customer</th>
                                    <th>Material</th>
                                    <th className="!text-center">LR / Bill</th>
                                    <th className="!text-center">Receipt</th>
                                    <th className="!text-center">Sale Status</th>
                                    <th className="!text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    if (loading) {
                                        return <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>;
                                    }
                                    if (filteredTrips.length === 0) {
                                        return <tr><td colSpan={8} className="text-center py-8">No records found matching your filters.</td></tr>;
                                    }

                                    const paginated = filteredTrips.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

                                    return paginated.map((trip: any) => (
                                        <tr key={trip._id}>
                                            <td>{new Date(trip.date).toLocaleDateString('en-GB')}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`badge ${trip.saleType === '3rd Party' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-primary/10 text-primary border-primary/20'} text-[8px] font-black uppercase tracking-widest w-max px-1`}>
                                                            {trip.saleType === '3rd Party' ? '3rd Party Sale' : 'Direct Sale'}
                                                        </span>
                                                        <span className={`badge ${trip.vehicleId?.ownershipType === 'Own' || trip.vehicleType === 'Own' ? 'badge-outline-success border-success/30 text-success' : 'badge-outline-primary'} text-[9px] font-black uppercase tracking-tighter py-0.5 px-1.5`}>
                                                            {trip.vehicleType === '3rd Party' || trip.manualVehicleNumber ? '3rd Party Vehicle' :
                                                                (trip.vehicleId?.ownershipType === 'Own' ? 'Our Fleet' :
                                                                    (trip.vehicleId?.contractor?.name || trip.vehicleId?.ownerName || 'Contractor'))}
                                                        </span>
                                                    </div>
                                                    <div className="font-bold text-primary">{trip.vehicleId?.vehicleNumber || trip.vehicleId?.registrationNumber || trip.manualVehicleNumber || 'Unknown'}</div>
                                                </div>
                                                <div className="text-xs text-secondary font-medium mt-1">{trip.driverName || trip.driverId?.name || 'No Driver'}</div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-white-dark uppercase tracking-tighter">
                                                        {trip.contractorId ? `CONTRACTOR: ${trip.contractorId.name}` : `CUSTOMER: ${trip.customerId?.name || 'INTERNAL'}`}
                                                    </span>
                                                    <div className="mt-1">
                                                        <span className="text-[10px] font-bold uppercase">{trip.fromLocation}</span>
                                                        <span className="mx-1 text-white-dark">→</span>
                                                        <span className="text-[10px] font-bold uppercase">{trip.toLocation}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-outline-dark">{trip.stoneTypeId?.name || 'Material'}</span>
                                                <div className="text-[10px] mt-1 font-bold">{trip.loadQuantity} {trip.loadUnit}</div>
                                            </td>
                                            <td className="!text-center font-bold text-primary text-xs">{trip.billNumber || '—'}</td>
                                            <td className="!text-center">
                                                {trip.billUrl ? (
                                                    <a href={getFileUrl(trip.billUrl)} target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-110 transition-all inline-block p-1 bg-primary/10 rounded-md shadow-sm">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                    </a>
                                                ) : (
                                                    <span className="text-white-dark/30">—</span>
                                                )}
                                            </td>
                                            <td className="!text-center">
                                                {trip.saleId ? (
                                                    <span className="badge badge-outline-success font-black uppercase text-[9px] border-2 border-dashed">Billed</span>
                                                ) : (
                                                    <span className="badge badge-outline-danger font-black uppercase text-[9px] border-2 border-primary/20 bg-danger/5">Pending</span>
                                                )}
                                            </td>

                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {canEditRecord(currentUser, trip.createdAt || trip.date) ? (
                                                        <button onClick={() => handleEdit(trip)} className="btn btn-sm btn-outline-primary p-1">
                                                            <IconEdit className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-white-dark italic">Locked</span>
                                                    )}
                                                    {isOwner && (
                                                        <button onClick={() => setDeleteId(trip._id)} className="btn btn-sm btn-outline-danger p-1">
                                                            <IconTrashLines className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                    {filteredTrips.length > PAGE_SIZE && (
                        <div className="flex justify-center items-center mt-5 gap-2 pb-4">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </button>
                            <span className="text-sm font-bold">
                                Page {currentPage} of {Math.ceil(filteredTrips.length / PAGE_SIZE)}
                            </span>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                disabled={currentPage === Math.ceil(filteredTrips.length / PAGE_SIZE)}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Trip Record"
                message="Are you sure you want to delete this trip record? This will also remove associated profit data."
            />
        </div>
    );
};

export default TripManagement;
