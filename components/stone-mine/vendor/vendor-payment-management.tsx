'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import IconPlus from '@/components/icon/icon-plus';
import IconSave from '@/components/icon/icon-save';
import IconSearch from '@/components/icon/icon-search';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPencil from '@/components/icon/icon-pencil';
import IconEye from '@/components/icon/icon-eye';
import IconPrinter from '@/components/icon/icon-printer';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconX from '@/components/icon/icon-x';
import IconDownload from '@/components/icon/icon-download';
import * as XLSX from 'xlsx';

const exportToExcel = (data: any[], fileName: string) => {
    if (!data || data.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(data.map((item: any) => ({
        Date: new Date(item.date).toLocaleDateString(),
        Vehicle: (item.vehicleId?.vehicleNumber || item.vehicleId?.registrationNumber || item.manualVehicleNumber || 'N/A').toUpperCase(),
        Material: item.stoneTypeId?.name || 'General',
        From: item.fromLocation || '',
        To: item.toLocation || '',
        'Tons/Qty': item.loadQuantity || 0,
        'Payable Amount': item.invoiceAmount || 0,
        'Expenses/Deductions': item.deductionsAmount || 0,
        'Cash Paid': item.paidAmount || 0,
        Status: item.isVendorSettled ? 'Settled' : 'Pending'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

const VendorPaymentManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const { showToast } = useToast();

    // Data State
    const [allVendors, setAllVendors] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [balances, setBalances] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Filter & UI State
    const [showForm, setShowForm] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [historySearch, setHistorySearch] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Settlement Logic State
    const [isFetchingSubData, setIsFetchingSubData] = useState(false);
    const [vendorTrips, setVendorTrips] = useState<any[]>([]);
    const [dieselExpenses, setDieselExpenses] = useState<number>(0);
    const [maintenanceExpenses, setMaintenanceExpenses] = useState<number>(0);
    const [dailyAdvances, setDailyAdvances] = useState<number>(0);
    const [sparePartsExpenses, setSparePartsExpenses] = useState<number>(0);
    const [policeExpenses, setPoliceExpenses] = useState<number>(0);
    const [otherExpenses, setOtherExpenses] = useState<number>(0);
    const [materialRates, setMaterialRates] = useState<Record<string, string>>({});

    // Payment Logic
    const [paymentMode, setPaymentMode] = useState<string>('Bank');
    const [billUrl, setBillUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [manualPaidAmount, setManualPaidAmount] = useState<string | null>(null);
    const [alreadySettledWarning, setAlreadySettledWarning] = useState<boolean>(false);
    const [isFetchingDetailedTrips, setIsFetchingDetailedTrips] = useState(false);
    const [viewingTrips, setViewingTrips] = useState<any[]>([]);

    // Global Trip Search State
    const [searchTripParams, setSearchTripParams] = useState({
        vendorId: '',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [allTripsForSearch, setAllTripsForSearch] = useState<any[]>([]);
    const [isSearchingTrips, setIsSearchingTrips] = useState(false);

    const [formData, setFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        vendorSelected: '', // Value format: "id|type|name"
        paymentType: 'Bill',
        invoiceAmount: 0,
        referenceNumber: '',
        notes: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balRes, expRes, transRes, payRes] = await Promise.all([
                api.get('/vendors/outstanding'),
                api.get('/vendors/explosive'),
                api.get('/vendors/transport'),
                api.get('/vendors/payments')
            ]);

            if (payRes.data.success) setPayments(payRes.data.data);

            const balMap: any = {};
            if (balRes.data.success) {
                balRes.data.data.forEach((b: any) => {
                    balMap[`${b.vendorId}|${b.vendorType}`] = b.balance;
                });
            }
            setBalances(balMap);

            const vendors: any[] = [];
            if (expRes.data.success) vendors.push(...expRes.data.data.map((v: any) => ({ ...v, type: 'ExplosiveSupplier', label: `[Explosive] ${v.name}` })));
            if (transRes.data.success) {
                vendors.push(...transRes.data.data.map((v: any) => ({
                    ...v,
                    type: 'TransportVendor',
                    label: `${v.companyName ? `${v.companyName} - ` : ''}${v.name} (${v.vehicles?.length || 0} Vehicles)`
                })));
            }
            setAllVendors(vendors);
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    const fetchSettlementData = async (sDate: string, eDate: string, vendorId: string, vendorType: string, currentEditingId: string | null = null) => {
        if (!sDate || !eDate || !vendorId) return;
        try {
            setIsFetchingSubData(true);

            // Dates for queries
            const endOfDay = `${eDate}T23:59:59.999Z`;

            let tripRes: any = { data: { success: true, data: [] } };
            let expenseRes: any = { data: { success: true, data: [] } };
            let advanceRes: any = { data: { success: true, data: [] } };
            let spareRes: any = { data: { success: true, data: [] } };

            try {
                const results = await Promise.allSettled([
                    api.get(`/trips?startDate=${sDate}&endDate=${endOfDay}`),
                    api.get(`/expenses?startDate=${sDate}&endDate=${endOfDay}`),
                    api.get(`/vendors/payments?startDate=${sDate}&endDate=${endOfDay}`),
                    api.get(`/spare-parts-sales?startDate=${sDate}&endDate=${endOfDay}`)
                ]);

                if (results[0].status === 'fulfilled') tripRes = results[0].value;
                else console.warn('Settlement: Failed to fetch trips');

                if (results[1].status === 'fulfilled') expenseRes = results[1].value;
                else console.warn('Settlement: Failed to fetch expenses');

                if (results[2].status === 'fulfilled') advanceRes = results[2].value;
                else console.warn('Settlement: Failed to fetch payment history');

                if (results[3].status === 'fulfilled') spareRes = results[3].value;
                else console.warn('Settlement: Failed to fetch spare parts');

                // Only show a general toast if we have NO critical data (like trips)
                if (results[0].status === 'rejected') {
                    showToast('Could not load trips for settlement', 'error');
                }
            } catch (err) {
                console.error('Diagnostic error:', err);
            }

            const vendor = allVendors.find(v => v._id === vendorId && v.type === vendorType);
            const vendorVehicles = vendor?.vehicles || [];

            const normalize = (v: string) => (v || '').replace(/[\s-]/g, '').toLowerCase();
            const extractNum = (v: string) => {
                const match = (v || '').match(/\((.*?)\)/);
                return match ? match[1] : v;
            };

            const vehicleNumbers = vendorVehicles.map((v: any) => normalize(v.vehicleNumber));

            if (tripRes.data.success) {
                const filtered = tripRes.data.data.filter((t: any) => {
                    // 1. Must NOT be settled with vendor already (unless we are editing)
                    if (t.isVendorSettled && !currentEditingId) return false;

                    // 3. Exclude trips ONLY IF they are part of a 3rd Party sale where the SAME contractor is the buyer.
                    if (t.saleId?.saleType === '3rd Party') {
                        const saleContractorId = (t.saleId?.contractor?._id || t.saleId?.contractor || '').toString();
                        const currentVendorId = (vendorId || '').toString();
                        if (saleContractorId === currentVendorId) {
                            return false; 
                        }
                    }

                    const tripVNum = normalize(t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.manualVehicleNumber || '');
                    return vehicleNumbers.includes(tripVNum);
                });
                setVendorTrips(filtered);
            }

            let diesel = 0;
            let maintenance = 0;
            let police = 0;
            let other = 0;

            if (expenseRes.data.success) {
                expenseRes.data.data.forEach((e: any) => {
                    // 1. Direct match by transportVendorId (if available)
                    const isVendorMatch = e.transportVendorId === vendorId;

                    // 2. Match by vehicle number
                    const rawNum = e.vehicleNumber || extractNum(e.vehicleOrMachine);
                    const isVehicleMatch = vehicleNumbers.includes(normalize(rawNum));

                    if (isVendorMatch || isVehicleMatch) {
                        if (e.category === 'Diesel') diesel += e.amount;
                        else if (e.category === 'Machine Maintenance') maintenance += e.amount;
                        else if (e.category === 'Police' || e.category === 'Police Expense' || e.category === 'Police Expenses') police += e.amount;
                        else if (e.category === 'Transport Contractor' || e.category === 'Transport Vendor Other' || e.category === 'Transport Contractor Exp') other += e.amount;
                    }
                });
            }
            setDieselExpenses(diesel);
            setMaintenanceExpenses(maintenance);
            setPoliceExpenses(police);
            setOtherExpenses(other);

            // Spare Parts Deductions
            let spares = 0;
            if (spareRes.data.success) {
                spareRes.data.data.forEach((s: any) => {
                    const isVendorMatch = s.transportVendorId === vendorId;
                    const isVehicleMatch = vehicleNumbers.includes(normalize(s.vehicleNumber));
                    if (isVendorMatch || isVehicleMatch) {
                        spares += (s.totalAmount || 0);
                    }
                });
            }
            setSparePartsExpenses(spares);

            if (advanceRes.data.success) {
                const dayPayments = advanceRes.data.data.filter((p: any) =>
                    p.vendorId === vendorId
                );

                const existingSettlements = dayPayments.filter((p: any) => p.paymentType !== 'Advance' && p._id !== currentEditingId);
                setAlreadySettledWarning(existingSettlements.length > 0);

                const advances = dayPayments
                    .filter((p: any) => p.paymentType === 'Advance')
                    .reduce((sum: number, p: any) => sum + p.paidAmount, 0);

                setDailyAdvances(advances);
            }
        } catch (error: any) {
            console.error('SubData fetch error:', error);
            showToast(error.message || 'ERROR: Settlement Display Logic Failed', 'error');
        } finally {
            setIsFetchingSubData(false);
        }
    };

    const uniqueMaterials = Array.from(new Set(vendorTrips.map(t => t.stoneTypeId?.name || 'General')));
    const tonsByMaterial = uniqueMaterials.reduce((acc, material) => {
        acc[material] = vendorTrips.filter(t => (t.stoneTypeId?.name || 'General') === material).reduce((sum, t) => sum + (t.loadQuantity || 0), 0);
        return acc;
    }, {} as Record<string, number>);

    const totalTons = vendorTrips.reduce((sum, t) => sum + (t.loadQuantity || 0), 0);
    const grossTotal = Object.keys(tonsByMaterial).reduce((sum, material) => sum + (tonsByMaterial[material] * Number(materialRates[material] || 0)), 0);

    // Get Previous Balance
    const [cvId, cvType] = formData.vendorSelected.split('|');
    const previousBalance = balances[`${cvId}|${cvType}`] || 0;

    const totalDeductionsCalc = dieselExpenses + maintenanceExpenses + dailyAdvances + sparePartsExpenses + policeExpenses + otherExpenses;
    const netPayable = (grossTotal + previousBalance) - totalDeductionsCalc;

    const convertJfifToJpg = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('Could not get canvas context');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name.replace(/\.jfif$/i, '.jpg'), { type: 'image/jpeg' });
                            resolve(newFile);
                        } else {
                            reject('Blob creation failed');
                        }
                    }, 'image/jpeg', 0.9);
                };
                img.onerror = () => reject('Image load failed');
                if (e.target?.result) img.src = e.target.result as string;
            };
            reader.onerror = () => reject('File read failed');
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: any) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];
            setIsUploading(true);
            try {
                if (file.name.toLowerCase().endsWith('.jfif')) {
                    showToast('Converting JFIF to JPG...', 'info');
                    file = await convertJfifToJpg(file);
                }
                const uploadData = new FormData();
                uploadData.append('bill', file);
                const { data } = await api.post('/upload', uploadData);
                if (data.filePath) {
                    setBillUrl(data.filePath);
                    showToast('File uploaded successfully!', 'success');
                } else {
                    showToast('Upload failed. Please try again.', 'error');
                }
            } catch (err) {
                console.error('File upload failed:', err);
                showToast('Error uploading file', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'startDate' || name === 'endDate' || name === 'vendorSelected') {
            setManualPaidAmount(null); // Reset manual amount on change
            const sDateToUse = name === 'startDate' ? value : formData.startDate;
            const eDateToUse = name === 'endDate' ? value : formData.endDate;
            const vendorToUse = name === 'vendorSelected' ? value : formData.vendorSelected;
            if (sDateToUse && eDateToUse && vendorToUse) {
                const [vId, vType] = vendorToUse.split('|');
                if (vType === 'TransportVendor') {
                    if (!editingId) setMaterialRates({});
                    fetchSettlementData(sDateToUse, eDateToUse, vId, vType, editingId);
                }
            }
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!formData.vendorSelected) return showToast('Please select a vendor', 'error');
        if (alreadySettledWarning && !editingId) return showToast('Settlement already recorded for this date. Cannot duplicate.', 'error');
        try {
            const [vId, vType, vName] = formData.vendorSelected.split('|');
            // Sanitize user notes to prevent double-appending system text
            const sanitizedUserNotes = (formData.notes || '')
                .replace(/Daily Settlement:.*?(?=Deductions:)/g, '')
                .replace(/Deductions:.*?(?=\s[A-Z]|$)/g, '')
                .replace(/^\.+|\s*\d+\/\d+\/\d+.*$/g, '')
                .trim();

            const data = {
                ...formData,
                date: formData.endDate,
                startDate: formData.startDate,
                endDate: formData.endDate,
                vendorId: vId,
                vendorType: vType,
                vendorName: vName,
                // Invoice Amount is what they EARNED in this period (Gross Earnings)
                invoiceAmount: grossTotal,
                // Deductions Amount is what they SPENT (Diesel, Maint, etc.)
                deductionsAmount: totalDeductionsCalc,
                // Paid Amount is the actual PHYSICAL CASH/BANK we give them now
                paidAmount: Number(manualPaidAmount !== null ? manualPaidAmount : (netPayable > 0 ? netPayable : 0)),
                totalTons: totalTons,
                tripCount: vendorTrips.length,
                paymentMode: paymentMode,
                billUrl: billUrl,
                notes: `Daily Settlement (${formData.startDate} to ${formData.endDate}): ${Object.keys(tonsByMaterial).map(m => `${tonsByMaterial[m].toFixed(2)} Tons of ${m} @ ₹${materialRates[m] || 0}`).join(' | ')}. Prev Bal: ₹${previousBalance.toFixed(2)}. Deductions: Diesel ₹${dieselExpenses}, Maint ₹${maintenanceExpenses}, Adv ₹${dailyAdvances}, Spares ₹${sparePartsExpenses}, Police ₹${policeExpenses}, Other ₹${otherExpenses}. ${sanitizedUserNotes}`
            };

            if (editingId) {
                await api.put(`/vendors/payments/${editingId}`, data);
                showToast('Settlement updated successfully!', 'success');
            } else {
                await api.post('/vendors/payments', data);
                showToast('Settlement recorded successfully!', 'success');
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error saving settlement', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            vendorSelected: '',
            paymentType: 'Bill',
            invoiceAmount: 0,
            referenceNumber: '',
            notes: ''
        });
        setVendorTrips([]);
        setMaterialRates({});
        setDieselExpenses(0);
        setMaintenanceExpenses(0);
        setDailyAdvances(0);
        setSparePartsExpenses(0);
        setPoliceExpenses(0);
        setOtherExpenses(0);
        setPaymentMode('Bank');
        setBillUrl('');
        setEditingId(null);
        setAlreadySettledWarning(false);
        setShowForm(false);
    };

    const handleEdit = (record: any) => {
        const [vId, vType] = record.vendorId && typeof record.vendorId === 'object' ? [record.vendorId._id, record.vendorType] : [record.vendorId, record.vendorType];

        // Parse material rates out of notes
        const parsedMaterialRates: Record<string, string> = {};
        // Match the section between the colon and either ". Prev Bal" or ". Deductions"
        const ratesMatch = (record.notes || '').match(/Daily Settlement.*?: (.*?)\. (?:Prev Bal|Deductions):/);

        if (ratesMatch && ratesMatch[1]) {
            const sections = ratesMatch[1].split(' | ');
            sections.forEach((sec: string) => {
                const parts = sec.match(/(\d+(?:\.\d+)?) Tons of (.*?) @ ₹(\d+(?:\.\d+)?)/);
                if (parts && parts.length === 4) {
                    parsedMaterialRates[parts[2].trim()] = parts[3];
                }
            });
        }
        setMaterialRates(parsedMaterialRates);

        const details = parseSettlementNotes(record.notes || '', record);

        // Use formal fields if available, fall back to notes or date
        const sDate = record.startDate ? new Date(record.startDate).toISOString().split('T')[0] : (record.notes?.match(/Daily Settlement \((.*?) to/)?.[1] || new Date(record.date).toISOString().split('T')[0]);
        const eDate = record.endDate ? new Date(record.endDate).toISOString().split('T')[0] : (record.notes?.match(/to (.*?)\)/)?.[1] || new Date(record.date).toISOString().split('T')[0]);

        setFormData({
            startDate: sDate,
            endDate: eDate,
            vendorSelected: `${vId}|${record.vendorType}|${record.vendorName}`,
            paymentType: record.paymentType || 'Bill',
            invoiceAmount: record.invoiceAmount || 0,
            referenceNumber: record.referenceNumber || '',
            notes: (details.userNotes || '').trim()
        });
        setPaymentMode(record.paymentMode || 'Bank');
        setBillUrl(record.billUrl || '');
        setEditingId(record._id);
        setAlreadySettledWarning(false);
        setShowForm(true);

        fetchSettlementData(sDate, eDate, vId, record.vendorType, record._id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/vendors/payments/${deleteId}`);
            showToast('Record deleted!', 'success');
            setDeleteId(null);
            fetchData();
        } catch (error) {
            showToast('Error deleting record', 'error');
        }
    };

    const handleSearchAllTrips = async () => {
        if (!searchTripParams.vendorId) return showToast('Please select a vendor to search trips', 'error');
        try {
            setIsSearchingTrips(true);
            const { startDate, endDate, vendorId } = searchTripParams;
            const res = await api.get(`/trips?startDate=${startDate}&endDate=${endDate}T23:59:59.999Z`);

            if (res.data.success) {
                const vendor = allVendors.find(v => v._id === vendorId);
                const vehicleNumbers = (vendor?.vehicles || []).map((v: any) => (v.vehicleNumber || '').replace(/[\s-]/g, '').toLowerCase());

                const filtered = res.data.data.filter((t: any) => {
                    const tripVNum = (t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.manualVehicleNumber || '').replace(/[\s-]/g, '').toLowerCase();
                    return vehicleNumbers.includes(tripVNum);
                });
                setAllTripsForSearch(filtered);
                if (filtered.length === 0) showToast('No trips found for this period', 'info');
            }
        } catch {
            showToast('Error searching trips', 'error');
        } finally {
            setIsSearchingTrips(false);
        }
    };

    const parseSettlementNotes = (notes: string, p: any = {}) => {
        const dieselMatch = notes.match(/Diesel ₹(\d+)/);
        const maintMatch = notes.match(/Maint ₹(\d+)/);
        const advMatch = notes.match(/Adv ₹(\d+)/);

        // Priority 1: Use direct fields from DB if they exist (for new records)
        let totalTons = p.totalTons || 0;
        let grossFromNotes = p.invoiceAmount || 0;
        let inferredTrips = p.tripCount || 0;

        // Priority 2: Fallback to parsing notes (for old records)
        if (totalTons === 0 || grossFromNotes === 0) {
            // Updated split to handle "Daily Settlement (" format
            const relevantContent = notes.split(/Daily Settlement(?::| \(.*?\):)/)[1] || notes;
            const materialRegex = /([\d.]+) Tons of (.*?) @ (?:₹)?([\d.]+)/g;
            let m;
            while ((m = materialRegex.exec(relevantContent)) !== null) {
                totalTons += parseFloat(m[1]);
                grossFromNotes += (parseFloat(m[1]) * parseFloat(m[3]));
                inferredTrips++;
            }
        }

        const diesel = parseInt(dieselMatch?.[1] || '0');
        const maint = parseInt(maintMatch?.[1] || '0');
        const adv = parseInt(advMatch?.[1] || '0');
        const spares = parseInt(notes.match(/Spares ₹(\d+)/)?.[1] || '0');
        const police = parseInt(notes.match(/Police ₹(\d+)/)?.[1] || '0');
        const other = parseInt(notes.match(/Other ₹(\d+)/)?.[1] || '0');

        const deductions = diesel + maint + adv + spares + police + other;
        const net = grossFromNotes - deductions;

        let sDate = notes.match(/Daily Settlement \((.*?) to/)?.[1] || '';
        let eDate = notes.match(/to (.*?)\)/)?.[1] || '';

        // Clean up user notes by removing all system prefixes
        let manualNotes = notes;
        // Use a more inclusive regex for the "Daily Settlement" block
        manualNotes = manualNotes
            .replace(/Daily Settlement \(.*?\):.*?(?=( \. )|(\. Prev Bal)|$)/g, '')
            .replace(/\.? Prev Bal:.*?(?=(\. Deductions)|(\. )|$)/g, '')
            .replace(/\.? Deductions:.*?(?=(\. )|$)/g, '')
            .trim();
        // Remove trailing or leading periods and extra spaces
        manualNotes = manualNotes.replace(/^\.+|\.+$/g, '').trim();

        return {
            totalTons,
            grossTotal: grossFromNotes,
            diesel,
            maint,
            adv,
            spares,
            police,
            other,
            deductions,
            net,
            userNotes: manualNotes,
            tripCount: inferredTrips,
            sDate,
            eDate
        };
    };

    const filteredPayments = payments.filter((p) =>
        p.vendorName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        p.notes?.toLowerCase().includes(historySearch.toLowerCase())
    );

    const handlePrint = () => {
        if (!selectedRecord) return;

        // Ensure data is ready
        if (isFetchingDetailedTrips) {
            alert("Record details are still loading. Please wait a moment.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const details = parseSettlementNotes(selectedRecord.notes || '', selectedRecord);
        const totalDeductions = details.deductions;
        const grossEarning = details.grossTotal;
        const currentNet = details.net;
        const totalTonsReported = details.totalTons;

        const invoiceHtml = `
            <html>
                <head>
                    <title>Vendor Settlement Report - ${selectedRecord.vendorName}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                        @page { margin: 5mm; size: A4 portrait; }
                        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; background: white; color: #1e293b; line-height: 1.4; }
                        .report-container { width: 100%; position: relative; padding: 20px; }
                        
                        /* HEADER SECTION */
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                        
                        .header-left { text-align: left; }
                        .report-title { font-size: 20px; font-weight: 900; color: #475569; text-transform: uppercase; margin-bottom: 4px; letter-spacing: -0.5px; }
                        .period-text { font-size: 13px; color: #94a3b8; font-weight: 700; }

                        .header-right { text-align: right; }
                        .company-logo { width: 65px; height: 65px; object-fit: contain; margin-bottom: 8px; }
                        .company-name { font-size: 18px; font-weight: 900; color: #e79b21; text-transform: uppercase; margin-bottom: 2px; }
                        .company-tag { font-size: 10px; font-weight: 700; color: #64748b; text-transform: none; margin-bottom: 2px; }
                        .gst-text { font-size: 10px; font-weight: 800; color: #e79b21; }

                        /* RECORD DETAILS */
                        .section-title { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; margin-top: 25px; border-left: 3px solid #e79b21; padding-left: 10px; }
                        .details-table-new { width: 100%; border-collapse: collapse; margin-bottom: 25px; background: #f8fafc; border-radius: 12px; overflow: hidden; }
                        .details-table-new td { padding: 12px 20px; border: none; font-size: 13px; vertical-align: middle; }
                        .detail-label { color: #64748b; font-weight: 700; margin-right: 15px; }
                        .detail-val { color: #1e293b; font-weight: 800; }

                        /* TABLES */
                        .table-header { background: #e79b21; padding: 10px 15px; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #f1f5f9; }
                        th { background: #e79b21; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 12px 15px; text-align: left; border: none; }
                        td { padding: 12px 15px; font-size: 13px; color: #1e293b; font-weight: 600; border-bottom: 1.5px solid #f1f5f9; }
                        th.text-right, td.text-right { text-align: right; }
                        .fw-800 { font-weight: 800; }

                        /* SUMMARY SECTION */
                        .summary-container { display: flex; flex-direction: column; align-items: flex-end; width: 100%; margin-top: 20px; }
                        .summary-row { display: flex; justify-content: flex-end; width: 300px; margin-bottom: 10px; font-size: 14px; }
                        .summary-label { flex: 1; text-align: left; color: #94a3b8; font-weight: 600; }
                        .summary-val { width: 120px; text-align: right; color: #1e293b; font-weight: 800; }
                        .deduct-val { color: #ef4444; }
                        .total-divider { width: 350px; height: 3px; background: #e79b21; margin: 15px 0; border-radius: 4px; }
                        .final-row { display: flex; justify-content: flex-end; width: 400px; font-size: 20px; }
                        .final-label { flex: 1; text-align: left; color: #e79b21; font-weight: 800; }
                        .final-val { width: 150px; text-align: right; color: #e79b21; font-weight: 900; }

                        /* SIGNATURE */
                        .footer-sig { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px; }
                        .sig-block { text-align: center; }
                        img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .sig-img { 
                            width: 180px; 
                            height: auto; 
                            display: block; 
                            mix-blend-mode: multiply !important;
                            filter: grayscale(1) contrast(8) brightness(3);
                            -webkit-print-color-adjust: exact !important;
                        }
                        .sig-line { width: 180px; height: 60px; border-bottom: 1.5px dashed #94a3b8; margin-bottom: 8px; }
                        @media print {
                            .sig-img { mix-blend-mode: multiply !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <img src="/assets/images/logo.png" class="watermark" style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 500px; opacity: 0.05; z-index: -1; pointer-events: none;" />
                        
                        <div class="header">
                            <div class="header-left">
                                <h1 class="report-title">Vendor Settlement Report</h1>
                                <p class="period-text">Report Period: ${details.sDate ? `${details.sDate} to ${details.eDate}` : new Date(selectedRecord.date).toLocaleDateString('en-GB')}</p>
                            </div>
                            <div class="header-right">
                                <img src="/assets/images/logo.png" class="company-logo" />
                                <h1 class="company-name">Karthick Earth Movers</h1>
                                <p class="company-tag">Stone Quarry & Transport Unit</p>
                                <p class="gst-text">GST: 33AVFPK9827P2ZV</p>
                            </div>
                        </div>

                        <div class="section-title">Record Details</div>
                        <table class="details-table-new">
                            <tr>
                                <td>
                                    <span class="detail-label">Vendor Name:</span>
                                    <span class="detail-val">${selectedRecord.vendorName}</span>
                                </td>
                                <td style="text-align: right;">
                                    <span class="detail-label">Generated Date:</span>
                                    <span class="detail-val">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 0;">
                                    <span class="detail-label">Total Tonnage:</span>
                                    <span class="detail-val" style="color: #e79b21;">${totalTonsReported.toFixed(2)} T</span>
                                </td>
                                <td style="text-align: right; padding-top: 0;">
                                    <span class="detail-label">Payment Mode:</span>
                                    <span class="detail-val" style="color: #e79b21;">${selectedRecord.paymentMode}</span>
                                </td>
                            </tr>
                        </table>

                        <div class="section-title" style="color: #e79b21;">Verified Trip Entries</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px;">S.No</th>
                                    <th>Material Description</th>
                                    <th>Vehicle Number</th>
                                    <th class="text-right">Weight (T)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${viewingTrips.map((t, idx) => `
                                    <tr>
                                        <td>${(idx + 1).toString().padStart(2, '0')}</td>
                                        <td>${t.stoneTypeId?.name || 'Material'} <span style="font-size: 9px; opacity: 0.5;">(${t.fromLocation} → ${t.toLocation})</span></td>
                                        <td class="fw-800">${(t.vehicleId?.vehicleNumber || t.manualVehicleNumber || 'N/A').toUpperCase()}</td>
                                        <td class="text-right fw-800">${(t.loadQuantity || 0).toFixed(2)} T</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="section-title" style="color: #ef4444;">Expenses/Deductions & Adjustments</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Adjusted Category</th>
                                    <th class="text-right">Deducted Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Diesel Consumption</td>
                                    <td class="text-right fw-800">₹ ${Number(details.diesel).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Maintenance & Repairs</td>
                                    <td class="text-right fw-800">₹ ${Number(details.maint).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Cash Advances / Padi Kasu</td>
                                    <td class="text-right fw-800">₹ ${Number(details.adv).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Spare Parts Issued</td>
                                    <td class="text-right fw-800">₹ ${Number(details.spares || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Police & Station Expenses</td>
                                    <td class="text-right fw-800">₹ ${Number(details.police || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Other Vendor Charges</td>
                                    <td class="text-right fw-800">₹ ${Number(details.other || 0).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="summary-container">
                            <div class="summary-row">
                                <span class="summary-label">Gross Revenue Accrued</span>
                                <span class="summary-val">₹ ${grossEarning.toLocaleString()}</span>
                            </div>
                            <div class="summary-row">
                                <span class="summary-label">Total Period Expenses/Deductions</span>
                                <span class="summary-val deduct-val">- ₹ ${totalDeductions.toLocaleString()}</span>
                            </div>
                            <div class="total-divider"></div>
                            <div class="final-row">
                                <span class="final-label">Net Payable Balance</span>
                                <span class="final-val">₹ ${currentNet.toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="footer-sig">
                            <div class="sig-block">
                                <div class="sig-line"></div>
                                <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">Contractor Signature</div>
                            </div>
                            <div class="sig-block">
                                <img src="/assets/images/Karthick-Earthmovers-owner-sign.jpeg" class="sig-img" />
                                <div style="font-size: 10px; font-weight: 800; color: #475569; margin-top: 5px; text-transform: uppercase;">Authorized Signatory</div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    useEffect(() => {
        const fetchViewTrips = async () => {
            if (!selectedRecord && !showForm) return;
            try {
                const target = selectedRecord || formData;
                const vSplit = (selectedRecord?.vendorId?._id ? `${selectedRecord.vendorId._id}|${selectedRecord.vendorType}` : (formData.vendorSelected || '')).split('|');
                const vId = vSplit[0];
                const vType = vSplit[1];
                const dateRaw = selectedRecord?.date || formData.endDate;

                if (vId && vType && dateRaw) {
                    setIsFetchingDetailedTrips(true);

                    const details = parseSettlementNotes(selectedRecord?.notes || '');
                    const sDate = details.sDate || formData.startDate; // Use form start date if no notes (new entry)
                    const eDate = details.eDate || (selectedRecord?.date ? new Date(selectedRecord.date).toISOString().split('T')[0] : formData.endDate);
                    const endOfDay = `${eDate}T23:59:59.999Z`;

                    const tripRes = await api.get(`/trips?startDate=${sDate}&endDate=${endOfDay}`);

                    const vendor = allVendors.find(v => v._id === vId && v.type === vType);
                    const vendorVehicles = vendor?.vehicles || [];
                    const normalize = (v: string) => (v || '').replace(/[\s-]/g, '').toLowerCase();
                    const vehicleNumbers = vendorVehicles.map((v: any) => normalize(v.vehicleNumber));

                    if (tripRes.data && (tripRes.data.success || Array.isArray(tripRes.data.data))) {
                        const rawData = tripRes.data.data || tripRes.data;
                        const filtered = rawData.filter((t: any) => {
                            const tripVNum = normalize(t.vehicleId?.vehicleNumber || t.vehicleId?.registrationNumber || t.manualVehicleNumber || '');
                            return vehicleNumbers.includes(tripVNum);
                        });
                        setViewingTrips(filtered);
                    } else {
                        setViewingTrips([]);
                    }
                }
            } catch (err) {
                console.error('Error fetching view trips:', err);
                setViewingTrips([]);
            } finally {
                setIsFetchingDetailedTrips(false);
            }
        };
        fetchViewTrips();
    }, [selectedRecord, showForm, allVendors]);

    const showFormHandler = () => {
        setShowForm(true);
        setSelectedRecord(null);
    };

    const closeFormHandler = () => {
        setShowForm(false);
        resetForm();
    };

    return (
        <div className="space-y-6">
            <style>{`
                @media print {
                    @page { margin: 0; }
                    body { margin: 1.6cm; }
                    /* Hide everything */
                    body > * { display: none !important; }
                    /* Only show the invoice container and its contents */
                    #invoice-print-wrapper { 
                        display: block !important; 
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    /* Ensure colors print correctly */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print\\:hidden { display: none !important; }
                    .panel { box-shadow: none !important; border: none !important; }
                }
            `}</style>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase text-[#e79b21] tracking-tighter">Vendor Management</h2>
                    <p className="text-white-dark text-[10px] font-bold uppercase tracking-widest mt-1">Daily trip earnings & settlement records</p>
                </div>
                <div className="flex items-center gap-2">
                    {!showForm && !selectedRecord ? (
                        <button onClick={showFormHandler} className="btn btn-primary btn-sm flex items-center gap-2 px-6 shadow-lg bg-[#e79b21] border-none hover:bg-[#d68a1d]">
                            <IconPlus className="w-4 h-4" />
                            <span className="font-bold uppercase text-[11px] tracking-widest">New Settlement</span>
                        </button>
                    ) : (
                        <button onClick={closeFormHandler} className="btn btn-outline-danger btn-sm flex items-center gap-2 px-6 border-2 font-black uppercase tracking-widest text-[11px]">
                            <IconX className="w-4 h-4" /> Close
                        </button>
                    )}
                </div>
            </div>



            {!selectedRecord && showForm && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="panel shadow-lg rounded-2xl">
                            <h5 className="font-black text-xs uppercase mb-5 border-b pb-2">Record Settlement</h5>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] font-bold uppercase opacity-50">Start Date</label><input type="date" name="startDate" className="form-input font-bold" value={formData.startDate} onChange={handleChange} required /></div>
                                    <div><label className="text-[10px] font-bold uppercase opacity-50">End Date</label><input type="date" name="endDate" className="form-input font-bold" value={formData.endDate} onChange={handleChange} required /></div>
                                </div>
                                <div><label className="text-[10px] font-bold uppercase opacity-50">Transport Vendor Name</label>
                                    <select name="vendorSelected" className="form-select font-bold text-sm" value={formData.vendorSelected} onChange={handleChange} required>
                                        <option value="">Select Vendor...</option>
                                        {allVendors.map(v => (
                                            <option key={`${v._id}|${v.type}`} value={`${v._id}|${v.type}|${v.type === 'TransportVendor' && v.companyName ? `${v.companyName} - ${v.name}` : v.name}`}>
                                                {v.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {alreadySettledWarning && (
                                    <div className="p-3 bg-warning/20 border-l-4 border-warning rounded-lg text-[10px] font-black text-warning-dark uppercase leading-tight">
                                        ⚠️ A settlement already exists within this period for this vendor.
                                    </div>
                                )}
                                <hr />
                                <div>
                                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Material Wise Rate Per Ton (₹)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {uniqueMaterials.length === 0 && <span className="text-xs italic opacity-50 my-2">Select date & vendor</span>}
                                        {uniqueMaterials.map(material => (
                                            <div key={material} className="p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-300 dark:border-dark-light/20">
                                                <div className="text-[10px] font-bold uppercase text-primary truncate" title={material}>{material}</div>
                                                <div className="text-[10px] opacity-60 mb-2">{tonsByMaterial[material].toFixed(2)} Tons</div>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input text-sm font-black border-primary/30 h-8"
                                                    value={materialRates[material] || ''}
                                                    onChange={(e) => setMaterialRates(prev => ({ ...prev, [material]: e.target.value }))}
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] opacity-40 mt-2">Overall Total: {totalTons.toFixed(2)} Tons</p>
                                </div>
                                <div><label className="text-[10px] font-bold uppercase opacity-50">Reference/Notes</label>
                                    <input type="text" name="referenceNumber" className="form-input text-xs mb-2" value={formData.referenceNumber} onChange={handleChange} placeholder="Bill #" />
                                    <textarea name="notes" className="form-textarea text-xs" rows={2} value={formData.notes} onChange={handleChange} placeholder="Note..."></textarea>
                                </div>
                                <hr />
                                <div className="p-4 bg-success/10 border-l-4 border-success rounded mt-4 mb-4 font-black">
                                    <div className="text-[10px] uppercase opacity-70 mb-1">Final Amount To Pay</div>
                                    <div className="flex items-center text-2xl text-success font-black">
                                        <span>₹</span>
                                        <input
                                            type="number"
                                            className="bg-transparent border-none outline-none text-success w-full ml-1"
                                            value={manualPaidAmount !== null ? manualPaidAmount : (netPayable > 0 ? Math.round(netPayable) : 0)}
                                            onChange={(e) => setManualPaidAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Payment Mode</label>
                                        <select className="form-select text-xs font-bold w-full" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                            <option value="Bank">Bank Transfer</option>
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Attach Receipt</label>
                                        <label className={`btn btn-sm ${billUrl ? 'btn-success' : 'btn-outline-primary'} w-full flex items-center justify-center gap-2 cursor-pointer h-[38px]`}>
                                            <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} accept="image/*,.pdf" />
                                            {isUploading ? (
                                                <span className="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent rounded-full"></span>
                                            ) : (
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M12 4L8 8M12 4L16 8M4 12V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            )}
                                            <span className="text-[10px]">{billUrl ? 'Receipt Attached (✓)' : isUploading ? 'Uploading...' : 'Upload File'}</span>
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary w-full py-4 mt-6 font-black uppercase tracking-widest text-xs" disabled={isFetchingSubData || grossTotal === 0 || (alreadySettledWarning && !editingId)}>
                                    <IconSave className="mr-2 w-4 h-4" />
                                    {editingId ? 'Update Settlement' : 'Save Settlement'}
                                </button>
                                {editingId && <button type="button" onClick={resetForm} className="btn btn-outline-danger w-full mt-2 text-xs">Cancel Edit</button>}
                            </form>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="panel bg-primary text-white p-6 rounded-2xl shadow-xl">
                                <h6 className="text-[10px] font-black uppercase opacity-60 mb-8">Payable Amount</h6>
                                <div className="text-3xl font-black">₹{grossTotal.toLocaleString()}</div>
                                <div className="text-xs mt-2 opacity-70">{totalTons.toFixed(2)} Tons Brought</div>
                            </div>
                            <div className="panel bg-white dark:bg-dark p-6 rounded-2xl shadow-xl border-l-4 border-danger flex flex-col justify-between">
                                <div>
                                    <h6 className="text-[10px] font-black uppercase opacity-60 mb-2 text-danger">Expenses/Deductions</h6>
                                    <div className="text-3xl font-black text-danger">₹{totalDeductionsCalc.toLocaleString()}</div>
                                </div>
                                <div className="mt-4 space-y-2 border-t border-danger/10 pt-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="opacity-40">Diesel (டீசல்)</span>
                                        <span className="text-danger">₹{dieselExpenses.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="opacity-40">Maintenance (பராமரிப்பு)</span>
                                        <span className="text-danger">₹{maintenanceExpenses.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="opacity-40">Daily Advance (முன்பணம்)</span>
                                        <span className="text-danger">₹{dailyAdvances.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="opacity-40">Spare Parts (விடிபாகங்கள்)</span>
                                        <span className="text-danger">₹{sparePartsExpenses.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="opacity-40">Police Expenses (போலீஸ்)</span>
                                        <span className="text-danger">₹{policeExpenses.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="opacity-40">Other Exp (இதர செலவு)</span>
                                        <span className="text-danger">₹{otherExpenses.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="panel bg-[#e79b21]/10 border-l-4 border-[#e79b21] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                                <div>
                                    <h6 className="text-[10px] font-black uppercase opacity-60 mb-2 text-[#e79b21]">Previous Pending Balance</h6>
                                    <div className={`text-3xl font-black ${previousBalance < 0 ? 'text-danger' : 'text-slate-800'}`}>
                                        ₹{previousBalance.toLocaleString()}
                                    </div>
                                    <p className="text-[9px] opacity-50 mt-1 uppercase">Carry forward from last settlements</p>
                                </div>
                            </div>
                        </div>

                        <div className="panel p-8 text-center bg-success/5 rounded-2xl border-2 border-dashed border-success/20">
                            <div className="text-[10px] font-black uppercase text-success mb-1">Final Net Payable</div>
                            <div className={`text-5xl font-black ${netPayable < 0 ? 'text-danger' : 'text-success'}`}>
                                ₹{Math.abs(netPayable).toLocaleString()}
                            </div>
                            <div className="text-[10px] opacity-50 mt-2 uppercase font-bold italic tracking-tighter">
                                Formula: (₹{grossTotal.toLocaleString()} Payable Amount + ₹{previousBalance.toLocaleString()} Prev Bal) - ₹{totalDeductionsCalc.toLocaleString()} Expenses/Deductions
                            </div>
                        </div>

                        <div className="panel rounded-2xl overflow-hidden shadow-lg border-none">
                            <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
                                <h6 className="text-[10px] font-black uppercase">Current Period Trip Log</h6>
                                <button type="button" onClick={() => exportToExcel(vendorTrips, `Trips_${formData.startDate}_to_${formData.endDate}`)} className="btn btn-sm btn-outline-success text-[9px] font-black uppercase py-1">
                                    Export XL
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="table-sm">
                                    <thead><tr className="text-[10px] uppercase font-bold text-dark/40"><th>Vehicle</th><th>Material</th><th>Route</th><th className="text-right">Tons</th></tr></thead>
                                    <tbody>
                                        {vendorTrips.length === 0 ? <tr><td colSpan={3} className="text-center py-8 opacity-20 italic">No trips found.</td></tr> :
                                            vendorTrips.map((t, idx) => (
                                                <tr key={idx}>
                                                    <td className="font-bold text-xs">{(t.vehicleId?.vehicleNumber || t.manualVehicleNumber || 'N/A').toUpperCase()}</td>
                                                    <td className="text-[10px] text-secondary font-semibold">{t.stoneTypeId?.name || 'General'}</td>
                                                    <td className="text-[10px]">{t.fromLocation} → {t.toLocation}</td>
                                                    <td className="text-right font-black text-xs">{t.loadQuantity || 0}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY LISTING - SHOW BY DEFAULT */}
            {!selectedRecord && !showForm && (
                <div className="panel shadow-xl rounded-3xl border-none animate__animated animate__fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h5 className="font-black text-xs uppercase tracking-widest text-[#e79b21] flex items-center gap-2">
                            <span className="w-10 h-1 bg-[#e79b21] rounded-full"></span>
                            Settlement History
                        </h5>
                        <div className="relative w-full md:w-80">
                            <input type="text" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search vendors or notes..." className="form-input ltr:pr-11 rtl:pl-11 rounded-full font-bold text-xs" />
                            <button type="button" className="absolute ltr:right-1 rtl:left-1 inset-y-1 my-auto w-9 h-9 flex items-center justify-center bg-primary/10 rounded-full text-primary">
                                <IconSearch className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="table-responsive rounded-2xl">
                        <table className="table-hover">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-white-dark tracking-widest opacity-60">
                                    <th className="py-4">Settled Date</th>
                                    <th className="py-4">Vendor Name</th>
                                    <th className="py-4">Period</th>
                                    <th className="py-4 text-center">Trips</th>
                                    <th className="py-4 text-center">Tons</th>
                                    <th className="py-4 text-right">Payable Amount</th>
                                    <th className="py-4 text-right">Expenses</th>
                                    <th className="py-4 text-right">Cash Paid</th>
                                    <th className="py-4">Reference</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={11} className="text-center py-20 uppercase font-black text-[10px] tracking-widest italic opacity-30">Loading database...</td></tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr><td colSpan={11} className="text-center py-20 uppercase font-black text-[10px] tracking-widest italic opacity-30">No settlement history found</td></tr>
                                ) : (
                                    filteredPayments.map((p) => (
                                        <tr key={p._id} className="group cursor-pointer hover:bg-gray-50/50 transition-all">
                                            <td className="text-xs font-bold">{new Date(p.date).toLocaleDateString()}</td>
                                            <td className="text-xs font-black uppercase text-dark">{p.vendorName}</td>
                                            <td className="text-[10px] font-bold text-slate-400">
                                                {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}
                                                <span className="mx-1 opacity-30">→</span>
                                                {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="text-center font-black text-xs text-slate-500">
                                                <span className="badge bg-primary/10 text-primary border-none text-[10px] font-black px-2">
                                                    {p.tripCount || parseSettlementNotes(p.notes || '', p).tripCount || 0}
                                                </span>
                                            </td>
                                            <td className="text-center font-black text-xs text-slate-500">{(p.totalTons || parseSettlementNotes(p.notes || '', p).totalTons || 0).toFixed(2)}</td>
                                            <td className="text-right text-primary font-black">₹{(p.invoiceAmount || 0).toLocaleString()}</td>
                                            <td className="text-right text-danger font-bold">₹{(p.deductionsAmount || 0).toLocaleString()}</td>
                                            <td className="text-right text-success font-black">₹{(p.paidAmount || 0).toLocaleString()}</td>
                                            <td className="text-[10px] opacity-70 italic max-w-sm leading-relaxed">{parseSettlementNotes(p.notes || '', p).userNotes || 'N/A'}</td>
                                            <td><span className="badge bg-success/20 text-success border-none text-[9px] font-black uppercase tracking-wider px-3 py-1">Settled ✓</span></td>
                                            <td>
                                                <div className="flex gap-2 items-center justify-center">
                                                    <button onClick={() => setSelectedRecord(p)} className="text-primary p-2 hover:bg-primary/10 rounded-full transition-all" title="View Detailed Report"><IconEye className="w-5 h-5" /></button>
                                                    {isOwner && <button onClick={() => setDeleteId(p._id)} className="text-danger p-2 hover:bg-danger/10 rounded-full transition-all"><IconTrashLines className="w-4.5 h-4.5" /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedRecord && (
                <div id="invoice-print-wrapper" className="panel shadow-xl rounded-2xl border-none animate__animated animate__fadeIn p-0 overflow-hidden bg-white">
                    {/* ACTION BAR - STAYS NON-PRINTABLE */}
                    <div className="flex justify-between items-center p-6 bg-gray-50 border-b print:hidden">
                        <button onClick={() => setSelectedRecord(null)} className="btn btn-outline-primary btn-sm rounded-full p-2 flex items-center gap-2">
                            <IconArrowLeft className="w-5 h-5" />
                            <span className="font-black uppercase text-[10px] pr-2">Back to List</span>
                        </button>
                    </div>

                    {/* 🖥️ DASHBOARD-STYLE DETAILS VIEW (NOT INVOICE STYLE) */}
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                            <div>
                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Settlement Summary</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="badge badge-outline-primary text-[10px] font-black uppercase">Voucher: SETTL-{selectedRecord._id?.slice(-6).toUpperCase()}</span>
                                    <span className="text-white-dark text-[10px] font-bold uppercase tracking-widest">• {new Date(selectedRecord.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedRecord(null)} className="btn btn-outline-danger btn-sm rounded-xl border-2 p-2 hover:bg-danger hover:text-white transition-all"><IconX className="w-4 h-4" /></button>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-2">Vendor Operations</div>
                                <div className="text-lg font-black text-[#e79b21] uppercase text-right leading-none">{selectedRecord.vendorName}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{selectedRecord.vendorType === 'TransportVendor' ? 'Transport Fleet Operations' : 'Equipment Supplier'}</div>
                            </div>
                        </div>

                        {/* 📊 DASHBOARD STATS (BLASTING STYLE) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {(() => {
                                const details = parseSettlementNotes(selectedRecord.notes || '', selectedRecord);
                                return (
                                    <>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">⚖️</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Tonnage</div>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">{details.totalTons.toFixed(2)} T</div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">💰</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Earning</div>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">₹{details.grossTotal.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">🔻</div>
                                                <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Deductions</div>
                                            </div>
                                            <div className="text-2xl font-black text-rose-600">₹{details.deductions.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm border-2 border-emerald-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">✅</div>
                                                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Net Payable</div>
                                            </div>
                                            <div className="text-2xl font-black text-emerald-600">₹{details.net.toLocaleString()}</div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* TRIP LOG & NOTES */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* TRIP TABLE */}
                            <div className="lg:col-span-2 space-y-4">
                                <h6 className="font-black text-xs uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                                    Verified Trip Entries
                                </h6>
                                <div className="table-responsive bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="table-hover w-full">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Vehicle #</th>
                                                <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-left">Material & Route</th>
                                                <th className="py-4 px-6 text-[9px] font-black uppercase text-slate-400 text-right">Qty (T)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {isFetchingDetailedTrips ? (
                                                <tr><td colSpan={3} className="py-12 text-center text-slate-400 font-bold animate-pulse">Fetching logs...</td></tr>
                                            ) : viewingTrips.length === 0 ? (
                                                <tr><td colSpan={3} className="py-12 text-center text-slate-300 italic text-[10px]">No trips found for this record</td></tr>
                                            ) : (
                                                viewingTrips.map((t, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-3 px-6 font-black text-xs text-slate-700">{(t.vehicleId?.vehicleNumber || t.manualVehicleNumber || 'N/A').toUpperCase()}</td>
                                                        <td className="py-3 px-6">
                                                            <div className="text-[11px] font-black text-slate-900">{t.stoneTypeId?.name || 'Standard Stone'}</div>
                                                            <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                                {t.fromLocation} <span className="opacity-30">→</span> {t.toLocation}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-6 text-right font-black text-xs text-primary">{(t.loadQuantity || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SIDEBAR INFO */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* DEDUCTION BREAKDOWN */}
                                <div className="panel bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                                    <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-200 pb-2">Deduction Details</h6>
                                    {(() => {
                                        const details = parseSettlementNotes(selectedRecord.notes || '', selectedRecord);
                                        return (
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Diesel', val: details.diesel, color: 'text-slate-800' },
                                                    { label: 'Maintenance', val: details.maint, color: 'text-slate-800' },
                                                    { label: 'Advances', val: details.adv, color: 'text-slate-800' },
                                                    { label: 'Spares', val: details.spares, color: 'text-slate-800' },
                                                    { label: 'Police', val: details.police, color: 'text-slate-800' },
                                                    { label: 'Other', val: details.other, color: 'text-slate-800' },
                                                ].map(d => (
                                                    <div key={d.label} className="flex justify-between items-center group">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{d.label}</span>
                                                        <span className={`font-black text-sm ${d.color}`}>₹ {Number(d.val || 0).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-rose-500 uppercase">Total Deducted</span>
                                                    <span className="font-black text-lg text-rose-600">₹ {details.deductions.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* NOTES BOX */}
                                <div className="panel bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                                    <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Financial Notes</h6>
                                    {(() => {
                                        const details = parseSettlementNotes(selectedRecord.notes || '', selectedRecord);
                                        return (
                                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic border-l-4 border-[#e79b21]/30 pl-4 py-1">
                                                {details.userNotes || 'No manual notes available for this settlement.'}
                                            </p>
                                        );
                                    })()}
                                </div>

                                {/* BANK INFO GHOST BOX */}
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Bank Remit (Ref)</div>
                                    <div className="text-[10px] font-bold text-slate-400 leading-tight">
                                        IDBI Bank (Kallandhiri Branch)<br />
                                        ACC: 120110200..059
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Record"
                message="Are you sure? This will also revert the settlement status of included trips."
            />
        </div>
    );
};

export default VendorPaymentManagement;
