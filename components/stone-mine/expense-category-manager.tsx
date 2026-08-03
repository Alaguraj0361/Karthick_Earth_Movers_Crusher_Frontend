'use client';
import React, { useEffect, useState, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconX from '@/components/icon/icon-x';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSearch from '@/components/icon/icon-search';
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';

import api, { BASE_URL, getFileUrl } from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import { canEditRecord } from '@/utils/permissions';

interface ExpenseCategoryManagerProps {
    category: string;
    title: string;
}

const ExpenseCategoryManager = ({ category, title }: ExpenseCategoryManagerProps) => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';

    const { showToast } = useToast();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [labours, setLabours] = useState<any[]>([]);
    const [contractors, setContractors] = useState<any[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
    const [workTypes, setWorkTypes] = useState<any[]>([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([]);
    const [sparePartsInventory, setSparePartsInventory] = useState<any[]>([]);
    const [selectedContractorSummary, setSelectedContractorSummary] = useState<any>(null);

    // View State
    const [formView, setFormView] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    // Form States
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [lookupMonth, setLookupMonth] = useState(new Date().getMonth() + 1);
    const [lookupYear, setLookupYear] = useState(new Date().getFullYear());
    const [listMonth, setListMonth] = useState(new Date().getMonth() + 1);
    const [listYear, setListYear] = useState(new Date().getFullYear());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedInputFile, setSelectedInputFile] = useState<File | null>(null);
    const [selectedOutputFile, setSelectedOutputFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState({ main: false, input: false, output: false });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterAssetType, setFilterAssetType] = useState('');
    const [filterVehicleType, setFilterVehicleType] = useState('');
    const [filterVendor, setFilterVendor] = useState('');
    const [filterLabour, setFilterLabour] = useState('');
    const [filterWorkType, setFilterWorkType] = useState('');
    const [filterWageType, setFilterWageType] = useState('');
    const [filterMaintenanceType, setFilterMaintenanceType] = useState('');
    const [filterOfficeCategory, setFilterOfficeCategory] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterSite, setFilterSite] = useState('');
    const [filterTransportType, setFilterTransportType] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [formData, setFormData] = useState({
        category: category,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        assetType: '', // Machine or Vehicle
        vehicleOrMachine: '',
        vehicleType: '',
        vehicleNumber: '',
        quantity: '',
        rate: '',
        paymentMode: 'Cash',
        meterReading: '',
        billUrl: '',
        inputBillUrl: '',
        outputBillUrl: '',
        // Maintenance specialized fields
        maintenanceType: '',
        sparePartsCost: '',
        labourCharge: '',
        vendorName: '',
        // Labour specialized fields
        labourId: '',
        labourName: '',
        workType: '',
        wageType: '',
        perDaySalary: '',
        advanceDeduction: '',
        netPay: '',
        siteAssigned: '',
        labourType: '',
        otAmount: '',
        salaryMonth: '',
        salaryYear: '',
        totalWorkingDays: '',
        // Explosive specialized fields
        site: '',
        explosiveType: '',
        unit: 'Nos',
        supplierName: '',
        licenseNumber: '',
        supervisorName: '',
        // Transport specialized fields
        transportType: '',
        fromLocation: '',
        toLocation: '',
        driverName: '',
        loadDetails: '',
        // Office & Misc specialized fields
        officeExpenseType: '',
        paidTo: '',
        billNumber: '',
        nextServiceDate: '',
        sparePartSource: 'Bought', // 'Own' or 'Bought'
        sparePartName: '',
        workshopName: '',
        internalSpareId: '',
    });

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params: any = { category };
            if (category === 'Labour Wages') {
                params.month = listMonth;
                params.year = listYear;
            }
            const { data } = await api.get('/expenses', { params });
            if (data.success) {
                setExpenses(data.data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            // Fetch both Master Owned Vehicles and Contractor Vehicles
            const [masterRes, transportRes] = await Promise.all([
                api.get('/master/vehicles'),
                api.get('/vendors/transport')
            ]);

            let allVehicles: any[] = [];
            
            // 1. Add Master Vehicles (Own or pre-registered Contract vehicles)
            if (masterRes.data.success) {
                allVehicles = [...masterRes.data.data];
            }

            // 2. Add Vehicles linked to Transport Vendors
            if (transportRes.data.success) {
                transportRes.data.data.forEach((vendor: any) => {
                    const contractorVehicles = (vendor.vehicles || []).map((v: any) => ({
                        _id: `${vendor._id}_${v.vehicleNumber}`, // Pseudo ID
                        vehicleNumber: v.vehicleNumber,
                        registrationNumber: v.vehicleNumber,
                        type: 'Vehicle',
                        ownershipType: 'Contract',
                        contractor: vendor,
                        category: v.vehicleType || 'Lorry',
                        name: v.vehicleName || v.vehicleType || 'Lorry',
                        driverName: v.driverName || '',
                        mobile: v.driverMobile || ''
                    }));
                    
                    // Avoid duplicates if they already exist in master
                    contractorVehicles.forEach((cv: any) => {
                        if (!allVehicles.some(av => av.vehicleNumber === cv.vehicleNumber)) {
                            allVehicles.push(cv);
                        }
                    });
                });
            }

            setVehicles(allVehicles);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const fetchLabours = async () => {
        try {
            const { data } = await api.get('/master/labours');
            if (data.success) setLabours(data.data);
        } catch (error) {
            console.error('Error fetching labours:', error);
        }
    };

    const fetchContractors = async () => {
        try {
            const { data } = await api.get('/vendors/labour');
            if (data.success) setContractors(data.data);
        } catch (error) {
            console.error('Error fetching contractors:', error);
        }
    };

    const fetchWorkTypes = async () => {
        try {
            const { data } = await api.get('/master/work-types');
            if (data.success) setWorkTypes(data.data);
        } catch (error) {
            console.error('Error fetching work types:', error);
        }
    };

    const fetchExpenseCategories = async () => {
        try {
            const { data } = await api.get('/master/expense-categories');
            if (data.success) setExpenseCategories(data.data);
        } catch (error) {
            console.error('Error fetching expense categories:', error);
        }
    };

    const fetchMaintenanceTypes = async () => {
        try {
            const { data } = await api.get('/master/maintenance-types');
            if (data.success) setMaintenanceTypes(data.data);
        } catch (error) {
            console.error('Error fetching maintenance types:', error);
        }
    };

    const fetchSparePartsInventory = async () => {
        try {
            const { data } = await api.get('/spare-parts');
            if (data.success) setSparePartsInventory(data.data);
        } catch (error) {
            console.error('Error fetching spares:', error);
        }
    };

    useEffect(() => {
        const daysInMonth = new Date(lookupYear, lookupMonth, 0).getDate();
        if (category === 'Labour Wages' && formData.labourName && (labours.length > 0 || contractors.length > 0)) {
            const fetchLabourSummary = async () => {
                try {
                    const { data } = await api.get('/labour/wages-summary', {
                        params: {
                            month: lookupMonth,
                            year: lookupYear,
                            workingDays: formData.totalWorkingDays
                        }
                    });

                    if (data.success) {
                        // Check if already paid in local expenses list
                        const isAlreadyPaid = expenses.find(e => 
                            e.category === 'Labour Wages' && 
                            e.labourId === formData.labourId && 
                            e.salaryMonth === lookupMonth && 
                            e.salaryYear === lookupYear
                        );

                        if (isAlreadyPaid) {
                            showToast(`Wages for ${formData.labourName} have already been finalized for ${lookupMonth}/${lookupYear}! See record on ${new Date(isAlreadyPaid.date).toLocaleDateString()}.`, 'error');
                            setFormData(prev => ({ ...prev, labourName: '', labourId: '', quantity: '0', amount: '0', netPay: '0', otAmount: '0', perDaySalary: '0' }));
                            setSelectedContractorSummary(null);
                            return;
                        }

                        let summary;
                        if (formData.labourType === 'Vendor') {
                            summary = data.data.find((s: any) => s.isVendorGroup && s.contractorId === formData.labourId);
                            setSelectedContractorSummary(summary);
                        } else {
                            summary = data.data.find((s: any) => !s.isVendorGroup && s.name === formData.labourName);
                            setSelectedContractorSummary(null);
                        }

                        if (summary) {
                            if (summary.isFinalized) {
                                showToast(`Wages for ${formData.labourName} have already been finalized for ${lookupMonth}/${lookupYear}! Edit the existing record in the table below if needed.`, 'error');
                                setFormData(prev => ({ ...prev, labourName: '', labourId: '', quantity: '0', amount: '0', netPay: '0', otAmount: '0', perDaySalary: '0' }));
                                setSelectedContractorSummary(null);
                                return;
                            }

                            if (summary.attendance.total === 0 && (summary.attendance.totalDaysAll > 0 || summary.totalDaysAll > 0)) {
                                showToast(`${formData.labourType === 'Vendor' ? 'Wages for Contractor' : 'Salary for'} ${formData.labourName} is already fully paid for this month!`, 'error');
                                setFormData(prev => ({ ...prev, labourName: '', labourId: '', quantity: '0', amount: '0', netPay: '0', otAmount: '0', perDaySalary: '0' }));
                                setSelectedContractorSummary(null);
                                return;
                            } else if (summary.attendance.total === 0 && summary.attendance.totalDaysAll === 0) {
                                showToast(`No attendance records found for ${formData.labourName} in this month.`, 'warning');
                                setFormData(prev => ({ ...prev, quantity: '0', amount: '0', netPay: '0', otAmount: '0', perDaySalary: '0' }));
                                setSelectedContractorSummary(null);
                                return;
                            }

                            if (formData.labourType === 'Vendor') {
                                setFormData(prev => ({
                                    ...prev,
                                    quantity: summary.attendance.total.toString(),
                                    perDaySalary: '',
                                    rate: '', // No fixed single rate, it's aggregated
                                    amount: summary.netPayable.toString(),
                                    advanceDeduction: summary.totalAdvance.toString(),
                                    netPay: summary.netPayable.toString(),
                                    otAmount: (summary.otAmount || 0).toString()
                                }));
                            } else {
                                setFormData(prev => ({
                                    ...prev,
                                    labourId: summary.labourId,
                                    quantity: summary.attendance.total.toString(),
                                    perDaySalary: summary.dailyRate.toString(),
                                    rate: summary.dailyWage.toString(),
                                    amount: summary.netPayable.toString(),
                                    advanceDeduction: summary.totalAdvance.toString(),
                                    netPay: summary.netPayable.toString(),
                                    otAmount: (summary.otAmount || 0).toString(),
                                    totalWorkingDays: daysInMonth.toString()
                                }));
                            }
                        }
                    } else {
                        setSelectedContractorSummary(null);
                    }
                } catch (error) {
                    console.error('Error fetching labour summary:', error);
                    setSelectedContractorSummary(null);
                }
            };
            fetchLabourSummary();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.labourName, lookupMonth, lookupYear, category, labours, contractors, formData.labourType]);

    useEffect(() => {
        fetchExpenses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, listMonth, listYear]);

    useEffect(() => {
        fetchVehicles();
        fetchLabours();
        fetchContractors();
        fetchExpenseCategories();
        fetchWorkTypes();
        fetchMaintenanceTypes();
        fetchSparePartsInventory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    const uniqueVehicleTypes = Array.from(new Set(vehicles
        .filter(v => {
            if (category === 'Machine Maintenance') {
                // Allow both Own and Contract for maintenance
                // const isOwn = v.ownershipType === 'Own' || !v.ownershipType;
                // if (!isOwn) return false;
            }

            if (formData.assetType) return v.type === formData.assetType;
            if (category === 'Transport Charges') return v.type === 'Vehicle';
            return true;
        })
        .map((v) => v.category || v.name)
    ));

    const filteredVehicles = vehicles.filter((v) => {
        const matchesType = (v.category || v.name) === formData.vehicleType;
        const matchesAssetType = formData.assetType ? v.type === formData.assetType : true;

        if (category === 'Machine Maintenance') {
            return matchesType && matchesAssetType;
        }

        return matchesType && matchesAssetType;
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === 'assetType') {
                updated.vehicleType = '';
                updated.vehicleNumber = '';
                updated.vehicleOrMachine = '';
                updated.driverName = '';
            }

            // If vehicleType (Category/Name) changes, reset vehicleNumber
            if (name === 'vehicleType') {
                updated.vehicleNumber = '';
                updated.vehicleOrMachine = value; // Default to type name if no number selected yet
                updated.driverName = '';

                // For machines, we might just have one entry or use the name directly
                if (category === 'Machine Maintenance' && prev.assetType === 'Machine') {
                    const machine = vehicles.find(v => v.type === 'Machine' && (v.category === value || v.name === value));
                    if (machine) {
                        updated.vehicleNumber = machine.vehicleNumber || machine.registrationNumber || '';
                        updated.vehicleOrMachine = value + (updated.vehicleNumber ? ` (${updated.vehicleNumber})` : '');
                    }
                }

                // Auto-select if ONLY ONE matching vehicle in master
                const matches = vehicles.filter((v) => (v.category || v.name) === value && (prev.assetType ? v.type === prev.assetType : true));
                if (matches.length === 1) {
                    const onlyMatch = matches[0];
                    const num = onlyMatch.vehicleNumber || onlyMatch.registrationNumber || '';
                    updated.vehicleNumber = num;
                    updated.driverName = onlyMatch.driverName || onlyMatch.operatorName || '';
                    updated.vehicleOrMachine = value + (num ? ` (${num})` : '');
                }
            }

            // If vehicleNumber changes, update full vehicleOrMachine string and fetch driver
            if (name === 'vehicleNumber') {
                const selected = vehicles.find(v => (v.vehicleNumber === value || v.registrationNumber === value) && (prev.assetType ? v.type === prev.assetType : true));
                if (selected) {
                    updated.driverName = selected.driverName || selected.operatorName || '';
                    updated.vendorName = selected.contractor?.companyName || selected.contractor?.name || selected.ownerName || '';
                }
                updated.vehicleOrMachine = (updated.vehicleType || prev.vehicleType) + (value ? ` (${value})` : '');
            }

            // Categories that need Qty x Rate calculation
            const calculationCategories = ['Diesel', 'Explosive Cost', 'Transport Charges'];
            if (calculationCategories.includes(category) && (name === 'quantity' || name === 'rate')) {
                const qty = parseFloat(name === 'quantity' ? value : prev.quantity) || 0;
                const rate = parseFloat(name === 'rate' ? value : prev.rate) || 0;
                updated.amount = (qty * rate).toString();
            }

            // Calculation for Machine Maintenance
            if (category === 'Machine Maintenance' && (name === 'sparePartsCost' || name === 'labourCharge' || name === 'sparePartSource')) {
                const isOwn = (name === 'sparePartSource' ? value : prev.sparePartSource) === 'Own';
                const parts = isOwn ? 0 : (parseFloat(name === 'sparePartsCost' ? value : prev.sparePartsCost) || 0);
                const labour = parseFloat(name === 'labourCharge' ? value : prev.labourCharge) || 0;
                updated.amount = (parts + labour).toString();
                if (isOwn && name === 'sparePartSource') {
                    updated.sparePartsCost = '0';
                    updated.sparePartName = '';
                }
            }

            // Calculation for Labour Wages
            if (category === 'Labour Wages') {
                if (name === 'workType' || name === 'labourType') {
                    // Reset name when work type or labour type changes to avoid mismatch
                    updated.labourId = '';
                    updated.labourName = '';
                    updated.wageType = '';
                    updated.rate = '';
                    updated.quantity = '';
                    updated.amount = '';
                    updated.netPay = '';
                    updated.perDaySalary = '';
                    updated.advanceDeduction = '';
                    updated.otAmount = '';

                    setSelectedContractorSummary(null); // Reset summary on type change
                }

                if (name === 'labourName') {
                    // Note: In Labour Wages, name='labourName' is triggered by the select. 
                    // We'll pass the ID in value for better reliability.
                    if (updated.labourType === 'Vendor') {
                        const contractor = contractors.find((c: any) => c._id === value);
                        if (contractor) {
                            updated.labourId = contractor._id;
                            updated.labourName = contractor.name || contractor.companyName;
                            updated.workType = ''; // Represents "All Work Types"
                            updated.wageType = 'Contract Payment';
                            updated.rate = '';
                        }
                    } else {
                        const worker = labours.find((l: any) => l._id === value);
                        if (worker) {
                            updated.labourId = worker._id;
                            updated.labourName = worker.name;
                            updated.workType = worker.workType || '';
                            updated.wageType = worker.wageType === 'Daily' ? 'Daily Wage' : (worker.wageType === 'Monthly' ? 'Monthly Salary' : '');
                            updated.rate = (worker.wage || '').toString();
                        }
                    }
                }

                // Exact Days in the selected Attendance Month
                const daysInMonth = new Date(lookupYear, lookupMonth, 0).getDate();
                const qtyVal = name === 'quantity' ? value : updated.quantity;
                const rateVal = name === 'rate' ? value : updated.rate;
                const workingDaysVal = name === 'totalWorkingDays' ? value : updated.totalWorkingDays;
                const advanceVal = name === 'advanceDeduction' ? value : updated.advanceDeduction;
                const otVal = name === 'otAmount' ? value : updated.otAmount;

                const qty = parseFloat(qtyVal) || 0;
                const rate = parseFloat(rateVal) || 0;
                const workingDays = parseFloat(workingDaysVal) || daysInMonth || 30;
                const advance = parseFloat(advanceVal) || 0;
                const ot = parseFloat(otVal) || 0;

                let total = 0;
                if (updated.wageType === 'Monthly Salary') {
                    // Use totalWorkingDays as denominator if provided
                    const daily = rate / workingDays;
                    updated.perDaySalary = daily.toFixed(2);
                    total = qty * daily;
                } else if (updated.wageType === 'Contract Payment') {
                    updated.perDaySalary = '';
                    // For contractor, amount is often pre-fetched from summary
                    const currentAmount = parseFloat(name === 'amount' ? value : updated.amount) || 0;
                    total = currentAmount - ot;
                    if (total < 0) total = 0;
                } else {
                    updated.perDaySalary = rate.toString();
                    total = qty * rate;
                }

                updated.amount = (total + ot - advance).toFixed(2);
                updated.netPay = (total + ot - advance).toFixed(2);
            }
            return updated;
        });
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
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const convertedFile = new File([blob], file.name.replace(/\.jfif$/i, '.jpg'), { type: 'image/jpeg' });
                                resolve(convertedFile);
                            } else {
                                reject(new Error('Canvas toBlob failed'));
                            }
                        },
                        'image/jpeg',
                        0.9
                    );
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bill' | 'input' | 'output' = 'bill') => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];
            const typeKey = type === 'bill' ? 'main' : (type === 'input' ? 'input' : 'output');
            
            setUploading(prev => ({ ...prev, [typeKey]: true }));
            
            try {
                if (file.name.toLowerCase().endsWith('.jfif')) {
                    showToast('Converting JFIF to JPG...', 'info');
                    file = await convertJfifToJpg(file);
                }
                
                // Perform Instant Upload like Blasting Advance
                const uploadedUrl = await uploadSpecificFile(file);
                if (uploadedUrl) {
                    if (type === 'bill') {
                        setFormData(prev => ({ ...prev, billUrl: uploadedUrl }));
                        setSelectedFile(file);
                    } else if (type === 'input') {
                        setFormData(prev => ({ ...prev, inputBillUrl: uploadedUrl }));
                        setSelectedInputFile(file);
                    } else if (type === 'output') {
                        setFormData(prev => ({ ...prev, outputBillUrl: uploadedUrl }));
                        setSelectedOutputFile(file);
                    }
                    showToast('File uploaded successfully!', 'success');
                } else {
                    showToast('Upload failed. Please try again.', 'error');
                }
            } catch (err) {
                console.error('File processing/upload failed:', err);
                showToast('Error uploading file', 'error');
            } finally {
                setUploading(prev => ({ ...prev, [typeKey]: false }));
            }
        }
    };

    const uploadSpecificFile = async (file: File) => {
        const uploadData = new FormData();
        uploadData.append('bill', file);
        try {
            const { data } = await api.post('/upload', uploadData);
            return data.filePath;
        } catch (error) {
            console.error('File upload failed:', error);
            return null;
        }
    };

    const handleAdd = async (e: any) => {
        e.preventDefault();
        // Files are already uploaded via handleFileChange
        
        // Clean up empty ObjectIDs to prevent backend crash
        const payload = {
            ...formData,
            salaryMonth: category === 'Labour Wages' ? lookupMonth : '',
            salaryYear: category === 'Labour Wages' ? lookupYear : ''
        };
        const oidToClean = ['labourId', 'internalSpareId', 'transportVendorId', 'sourceId'];
        oidToClean.forEach(key => {
            if (!(payload as any)[key] || (payload as any)[key] === '') {
                delete (payload as any)[key];
            }
        });

        try {
            const { data } = await api.post('/expenses', payload);
            if (data.success) {
                showToast('Record saved successfully!', 'success');
                resetForm();
                fetchExpenses();
                fetchSparePartsInventory();
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.error || 'Error saving record', 'error');
        }
    };

    const handleUpdate = async (e: any) => {
        e.preventDefault();
        // Files are already uploaded via handleFileChange
        
        // Clean up empty ObjectIDs to prevent backend crash
        const payload = {
            ...formData,
            salaryMonth: category === 'Labour Wages' ? lookupMonth : '',
            salaryYear: category === 'Labour Wages' ? lookupYear : ''
        };
        const oidToClean = ['labourId', 'internalSpareId', 'transportVendorId', 'sourceId'];
        oidToClean.forEach(key => {
            if (!(payload as any)[key] || (payload as any)[key] === '') {
                delete (payload as any)[key];
            }
        });

        try {
            const { data } = await api.put(`/expenses/${selectedExpense._id}`, payload);
            if (data.success) {
                showToast('Record updated successfully!', 'success');
                resetForm();
                fetchExpenses();
                fetchSparePartsInventory();
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.error || 'Error updating record', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            const { data } = await api.delete(`/expenses/${selectedExpense._id}`);
            if (data.success) {
                showToast('Record deleted successfully!', 'success');
                setDeleteModal(false);
                fetchExpenses();
                fetchSparePartsInventory();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({
            category: category,
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            assetType: '',
            vehicleOrMachine: '',
            vehicleType: '',
            vehicleNumber: '',
            quantity: '',
            rate: '',
            paymentMode: 'Cash',
            meterReading: '',
            billUrl: '',
            inputBillUrl: '',
            outputBillUrl: '',
            maintenanceType: '',
            sparePartsCost: '',
            labourCharge: '',
            vendorName: '',
            labourId: '',
            labourName: '',
            workType: '',
            wageType: '',
            perDaySalary: '',
            advanceDeduction: '',
            netPay: '',
            siteAssigned: '',
            labourType: '',
            otAmount: '',
            salaryMonth: '',
            salaryYear: '',
            totalWorkingDays: '',
            site: '',
            explosiveType: '',
            unit: 'Nos',
            supplierName: '',
            licenseNumber: '',
            supervisorName: '',
            transportType: '',
            fromLocation: '',
            toLocation: '',
            driverName: '',
            loadDetails: '',
            officeExpenseType: '',
            paidTo: '',
            billNumber: '',
            nextServiceDate: '',
            sparePartSource: 'Bought',
            sparePartName: '',
            workshopName: '',
            internalSpareId: '',
        });
        setLookupMonth(listMonth);
        setLookupYear(listYear);
        setSelectedFile(null);
        setSelectedInputFile(null);
        setSelectedOutputFile(null);
        setFormView(false);
        setEditMode(false);
        setSelectedContractorSummary(null); // Reset contractor summary
    };

    const openEditModal = (expense: any) => {
        setSelectedExpense(expense);

        // Try to parse vehicleType and vehicleNumber from vehicleOrMachine string if possible
        // Expecting "Name (Number)" or just "Name"
        // Always prefer the directly stored fields first
        let vType = expense.vehicleType || expense.vehicleOrMachine || '';
        let vNum = expense.vehicleNumber || '';
        if (!vNum && vType.includes('(')) {
            const parts = vType.split(' (');
            vType = parts[0];
            vNum = parts[1].replace(')', '');
        } else if (!expense.vehicleType && !vType.includes('(')) {
            // vType already set correctly from vehicleOrMachine
        }

        if (expense.category === 'Labour Wages') {
            const d = new Date(expense.date);
            setLookupMonth(d.getMonth() + 1);
            setLookupYear(d.getFullYear());
        }

        // Restore assetType: always prefer the saved value, fall back to vehicle lookup
        let aType = expense.assetType || '';
        if (!aType && expense.category === 'Machine Maintenance') {
            const asset = vehicles.find(v => (v.vehicleNumber === vNum || v.registrationNumber === vNum));
            aType = asset ? asset.type : '';
        }

        setFormData({
            category: expense.category,
            amount: expense.amount.toString(),
            date: expense.date.split('T')[0],
            description: expense.description || '',
            assetType: aType,
            vehicleOrMachine: expense.vehicleOrMachine || '',
            vehicleType: vType,
            vehicleNumber: vNum,
            quantity: expense.quantity?.toString() || '',
            rate: expense.rate?.toString() || '',
            paymentMode: expense.paymentMode || 'Cash',
            meterReading: expense.meterReading || '',
            billUrl: expense.billUrl || '',
            inputBillUrl: expense.inputBillUrl || '',
            outputBillUrl: expense.outputBillUrl || '',
            maintenanceType: expense.maintenanceType || '',
            sparePartsCost: expense.sparePartsCost?.toString() || '',
            labourCharge: expense.labourCharge?.toString() || '',
            vendorName: expense.vendorName || '',
            labourId: expense.labourId || '',
            labourName: expense.labourName || '',
            workType: expense.workType || '',
            wageType: expense.wageType || '',
            perDaySalary: expense.perDaySalary || '',
            advanceDeduction: expense.advanceDeduction?.toString() || '',
            netPay: expense.netPay?.toString() || '',
            siteAssigned: expense.siteAssigned || '',
            labourType: expense.labourType || '',
            otAmount: expense.otAmount?.toString() || '',
            salaryMonth: expense.salaryMonth?.toString() || '',
            salaryYear: expense.salaryYear?.toString() || '',
            site: expense.site || '',
            explosiveType: expense.explosiveType || '',
            unit: expense.unit || 'Nos',
            supplierName: expense.supplierName || '',
            licenseNumber: expense.licenseNumber || '',
            supervisorName: expense.supervisorName || '',
            transportType: expense.transportType || '',
            fromLocation: expense.fromLocation || '',
            toLocation: expense.toLocation || '',
            driverName: expense.driverName || '',
            loadDetails: expense.loadDetails || '',
            officeExpenseType: expense.officeExpenseType || '',
            paidTo: expense.paidTo || '',
            billNumber: expense.billNumber || '',
            totalWorkingDays: expense.totalWorkingDays?.toString() || '',
            nextServiceDate: expense.nextServiceDate ? expense.nextServiceDate.split('T')[0] : '',
            sparePartSource: expense.sparePartSource || 'Bought',
            sparePartName: expense.sparePartName || '',
            workshopName: expense.workshopName || '',
            internalSpareId: expense.internalSpareId || '',
        });
        setSelectedFile(null);
        setSelectedInputFile(null);
        setSelectedOutputFile(null);
        setEditMode(true);
        setFormView(true);
    };

    const openDeleteModal = (expense: any) => {
        setSelectedExpense(expense);
        setDeleteModal(true);
    };

    return (
        <div className="panel mt-6">
            {!formView ? (
                <>
                    <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h5 className="text-lg font-semibold dark:text-white-light">{title}</h5>
                            {category === 'Labour Wages' && (
                                <div className="flex flex-col gap-1 bg-primary/5 p-1.5 px-3 rounded-xl border border-primary/20">
                                    <span className="text-[9px] uppercase font-black text-primary/60 tracking-tighter">Filter by Work Month (வேலை மாதம்):</span>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="form-select text-xs font-bold border-none bg-transparent focus:ring-0 cursor-pointer p-0 h-auto"
                                            value={listMonth}
                                            onChange={(e) => setListMonth(parseInt(e.target.value))}
                                        >
                                            {[
                                                { id: 1, label: 'Jan' }, { id: 2, label: 'Feb' }, { id: 3, label: 'Mar' },
                                                { id: 4, label: 'Apr' }, { id: 5, label: 'May' }, { id: 6, label: 'Jun' },
                                                { id: 7, label: 'Jul' }, { id: 8, label: 'Aug' }, { id: 9, label: 'Sep' },
                                                { id: 10, label: 'Oct' }, { id: 11, label: 'Nov' }, { id: 12, label: 'Dec' }
                                            ].map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                        </select>
                                        <div className="w-[1px] h-3 bg-primary/20"></div>
                                        <select
                                            className="form-select text-xs font-bold border-none bg-transparent focus:ring-0 cursor-pointer p-0 h-auto"
                                            value={listYear}
                                            onChange={(e) => setListYear(parseInt(e.target.value))}
                                        >
                                            {Array.from({ length: 2035 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button type="button" className="btn btn-primary gap-2" onClick={() => { resetForm(); setFormView(true); setEditMode(false); }}>
                            <IconPlus /> Add Record
                        </button>
                    </div>

                    {category === 'Diesel' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end bg-primary/5 p-4 rounded-xl mb-5">
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Asset Type</label>
                                <select className="form-select h-10" value={filterAssetType} onChange={(e) => { setFilterAssetType(e.target.value); setFilterVehicleType(''); setFilterVehicle(''); }}>
                                    <option value="">All Types</option>
                                    <option value="Machine">Machine (இயந்திரம்)</option>
                                    <option value="Vehicle">Vehicle (வாகனம்)</option>
                                    <option value="Blasting">Blasting (பிளாஸ்டிங்)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Category Type</label>
                                <select className="form-select h-10" value={filterVehicleType} onChange={(e) => { setFilterVehicleType(e.target.value); setFilterVehicle(''); }}>
                                    <option value="">All Categories</option>
                                    {Array.from(new Set(
                                        expenses
                                            .filter(exp => {
                                                if (!filterAssetType) return true;
                                                if (exp.assetType === filterAssetType) return true;

                                                const vNum = exp.vehicleNumber || exp.vehicleOrMachine;
                                                const vType = exp.vehicleType;

                                                const match = vehicles.find(v =>
                                                    (v.vehicleNumber && vNum?.includes(v.vehicleNumber)) ||
                                                    (v.registrationNumber && vNum?.includes(v.registrationNumber)) ||
                                                    (v.category === vType || v.name === vType)
                                                );

                                                return match ? match.type === filterAssetType : false;
                                            })
                                            .map(exp => {
                                                if (exp.vehicleType) return exp.vehicleType;
                                                const vNum = exp.vehicleNumber || exp.vehicleOrMachine;
                                                const asset = vehicles.find(v => (v.vehicleNumber && vNum?.includes(v.vehicleNumber)) || (v.registrationNumber && vNum?.includes(v.registrationNumber)));
                                                return asset ? (asset.category || asset.name) : (exp.vehicleOrMachine?.split(' (')[0]);
                                            })
                                    )).filter(Boolean).map(t => (
                                        <option key={t as string} value={t as string}>{t as string}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Specific Number / ID</label>
                                <select className="form-select h-10" value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                                    <option value="">All Numbers</option>
                                    {Array.from(new Set(
                                        expenses
                                            .filter(exp => {
                                                const vNum = exp.vehicleNumber || exp.vehicleOrMachine;
                                                const vType = exp.vehicleType || exp.vehicleOrMachine?.split(' (')[0];

                                                const asset = vehicles.find(v =>
                                                    (v.vehicleNumber && vNum?.includes(v.vehicleNumber)) ||
                                                    (v.registrationNumber && vNum?.includes(v.registrationNumber)) ||
                                                    (v.category === vType || v.name === vType)
                                                );
                                                const actualAssetType = exp.assetType || (asset ? asset.type : '');

                                                const matchesAssetType = !filterAssetType || actualAssetType === filterAssetType;

                                                const currentExpType = exp.vehicleType || exp.vehicleOrMachine?.split(' (')[0];
                                                const matchesVehicleType = !filterVehicleType || currentExpType === filterVehicleType;
                                                return matchesAssetType && matchesVehicleType;
                                            })
                                            .map(exp => exp.vehicleNumber || exp.vehicleOrMachine?.match(/\((.*?)\)/)?.[1] || exp.vehicleOrMachine)
                                    )).filter(Boolean).map(v => (
                                        <option key={v as string} value={v as string}>{v as string}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">From Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">To Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                            <div className="flex items-center">
                                <button
                                    type="button"
                                    className="btn btn-outline-danger w-full h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-danger hover:text-white transition-all transform active:scale-95"
                                    onClick={() => {
                                        setFilterAssetType('');
                                        setFilterVehicleType('');
                                        setFilterVehicle('');
                                        setFilterStartDate('');
                                        setFilterEndDate('');
                                        setSearchTerm('');
                                    }}
                                >
                                    <IconTrashLines className="w-4 h-4" />
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Filter Panel (Specifically for Explosive Cost) */}
                    {category === 'Explosive Cost' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-primary/5 p-4 rounded-xl mb-5">
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">General Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by supplier or site..."
                                        className="form-input ltr:pr-10 rtl:pl-10 h-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Site Location</label>
                                <select className="form-select h-10" value={filterSite} onChange={(e) => setFilterSite(e.target.value)}>
                                    <option value="">All Sites</option>
                                    {Array.from(new Set(expenses.map(exp => exp.site))).filter(Boolean).map(site => (
                                        <option key={site} value={site}>{site}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Supplier</label>
                                <select className="form-select h-10" value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
                                    <option value="">All Suppliers</option>
                                    {Array.from(new Set(expenses.map(exp => exp.supplierName))).filter(Boolean).map(supplier => (
                                        <option key={supplier} value={supplier}>{supplier}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">From Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">To Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}
                    {/* Filter Panel (Specifically for Machine Maintenance) */}
                    {category === 'Machine Maintenance' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end bg-primary/5 p-4 rounded-xl mb-5">
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">General Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="form-input ltr:pr-10 rtl:pl-10 h-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Vehicle/Machine</label>
                                <select className="form-select h-10" value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                                    <option value="">All Assets</option>
                                    {Array.from(new Set(expenses.map(exp => exp.vehicleNumber || exp.vehicleOrMachine))).filter(Boolean).map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Maintenance Type</label>
                                <select className="form-select h-10" value={filterMaintenanceType} onChange={(e) => setFilterMaintenanceType(e.target.value)}>
                                    <option value="">All Types</option>
                                    {maintenanceTypes.map((type: any) => (
                                        <option key={type._id} value={type.name}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Vendor</label>
                                <select className="form-select h-10" value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}>
                                    <option value="">All Vendors</option>
                                    {Array.from(new Set(expenses.map(exp => exp.vendorName))).filter(Boolean).map(vendor => (
                                        <option key={vendor} value={vendor}>{vendor}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">From Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">To Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                            <div className="lg:col-span-6 flex justify-end">
                                <button
                                    className="btn btn-outline-danger btn-sm flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] py-2 px-4 rounded-xl hover:bg-danger hover:text-white transition-all w-full sm:w-auto"
                                    onClick={() => {
                                        setFilterVehicle('');
                                        setFilterMaintenanceType('');
                                        setFilterVendor('');
                                        setFilterStartDate('');
                                        setFilterEndDate('');
                                        setSearchTerm('');
                                    }}
                                >
                                    <IconTrashLines className="w-4 h-4" />
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Filter Panel (Specifically for Transport Charges) */}
                    {category === 'Transport Charges' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end bg-primary/5 p-4 rounded-xl mb-5">
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">General Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search vehicle or location..."
                                        className="form-input ltr:pr-10 rtl:pl-10 h-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Transport Type</label>
                                <select className="form-select h-10" value={filterTransportType} onChange={(e) => setFilterTransportType(e.target.value)}>
                                    <option value="">All Types</option>
                                    {Array.from(new Set(expenses.map(exp => exp.transportType))).filter(Boolean).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Vehicle</label>
                                <select className="form-select h-10" value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                                    <option value="">All Vehicles</option>
                                    {Array.from(new Set(expenses.map(exp => exp.vehicleOrMachine))).filter(Boolean).map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Owner/Vendor</label>
                                <select className="form-select h-10" value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}>
                                    <option value="">All Vendors</option>
                                    {Array.from(new Set(expenses.map(exp => exp.vendorName))).filter(Boolean).map(vendor => (
                                        <option key={vendor} value={vendor}>{vendor}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">From Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">To Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}
                    {/* Filter Panel (Specifically for Labour Wages) */}
                    {category === 'Labour Wages' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end bg-primary/5 p-4 rounded-xl mb-5">
                            <div className="lg:col-span-1">
                                <label className="text-[10px] font-bold uppercase mb-1 block">General Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="form-input ltr:pr-10 rtl:pl-10 h-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Labour Name</label>
                                <select className="form-select h-10" value={filterLabour} onChange={(e) => setFilterLabour(e.target.value)}>
                                    <option value="">All Labours</option>
                                    {Array.from(new Set(expenses.map(exp => exp.labourName))).filter(Boolean).map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Work Type</label>
                                <select className="form-select h-10" value={filterWorkType} onChange={(e) => setFilterWorkType(e.target.value)}>
                                    <option value="">All Types</option>
                                    {Array.from(new Set(expenses.map(exp => exp.workType))).filter(Boolean).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Wage Type</label>
                                <select className="form-select h-10" value={filterWageType} onChange={(e) => setFilterWageType(e.target.value)}>
                                    <option value="">All Wages</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">From Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">To Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}
                    {/* Filter Panel (Specifically for Office & Misc) */}
                    {category === 'Office & Misc' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-primary/5 p-4 rounded-xl mb-5">
                            <div className="lg:col-span-1">
                                <label className="text-[10px] font-bold uppercase mb-1 block">General Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="form-input ltr:pr-10 rtl:pl-10 h-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Expense Type</label>
                                <select className="form-select h-10 font-bold" value={filterOfficeCategory} onChange={(e) => setFilterOfficeCategory(e.target.value)}>
                                    <option value="">All Categories</option>
                                    {expenseCategories.length > 0 ? (
                                        expenseCategories.map((c: any) => <option key={c._id} value={c.name}>{c.name}</option>)
                                    ) : (
                                        ['Stationery', 'Electricity (EB Bill)', 'Water Bill', 'Internet / Phone Bill', 'Tea / Snacks / Food', 'Cleaning / Housekeeping', 'Courier / Post', 'Printing / Photocopy', 'Office Maintenance', 'Rent / Lease', 'Staff Salary', 'Professional Fees', 'Taxes / Licenses', 'Furniture / Equipment', 'Miscellaneous'].map(c => <option key={c} value={c}>{c}</option>)
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">From Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">To Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <div className="table-responsive min-h-[400px]">
                        <table>
                            <thead>
                                <tr>
                                    <th className="font-black uppercase tracking-widest text-[10px] py-4">Date</th>
                                    {category === 'Diesel' ? (
                                        <>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Asset Type</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Category</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Vehicle No</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Litres</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Rate</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Meter</th>
                                        </>
                                    ) : category === 'Explosive Cost' ? (
                                        <>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Site</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Material</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Qty/Rate</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Supplier</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Supervisor</th>
                                        </>
                                    ) : category === 'Transport Charges' ? (
                                        <>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Type</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">To Location</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Vehicle</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Load</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Trips / Rate</th>
                                        </>
                                    ) : category === 'Machine Maintenance' ? (
                                        <>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Machine</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Workshop / Bill</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Type</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Parts</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Labour</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Hours</th>
                                        </>
                                    ) : category === 'Labour Wages' ? (
                                        <>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Labour</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Work Type</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Wage Type</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Days / OT Hrs</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4 text-success">Net Payable</th>
                                        </>
                                    ) : category === 'Office & Misc' ? (
                                        <>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Expense Type</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Paid To</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Bill No</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Description</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Vehicle/Machine</th>
                                            <th className="font-black uppercase tracking-widest text-[10px] py-4">Description</th>
                                        </>
                                    )}
                                    <th className="font-black uppercase tracking-widest text-[10px] py-4">Amount</th>
                                    <th className="text-center font-black uppercase tracking-widest text-[10px] py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold">
                                {(() => {
                                    const filtered = expenses.filter(exp => {
                                        if (category !== 'Diesel' && category !== 'Machine Maintenance' && category !== 'Labour Wages' && category !== 'Office & Misc') return true;

                                        const vNum = exp.vehicleNumber || exp.vehicleOrMachine || '';
                                        const desc = exp.description || '';
                                        const vendor = exp.vendorName || '';
                                        const mType = exp.maintenanceType || '';
                                        const lName = exp.labourName || '';
                                        const wType = exp.workType || '';
                                        const wageType = exp.wageType || '';
                                        const paidTo = exp.paidTo || '';
                                        const billNo = exp.billNumber || '';
                                        const officeType = exp.officeExpenseType || '';

                                        const matchesSearch = !searchTerm ||
                                            vNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            mType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            lName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            officeType.toLowerCase().includes(searchTerm.toLowerCase());

                                        const matchesVehicle = !filterVehicle || vNum.toLowerCase().includes(filterVehicle.toLowerCase());
                                        const matchesVendor = !filterVendor || vendor === filterVendor;
                                        const matchesLabour = !filterLabour || lName === filterLabour;
                                        const matchesWorkType = !filterWorkType || wType === filterWorkType;
                                        const matchesWageType = !filterWageType || wageType === filterWageType;
                                        const matchesOfficeCategory = !filterOfficeCategory || officeType === filterOfficeCategory;

                                        // Try to find asset type if not directly in exp
                                        const derivedType = exp.vehicleType || exp.vehicleOrMachine?.split(' (')[0];
                                        const asset = vehicles.find(v =>
                                            (v.vehicleNumber && vNum?.includes(v.vehicleNumber)) ||
                                            (v.registrationNumber && vNum?.includes(v.registrationNumber)) ||
                                            (v.category === derivedType || v.name === derivedType)
                                        );
                                        const actualAssetType = exp.assetType || (asset ? asset.type : '');
                                        const matchesAssetType = !filterAssetType || actualAssetType === filterAssetType;

                                        const currentExpType = exp.vehicleType || exp.vehicleOrMachine?.split(' (')[0];
                                        const matchesVehicleType = !filterVehicleType || currentExpType === filterVehicleType;
                                        const matchesMaintenanceType = !filterMaintenanceType || exp.maintenanceType === filterMaintenanceType;
                                        const matchesSupplier = !filterSupplier || exp.supplierName === filterSupplier;
                                        const matchesSite = !filterSite || exp.site === filterSite;
                                        const matchesTransportType = !filterTransportType || exp.transportType === filterTransportType;

                                        const expDate = exp.date ? exp.date.split('T')[0] : '';
                                        const matchesStart = !filterStartDate || expDate >= filterStartDate;
                                        const matchesEnd = !filterEndDate || expDate <= filterEndDate;

                                        return matchesSearch && matchesVehicle && matchesAssetType && matchesVehicleType && matchesMaintenanceType && matchesVendor &&
                                            matchesSupplier && matchesSite && matchesTransportType &&
                                            matchesLabour && matchesWorkType && matchesWageType && matchesOfficeCategory &&
                                            matchesStart && matchesEnd;
                                    });

                                    if (loading) {
                                        return <tr><td colSpan={10} className="text-center">Loading...</td></tr>;
                                    }
                                    if (filtered.length === 0) {
                                        return <tr><td colSpan={10} className="text-center">No records found matching your filters.</td></tr>;
                                    }

                                    return filtered.map((expense: any) => {
                                        const vNum = expense.vehicleNumber || expense.vehicleOrMachine || '';
                                        const derivedType = expense.vehicleType || expense.vehicleOrMachine?.split(' (')[0];
                                        const asset = vehicles.find(v =>
                                            (v.vehicleNumber && vNum?.includes(v.vehicleNumber)) ||
                                            (v.registrationNumber && vNum?.includes(v.registrationNumber)) ||
                                            (v.category === derivedType || v.name === derivedType)
                                        );
                                        const actualAssetType = expense.assetType || (asset ? asset.type : '');
                                        const currentExpType = expense.vehicleType || expense.vehicleOrMachine?.split(' (')[0];

                                        return (
                                            <tr key={expense._id} className="group hover:bg-primary/5 transition-all">
                                                <td className="py-2">{new Date(expense.date).toLocaleDateString()}</td>
                                                {category === 'Diesel' ? (
                                                    <>
                                                        <td className="py-2 text-center text-[10px]">
                                                            <span className={`badge ${actualAssetType === 'Machine' ? 'badge-outline-warning' : 'badge-outline-primary'} py-0.5 px-2`}>
                                                                {actualAssetType || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-xs font-black uppercase text-secondary">{currentExpType || '-'}</td>
                                                        <td className="py-2 font-black text-primary">
                                                            {expense.vehicleNumber || expense.vehicleOrMachine?.match(/\((.*?)\)/)?.[1] || expense.vehicleOrMachine?.split(' (')[1]?.replace(')', '') || expense.vehicleOrMachine || '-'}
                                                        </td>
                                                        <td className="py-2">{expense.quantity || '-'}</td>
                                                        <td className="py-2 font-black">₹{expense.rate || '-'}</td>
                                                        <td className="py-2 text-center">{expense.meterReading || '-'}</td>
                                                    </>
                                                ) : category === 'Explosive Cost' ? (
                                                    <>
                                                        <td className="py-2">{expense.site || '-'}</td>
                                                        <td className="py-2"><span className="badge badge-outline-warning">{expense.explosiveType || '-'}</span></td>
                                                        <td className="py-2">{expense.quantity} {expense.unit} @ ₹{expense.rate}</td>
                                                        <td className="py-2">
                                                            <div className="font-semibold">{expense.supplierName || '-'}</div>
                                                            {expense.licenseNumber && <div className="text-[10px] text-white-dark">Lic: {expense.licenseNumber}</div>}
                                                        </td>
                                                        <td className="py-2">{expense.supervisorName || '-'}</td>
                                                    </>
                                                ) : category === 'Transport Charges' ? (
                                                    <>
                                                        <td className="py-2"><span className="badge badge-outline-secondary">{expense.transportType || '-'}</span></td>
                                                        <td className="text-xs py-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-primary font-medium">{expense.fromLocation || '-'}</span>
                                                                <span className="text-white-dark">to {expense.toLocation || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2">{expense.vehicleOrMachine || '-'}</td>
                                                        <td className="text-xs italic">{expense.loadDetails || '-'}</td>
                                                        <td className="py-2">{expense.quantity || '1'} {category === 'Transport Charges' ? 'Trips' : ''} @ ₹{expense.rate || '0'}</td>
                                                    </>
                                                ) : category === 'Machine Maintenance' ? (
                                                    <>
                                                        <td className="py-2">
                                                            <div className="font-bold">{expense.vehicleOrMachine || '-'}</div>
                                                        </td>
                                                         <td className="py-2 text-xs">
                                                            <div className="font-medium text-primary">{expense.workshopName || expense.vendorName || '-'}</div>
                                                            {expense.billNumber && <div className="text-[10px] text-white-dark">Bill: {expense.billNumber}</div>}
                                                        </td>
                                                        <td className="py-2"><span className="badge badge-outline-info">{expense.maintenanceType || '-'}</span></td>
                                                        <td className="py-2">
                                                            <div className="flex flex-col">
                                                                <div className="font-bold">₹{expense.sparePartsCost || '0'}</div>
                                                                {expense.sparePartName && (
                                                                    <div className="text-[9px] uppercase font-black text-white-dark flex items-center gap-1">
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${expense.sparePartSource === 'Own' ? 'bg-success shadow-[0_0_5px_rgba(34,197,94,1)]' : 'bg-info'}`}></span>
                                                                        {expense.sparePartName} {expense.sparePartSource === 'Own' ? '(STOCK)' : ''}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-2">₹{expense.labourCharge || '0'}</td>
                                                        <td className="py-2">{expense.meterReading || '-'} Hrs</td>
                                                    </>
                                                ) : category === 'Labour Wages' ? (
                                                    <>
                                                        <td className="py-2">
                                                            <div className="font-bold flex items-center gap-2">
                                                                {expense.labourName || '-'}
                                                                {expense.salaryMonth && (
                                                                    <span className="badge badge-outline-primary py-0.5 px-2 text-[10px] font-black uppercase ring-1 ring-primary/20">
                                                                        Work: {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][expense.salaryMonth - 1]} {expense.salaryYear}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-2"><span className="badge badge-outline-info">{expense.workType || 'General'}</span></td>
                                                        <td className="py-2">{expense.wageType || '-'}</td>
                                                        <td className="py-2">
                                                            <div className="font-bold">{expense.quantity || '-'} Days</div>
                                                            {expense.otAmount > 0 && <div className="text-[10px] text-info font-black">OT: ₹{expense.otAmount}</div>}
                                                        </td>
                                                        <td className="font-bold text-success py-2">
                                                            <div>₹{expense.netPay?.toLocaleString() || '0'}</div>
                                                            {expense.advanceDeduction > 0 && <div className="text-[10px] text-danger opacity-60">Adv: ₹{expense.advanceDeduction}</div>}
                                                        </td>
                                                    </>
                                                ) : category === 'Office & Misc' ? (
                                                    <>
                                                        <td className="py-2"><span className="badge badge-outline-primary">{expense.officeExpenseType || '-'}</span></td>
                                                        <td className="py-2">{expense.paidTo || '-'}</td>
                                                        <td className="py-2">{expense.billNumber || '-'}</td>
                                                        <td className="text-xs py-2">{expense.description || '-'}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-2">{expense.vehicleOrMachine || '-'}</td>
                                                        <td className="py-2">{expense.description || '-'}</td>
                                                    </>
                                                )}
                                                <td className="font-bold text-primary py-2 text-lg min-w-[120px]">₹{expense.amount.toLocaleString()}</td>
                                                <td className="text-center py-2 flex flex-col items-center gap-1 justify-center">
                                                    {expense.billUrl && (
                                                        <a href={getFileUrl(expense.billUrl)} target="_blank" className="text-primary hover:underline text-[10px]">
                                                            View Bill
                                                        </a>
                                                    )}
                                                    {expense.inputBillUrl && (
                                                        <a href={getFileUrl(expense.inputBillUrl)} target="_blank" className="text-info hover:underline text-[10px] font-bold">
                                                            Input Bill
                                                        </a>
                                                    )}
                                                    {expense.outputBillUrl && (
                                                        <a href={getFileUrl(expense.outputBillUrl)} target="_blank" className="text-success hover:underline text-[10px] font-bold">
                                                            Output Bill
                                                        </a>
                                                    )}
                                                    <div className="flex justify-center items-center gap-2 mt-1">
                                                        {(expense.sourceModel === 'Manual' || !expense.sourceModel) && category !== 'Labour Wages' && canEditRecord(currentUser, expense.createdAt || expense.date) ? (
                                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(expense)}>
                                                                <IconEdit className="h-4 w-4" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-white-dark italic">
                                                                {expense.category === 'Labour Wages' ? 'Finalized' : (expense.sourceModel === 'Trip' ? 'System Entry' : 'Locked')}
                                                            </span>
                                                        )}
                                                        {isOwner && (
                                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => openDeleteModal(expense)}>
                                                                <IconTrashLines className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="panel">
                    <div className="mb-8 flex items-center justify-between border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-5">
                        <div className="flex items-center">
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm ltr:mr-4 rtl:ml-4 flex items-center justify-center rounded-full w-10 h-10 p-0"
                                onClick={() => { setFormView(false); setEditMode(false); }}
                            >
                                <IconArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h5 className="text-xl font-bold dark:text-white-light">{editMode ? `Edit ${title} Record` : `Add New ${title} Record`}</h5>
                                <p className="text-white-dark text-xs mt-1">Manage {title.toLowerCase()} details for your daily operations</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={editMode ? handleUpdate : handleAdd} className="max-w-4xl mx-auto space-y-8">
                        {/* Section 1: Basic Information */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                                <IconPlus className="w-4 h-4" />
                                Basic Information
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block font-primary">
                                        {category === 'Labour Wages' ? 'Salary Paid Date (தேதி)' : 'Date (தேதி)'}
                                    </label>
                                    <input type="date" name="date" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.date} onChange={handleChange} required />
                                </div>
                                {['Diesel', 'Transport Charges', 'Machine Maintenance'].includes(category) && (
                                    <>
                                        {(category === 'Machine Maintenance' || category === 'Diesel') && (
                                            <div>
                                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block font-primary">Asset Type (வாகன வகை)</label>
                                                <select name="assetType" className="form-select border-2 font-bold rounded-xl h-12 border-primary transition-all" value={formData.assetType} onChange={handleChange} required>
                                                    <option value="">Select Asset Type</option>
                                                    <option value="Machine">Machine (இயந்திரம்)</option>
                                                    <option value="Vehicle">Vehicle (வாகனம்)</option>
                                                    <option value="Blasting">Blasting (பிளாஸ்டிங்)</option>
                                                </select>
                                            </div>
                                        )}
                                        {(category !== 'Machine Maintenance' && category !== 'Diesel' || (formData.assetType && formData.assetType !== 'Blasting')) && (
                                            <div>
                                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block font-primary">
                                                    {category === 'Transport Charges' ? 'Transport Vehicle Type' : (formData.assetType === 'Machine') ? 'Select Machine Name' : 'Category Type'}
                                                </label>
                                                <select name="vehicleType" className="form-select border-2 font-bold rounded-xl h-12 border-primary/20" value={formData.vehicleType} onChange={handleChange} required>
                                                    <option value="">Select Category</option>
                                                    {category === 'Transport Charges' ? (
                                                        <>
                                                            <option value="Lorry">Lorry</option>
                                                            <option value="Tipper">Tipper</option>
                                                            <option value="Tractor">Tractor</option>
                                                            <option value="Trailer">Trailer</option>
                                                            <option value="External Transport">External Transport</option>
                                                            {/* Dynamic types from master */}
                                                            {uniqueVehicleTypes.filter(t => !['Lorry', 'Tipper', 'Tractor', 'Trailer', 'External Transport'].includes(t)).map(t => (
                                                                <option key={t} value={t}>{t}</option>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        uniqueVehicleTypes.map((type: string) => <option key={type} value={type}>{type}</option>)
                                                    )}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                                {category !== 'Labour Wages' && formData.vehicleType && filteredVehicles.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">
                                            {category === 'Machine Maintenance' && formData.assetType === 'Machine' ? 'Machine Number / ID' : 'Specific Number / ID (வண்டி எண்)'}
                                        </label>
                                        <select name="vehicleNumber" className="form-select border-2 font-bold rounded-xl h-12 border-primary animate-pulse-once" value={formData.vehicleNumber} onChange={handleChange} required>
                                            <option value="">Select No / ID</option>
                                            {filteredVehicles.map((v: any) => (
                                                <option key={v._id} value={v.vehicleNumber || v.registrationNumber}>
                                                    {v.vehicleNumber || v.registrationNumber || v.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {category !== 'Labour Wages' && formData.vehicleNumber && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block font-primary text-secondary">
                                                {formData.assetType === 'Machine' ? 'Operator Name' : 'Driver Name'}
                                            </label>
                                            <input
                                                type="text"
                                                name="driverName"
                                                className="form-input border-2 font-bold rounded-xl h-12 border-secondary/20"
                                                value={formData.driverName}
                                                onChange={handleChange}
                                                placeholder="Enter name..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block text-primary font-bold">
                                                {category === 'Transport Charges' ? 'Transport Owner / Vendor' : (category === 'Machine Maintenance' ? 'Vendor / Owner Name' : 'Asset Owner / Vendor')}
                                            </label>
                                            <input
                                                type="text"
                                                name="vendorName"
                                                className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 border-primary/20"
                                                value={formData.vendorName}
                                                onChange={handleChange}
                                                placeholder="Enter vendor name..."
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Expense Specific Details */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                                <IconEdit className="w-4 h-4" />
                                {title} Specific Details
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {['Diesel', 'Explosive Cost', 'Transport Charges'].includes(category) && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">
                                                {category === 'Diesel' ? 'Litres (லிட்டர்)' : category === 'Explosive Cost' ? 'Quantity' : 'Total Trips (பயணங்கள்)'}
                                            </label>
                                            <input type="number" name="quantity" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.quantity} onChange={handleChange} required step="any" min="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">
                                                {category === 'Transport Charges' ? 'Rate per Trip (விலை)' : 'Rate per Unit (விலை)'}
                                            </label>
                                            <input type="number" name="rate" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.rate} onChange={handleChange} required step="any" min="0" />
                                        </div>
                                        {category === 'Diesel' && (
                                            <div>
                                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Meter Reading (மீட்டர்)</label>
                                                <input type="text" name="meterReading" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.meterReading} onChange={handleChange} placeholder="Odo / Hours" />
                                            </div>
                                        )}
                                    </>
                                )}

                                {category === 'Explosive Cost' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Site Location (இடம்)</label>
                                            <select name="site" className="form-select border-2 font-bold rounded-xl h-12 border-primary" value={formData.site} onChange={handleChange} required>
                                                <option value="">Select Location</option>
                                                <option value="Main Quarry Pit">Main Quarry Pit</option>
                                                <option value="Crusher Side">Crusher Side</option>
                                                <option value="Hill Blasting Zone">Hill Blasting Zone</option>
                                                <option value="Section A">Section A</option>
                                                <option value="Section B">Section B</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Explosive Type (வகை)</label>
                                            <select name="explosiveType" className="form-select border-2 font-bold rounded-xl h-12" value={formData.explosiveType} onChange={handleChange} required>
                                                <option value="">Select Material</option>
                                                <option value="Gelatin">Gelatin</option>
                                                <option value="Detonator">Detonator</option>
                                                <option value="Fuse Wire">Fuse Wire</option>
                                                <option value="Booster">Booster</option>
                                                <option value="ANFO">ANFO</option>
                                                <option value="Blasting Powder">Blasting Powder</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Unit (அலகு)</label>
                                            <select name="unit" className="form-select border-2 font-bold rounded-xl h-12" value={formData.unit} onChange={handleChange}>
                                                <option value="Nos">Nos</option>
                                                <option value="Kg">Kg</option>
                                                <option value="Meter">Meter</option>
                                                <option value="Box">Box</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block text-primary">Supplier Name (விநியோகஸ்தர்)</label>
                                            <input type="text" name="supplierName" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 border-primary/20" value={formData.supplierName} onChange={handleChange} placeholder="ABC Explosives etc." />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">License / Permit No</label>
                                            <input type="text" name="licenseNumber" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.licenseNumber} onChange={handleChange} placeholder="Supplier / Blasting License" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block text-primary">Supervisor / Blaster Name</label>
                                            <input type="text" name="supervisorName" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 border-primary/20" value={formData.supervisorName} onChange={handleChange} placeholder="Licensed Blaster Name" />
                                        </div>
                                    </>
                                )}

                                {category === 'Transport Charges' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Transport Type (வகை)</label>
                                            <select name="transportType" className="form-select border-2 font-bold rounded-xl h-12 border-primary/20 font-medium" value={formData.transportType} onChange={handleChange}>
                                                <option value="">Select Type</option>
                                                <option value="Material Transport">Material Transport</option>
                                                <option value="Machine Transport">Machine Transport</option>
                                                <option value="Diesel Delivery">Diesel Delivery</option>
                                                <option value="Spare Parts Delivery">Spare Parts Delivery</option>
                                                <option value="Equipment Shifting">Equipment Shifting</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">From Location (எங்கிருந்து)</label>
                                            <input type="text" name="fromLocation" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.fromLocation} onChange={handleChange} placeholder="e.g. Quarry" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">To Location (எங்கு)</label>
                                            <input type="text" name="toLocation" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 text-primary font-medium" value={formData.toLocation} onChange={handleChange} placeholder="e.g. Client Site" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Load Details (சுமை விவரம்)</label>
                                            <input type="text" name="loadDetails" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.loadDetails} onChange={handleChange} placeholder="e.g. 10 Units Blue Metal" />
                                        </div>
                                    </>
                                )}

                                {category === 'Labour Wages' && (
                                    <>
                                        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm mb-4">
                                            <div>
                                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Attendance Month (வருகை மாதம்)</label>
                                                <select
                                                    className="form-select border-2 font-bold rounded-xl h-12 border-primary/30 focus:border-primary bg-white transition-all shadow-sm"
                                                    value={lookupMonth}
                                                    onChange={(e) => setLookupMonth(parseInt(e.target.value))}
                                                >
                                                    {[
                                                        { id: 1, label: 'January (ஜனவரி)' }, { id: 2, label: 'February (பிப்ரவரி)' },
                                                        { id: 3, label: 'March (மார்ச்)' }, { id: 4, label: 'April (ஏப்ரல்)' },
                                                        { id: 5, label: 'May (மே)' }, { id: 6, label: 'June (ஜூன்)' },
                                                        { id: 7, label: 'July (ஜூலை)' }, { id: 8, label: 'August (ஆகஸ்ட்)' },
                                                        { id: 9, label: 'September (செப்டம்பர்)' }, { id: 10, label: 'October (அக்டோபர்)' },
                                                        { id: 11, label: 'November (நவம்பர்)' }, { id: 12, label: 'December (டிசம்பர்)' }
                                                    ].map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Attendance Year (வருகை ஆண்டு)</label>
                                                <select
                                                    className="form-select border-2 font-bold rounded-xl h-12 border-primary/30 focus:border-primary bg-white transition-all shadow-sm"
                                                    value={lookupYear}
                                                    onChange={(e) => setLookupYear(parseInt(e.target.value))}
                                                >
                                                    {Array.from({ length: 2035 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block text-primary font-bold">Work Type (வேலை வகை)</label>
                                            <select name="workType" className="form-select border-2 font-bold rounded-xl h-12 border-primary/20" value={formData.workType} onChange={handleChange}>
                                                <option value="">All Work Types</option>
                                                {workTypes.length > 0 ? (
                                                    workTypes.map((type: any) => <option key={type._id} value={type.name}>{type.name}</option>)
                                                ) : (
                                                    ['Machine Operator', 'Helper', 'Driver', 'Supervisor', 'Cleaner', 'Office Staff', 'Quarry loading', 'Drilling', 'Crusher labour', 'Blasting support', 'Transporter'].map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Labour Name (தொழிலாளர் பெயர்)</label>
                                            <select name="labourName" className="form-select border-2 font-bold rounded-xl h-12" value={formData.labourId} onChange={handleChange} required>
                                                <option value="">Select Labour</option>
                                                {labours
                                                    .filter(l => !formData.workType || l.workType === formData.workType)
                                                    .map((l: any) => <option key={l._id} value={l._id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Wage Type</label>
                                            <select name="wageType" className="form-select border-2 font-bold rounded-xl h-12 bg-gray-50 dark:bg-dark-light/10" value={formData.wageType} onChange={handleChange} disabled>
                                                <option value="">Select Type</option>
                                                <option value="Daily Wage">Daily Wage</option>
                                                <option value="Monthly Salary">Monthly Salary</option>
                                                <option value="Overtime">Overtime</option>
                                                <option value="Contract Payment">Contract Payment</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Quantity / Days</label>
                                            <input type="number" name="quantity" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 bg-gray-50 dark:bg-dark-light/10" value={formData.quantity} onChange={handleChange} readOnly />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2 block font-black">Total Monthly Working Days</label>
                                            <input type="number" name="totalWorkingDays" className="form-input border-2 focus:border-secondary transition-all font-bold rounded-xl h-12 border-secondary/20" value={formData.totalWorkingDays} onChange={handleChange} min="1" placeholder="e.g. 20 (Office) or 30" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Rate (Monthly/Daily)</label>
                                            <input type="number" name="rate" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 bg-gray-50 dark:bg-dark-light/10" value={formData.rate} onChange={handleChange} readOnly />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Per Day Salary</label>
                                            <input type="text" name="perDaySalary" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 bg-gray-50 dark:bg-dark-light/10" value={formData.perDaySalary} readOnly />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-info uppercase tracking-widest mb-2 block font-black">Overtime Salary (OT)</label>
                                            <input type="text" name="otAmount" className="form-input border-2 focus:border-info transition-all font-black rounded-xl h-12 bg-info/5 border-info/30" value={formData.otAmount} readOnly />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-danger uppercase tracking-widest mb-2 block font-bold font-secondary">Advance Deduction</label>
                                            <input type="number" name="advanceDeduction" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 bg-gray-50 dark:bg-dark-light/10 border-danger/20" value={formData.advanceDeduction} onChange={handleChange} readOnly />
                                        </div>
                                        <div className="bg-success/5 p-3 rounded-lg border border-success/20 sm:col-span-2 lg:col-span-1 border-2 border-success/40">
                                            <label className="text-[10px] font-black text-success uppercase tracking-widest mb-1 block font-black border-b border-success/20 pb-1 mb-2">Net Payable (ஆணைத்தொகை) - Pay This Total:</label>
                                            <div className="text-xl font-bold text-success animate-pulse">₹ {parseFloat(formData.netPay || '0').toLocaleString()}</div>
                                        </div>
                                    </>
                                )}

                                {category === 'Machine Maintenance' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block text-primary font-bold">Workshop Name (பட்டறை பெயர்)</label>
                                            <input type="text" name="workshopName" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 border-primary/20" value={formData.workshopName} onChange={handleChange} placeholder="Enter workshop name..." />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Bill / Invoice Number</label>
                                            <input type="text" name="billNumber" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.billNumber} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Maintenance Type</label>
                                            <select name="maintenanceType" className="form-select border-2 font-bold rounded-xl h-12" value={formData.maintenanceType} onChange={handleChange} required>
                                                <option value="">Select Type</option>
                                                {maintenanceTypes.map((type: any) => (
                                                    <option key={type._id} value={type.name}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-full">
                                            <label className="text-[10px] font-black uppercase text-white-dark mb-2 block">Our Spare / Buy Spare</label>
                                            <div className="flex bg-primary/5 p-1 rounded-2xl w-fit">
                                                {['Own', 'Bought'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => handleChange({ target: { name: 'sparePartSource', value: type } })}
                                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                                                            formData.sparePartSource === type ? 'bg-primary text-white shadow-lg' : 'text-primary hover:bg-primary/10'
                                                        }`}
                                                    >
                                                        {type === 'Own' ? 'Our Spare (நமது உதிரிபாகங்கள்)' : 'Buy Spare (புதிய உதிரிபாகங்கள்)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {formData.sparePartSource === 'Own' ? (
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black uppercase text-white-dark mb-2 block">Select Spare Part from Stock *</label>
                                                <select
                                                    name="internalSpareId"
                                                    className="form-select border-2 focus:border-primary transition-all font-bold rounded-xl h-12"
                                                    value={formData.internalSpareId}
                                                    onChange={(e) => {
                                                        const id = e.target.value;
                                                        const s = sparePartsInventory.find(item => item._id === id);
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            internalSpareId: id, 
                                                            sparePartName: s ? s.name : '' 
                                                        }));
                                                    }}
                                                    required
                                                >
                                                    <option value="">Select Spare...</option>
                                                    {sparePartsInventory.map(s => (
                                                        <option key={s._id} value={s._id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-white-dark mb-2 block">Spare Part Name *</label>
                                                    <input
                                                        type="text"
                                                        name="sparePartName"
                                                        className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12"
                                                        value={formData.sparePartName}
                                                        onChange={handleChange}
                                                        placeholder="Enter part name..."
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-white-dark mb-2 block">Spare Parts Cost (₹) *</label>
                                                    <input
                                                        type="number"
                                                        name="sparePartsCost"
                                                        className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12"
                                                        value={formData.sparePartsCost}
                                                        onChange={handleChange}
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white-dark mb-2 block">Labour Charge (₹)</label>
                                            <input type="number" name="labourCharge" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.labourCharge} onChange={handleChange} min="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Current Meter Reading (Hrs)</label>
                                            <input type="text" name="meterReading" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.meterReading} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block text-primary font-bold">Planned Next Service (அடுத்த சர்வீஸ்)</label>
                                            <input type="date" name="nextServiceDate" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 border-primary/20" value={formData.nextServiceDate} onChange={handleChange} />
                                        </div>
                                    </>
                                )}

                                {category === 'Office & Misc' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Expense Category (செலவு வகை)</label>
                                            <select name="officeExpenseType" className="form-select border-2 font-bold rounded-xl h-12 border-primary/20" value={formData.officeExpenseType} onChange={handleChange} required>
                                                <option value="">Select Category</option>
                                                {expenseCategories.length > 0 ? (
                                                    expenseCategories.map((c: any) => <option key={c._id} value={c.name}>{c.name}</option>)
                                                ) : (
                                                    ['Stationery', 'Electricity (EB Bill)', 'Water Bill', 'Internet / Phone Bill', 'Tea / Snacks / Food', 'Cleaning / Housekeeping', 'Courier / Post', 'Printing / Photocopy', 'Office Maintenance', 'Rent / Lease', 'Staff Salary', 'Professional Fees', 'Taxes / Licenses', 'Furniture / Equipment', 'Miscellaneous'].map(c => <option key={c} value={c}>{c}</option>)
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Paid To (யாருக்கு)</label>
                                            <input type="text" name="paidTo" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 text-primary" value={formData.paidTo} onChange={handleChange} placeholder="e.g. EB Office / Shop Name" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Bill Number (வேண்டினால்)</label>
                                            <input type="text" name="billNumber" className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12" value={formData.billNumber} onChange={handleChange} placeholder="Invoice No." />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="mt-4">
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Remarks / Description</label>
                                <textarea name="description" className="form-textarea border-2 font-bold rounded-xl  min-h-[100px]" value={formData.description} onChange={handleChange} placeholder="Enter additional details..."></textarea>
                            </div>
                        </div>

                        {formData.labourType === 'Vendor' && selectedContractorSummary && selectedContractorSummary.workers && selectedContractorSummary.workers.length > 0 && (
                            <div className="mt-8 mb-4 border-t-2 border-primary/10 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h6 className="text-primary font-black uppercase text-xs flex items-center tracking-widest bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
                                        <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                                        Detailed Labour Report (தொழிலாளர் விரிவான அறிக்கை)
                                    </h6>
                                    <div className="badge badge-outline-primary font-black bg-primary/5">
                                        {selectedContractorSummary.workers.length} Members
                                    </div>
                                </div>
                                <div className="table-responsive border-2 border-primary/20 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm shadow-xl">
                                    <table className="table-hover w-full text-xs font-bold uppercase">
                                        <thead>
                                            <tr className="bg-primary border-b-0">
                                                <th className="py-4 px-4 text-left font-black tracking-wider">Labour Name</th>
                                                <th className="py-4 text-left font-black tracking-wider">Work & Wage</th>
                                                <th className="py-4 text-center font-black tracking-wider">Days</th>
                                                <th className="py-4 text-center font-black tracking-wider">OT (Hrs)</th>
                                                <th className="py-4 text-right font-black tracking-wider">Wage</th>
                                                <th className="py-4 text-right font-black tracking-wider">Advance</th>
                                                <th className="py-4 text-right pr-4 font-black tracking-wider">Net Payable</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-primary/10">
                                            {selectedContractorSummary.workers.map((worker: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                                    <td className="py-3 px-4 font-black group-hover:text-primary transition-colors">{worker.name}</td>
                                                    <td className="py-3 text-white-dark font-bold">
                                                        <div className="flex flex-col">
                                                            <span>{worker.workType}</span>
                                                            <span className="text-[9px] text-info/70">{worker.wageType}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="px-2 py-1 bg-success/10 text-success rounded-md border border-success/20">
                                                            {worker.attendance.total}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center text-info">{worker.attendance.otHours || 0}</td>
                                                    <td className="py-3 text-right text-white-dark font-mono">₹{parseFloat(worker.totalWages).toLocaleString()}</td>
                                                    <td className="py-3 text-right text-danger/80 font-mono">₹{parseFloat(worker.totalAdvance).toLocaleString()}</td>
                                                    <td className="py-3 text-right font-black text-primary pr-4 font-mono">₹{parseFloat(worker.netPayable).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {selectedContractorSummary.contractorDirectAdvance > 0 && (
                                                <tr className="bg-danger/5 italic border-t-2 border-danger/20">
                                                    <td colSpan={5} className="py-4 px-4 font-bold text-danger flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                                                        Contractor Direct Advance (கான்ட்ராக்டர் முன்பணம்)
                                                    </td>
                                                    <td className="py-4 text-right text-danger font-mono font-black">₹{parseFloat(selectedContractorSummary.contractorDirectAdvance).toLocaleString()}</td>
                                                    <td className="py-4 text-right pr-4 font-mono font-bold text-danger">-₹{parseFloat(selectedContractorSummary.contractorDirectAdvance).toLocaleString()}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-primary/5 border-t-2 border-primary/20">
                                                <td colSpan={2} className="py-4 px-4 font-black text-sm text-primary">GRAND TOTAL (மொத்தம்)</td>
                                                <td className="py-4 text-center font-black text-sm">{selectedContractorSummary.attendance.total}</td>
                                                <td className="py-4 text-center font-black text-sm">{selectedContractorSummary.attendance.otHours}</td>
                                                <td className="py-4 text-right font-black text-sm">₹{parseFloat(selectedContractorSummary.totalWages).toLocaleString()}</td>
                                                <td className="py-4 text-right font-black text-sm text-danger">₹{parseFloat(selectedContractorSummary.totalAdvance).toLocaleString()}</td>
                                                <td className="py-4 text-right font-black text-lg text-primary bg-primary/10 pr-4 animate-pulse">₹{parseFloat(selectedContractorSummary.netPayable).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Section 3: Payment and Attachment */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                                <IconSave className="w-4 h-4" />
                                Payment & Attachment
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Payment Mode</label>
                                    <select name="paymentMode" className="form-select border-2 font-bold rounded-xl h-12 border-primary" value={formData.paymentMode} onChange={handleChange}>
                                        <option value="Cash">Cash (ரொக்கம்)</option>
                                        <option value="Credit">Credit (கடன்)</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="G-Pay">G-Pay</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Total Amount (மொத்தம்)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            className="form-input border-2 focus:border-primary transition-all font-bold rounded-xl h-12 pl-8 font-bold text-lg border-primary text-primary"
                                            value={formData.amount}
                                            onChange={handleChange}
                                            required
                                            readOnly={['Diesel', 'Explosive Cost', 'Transport Charges', 'Labour Wages'].includes(category)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                {category === 'Machine Maintenance' ? (
                                    <>
                                         <div className="lg:col-span-1">
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Input Bill Attachment</label>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <label className={`cursor-pointer flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 rounded-xl px-4 h-12 hover:border-primary/60 transition-all bg-primary/5 ${uploading.input ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                        <span className="text-sm text-primary font-bold uppercase tracking-tight">{uploading.input ? 'Uploading...' : 'Upload Receipt'}</span>
                                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'input')} accept="image/*,.pdf" />
                                                    </label>
                                                    {(formData.inputBillUrl || selectedInputFile) && !uploading.input && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm rounded-xl h-12 animate-fade-in"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, inputBillUrl: '' }));
                                                                setSelectedInputFile(null);
                                                            }}
                                                        >
                                                            <IconTrashLines className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {formData.inputBillUrl && (
                                                    <div className="relative w-24 h-24 border-2 border-primary/20 rounded-xl overflow-hidden group shadow-md mt-1">
                                                        {formData.inputBillUrl.match(/\.(jpg|jpeg|png|jfif)$/i) || !formData.inputBillUrl.includes('.') ? (
                                                            <img src={getFileUrl(formData.inputBillUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Input Preview" />
                                                        ) : (
                                                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">PDF Bill</div>
                                                        )}
                                                        <a href={getFileUrl(formData.inputBillUrl)} target="_blank" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-black uppercase transition-opacity">
                                                            <IconEdit className="w-5 h-5 mb-1" />
                                                            View Full
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                         <div className="lg:col-span-1">
                                            <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Output Bill Attachment</label>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <label className={`cursor-pointer flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-success/30 rounded-xl px-4 h-12 hover:border-success/60 transition-all bg-success/5 ${uploading.output ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                        <span className="text-sm text-success font-bold uppercase tracking-tight">{uploading.output ? 'Uploading...' : 'Upload Receipt'}</span>
                                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'output')} accept="image/*,.pdf" />
                                                    </label>
                                                    {(formData.outputBillUrl || selectedOutputFile) && !uploading.output && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm rounded-xl h-12 animate-fade-in"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, outputBillUrl: '' }));
                                                                setSelectedOutputFile(null);
                                                            }}
                                                        >
                                                            <IconTrashLines className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {formData.outputBillUrl && (
                                                    <div className="relative w-24 h-24 border-2 border-success/20 rounded-xl overflow-hidden group shadow-md mt-1">
                                                        {formData.outputBillUrl.match(/\.(jpg|jpeg|png|jfif)$/i) || !formData.outputBillUrl.includes('.') ? (
                                                            <img src={getFileUrl(formData.outputBillUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Output Preview" />
                                                        ) : (
                                                            <div className="w-full h-full bg-success/10 flex items-center justify-center text-success font-black text-xs uppercase">PDF Bill</div>
                                                        )}
                                                        <a href={getFileUrl(formData.outputBillUrl)} target="_blank" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-black uppercase transition-opacity">
                                                            <IconEdit className="w-5 h-5 mb-1" />
                                                            View Full
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                     <div className="lg:col-span-1">
                                        <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">Bill Attachment</label>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <label className={`cursor-pointer flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 rounded-xl px-4 h-12 hover:border-primary/60 transition-all bg-primary/5 ${uploading.main ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                    <span className="text-sm text-primary font-bold uppercase tracking-tight">{uploading.main ? 'Uploading...' : 'Upload Receipt'}</span>
                                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'bill')} accept="image/*,.pdf" />
                                                </label>
                                                {(formData.billUrl || selectedFile) && !uploading.main && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm rounded-xl h-12 animate-fade-in"
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
                                                <div className="relative w-24 h-24 border-2 border-primary/20 rounded-xl overflow-hidden group shadow-md mt-1">
                                                    {formData.billUrl.match(/\.(jpg|jpeg|png|jfif)$/i) || !formData.billUrl.includes('.') ? (
                                                        <img src={getFileUrl(formData.billUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Bill Preview" />
                                                    ) : (
                                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">PDF Bill</div>
                                                    )}
                                                    <a href={getFileUrl(formData.billUrl)} target="_blank" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-black uppercase transition-opacity">
                                                        <IconEdit className="w-5 h-5 mb-1" />
                                                        View Full
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-8 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-danger px-8" onClick={() => { setFormView(false); setEditMode(false); }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-10 shadow-lg shadow-primary/20">
                                <IconSave className="ltr:mr-2 rtl:ml-2" />
                                {editMode ? 'Update Record' : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Modal remains a popup for safety confirmation */}
            <Transition appear show={deleteModal} as={Fragment}>
                <Dialog as="div" open={deleteModal} onClose={() => setDeleteModal(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60 z-[999]" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel my-8 w-full max-w-lg overflow-hidden rounded-2xl border-0 p-0 text-black shadow-2xl dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <div className="text-lg font-bold">Confirm Delete</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setDeleteModal(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-primary" onClick={() => setDeleteModal(false)}>Cancel</button>
                                            <button type="button" className="btn btn-danger ltr:ml-4 rtl:mr-4" onClick={handleDelete}>Delete Permanently</button>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div >
    );
};

export default ExpenseCategoryManager;
