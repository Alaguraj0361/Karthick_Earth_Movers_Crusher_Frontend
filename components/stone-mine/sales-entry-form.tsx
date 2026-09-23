'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import Link from 'next/link';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import IconSearch from '@/components/icon/icon-search';
import IconEye from '@/components/icon/icon-eye';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import { useToast } from '@/components/stone-mine/toast-notification';
import api from '@/utils/api';
import { canEditRecord } from '@/utils/permissions';
import * as XLSX from 'xlsx';
import IconDownload from '@/components/icon/icon-download';
import IconFileUpload from '@/components/icon/icon-file-upload';



const SalesEntryForm = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const role = currentUser?.role?.toLowerCase();
    const canSeeFinancials = role === 'owner' || role === 'manager' || role === 'accountant';
    const isOwner = role === 'owner';
    const isSupervisor = role === 'supervisor';

    const { showToast } = useToast();
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const getLocalNowISO = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        invoiceDateTime: getLocalNowISO(),
        invoiceDate: new Date().toISOString().split('T')[0],
        entryTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        customer: '',
        paymentType: 'Cash',
        gstPercentage: 0,
        dueDate: '',
        notes: '',
        fromLocation: 'Quarry',
        toLocation: '',
        receiptNumber: '',
        receiptFile: '',
        gstNumber: ''
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [tripIds, setTripIds] = useState<string[]>([]);
    const [items, setItems] = useState<any[]>([
        { item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }
    ]);
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterReceipt, setFilterReceipt] = useState('');
    const [filterGst, setFilterGst] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSales, setIsLoadingSales] = useState(true);


    const fetchSales = async () => {
        try {
            setIsLoadingSales(true);
            const res = await api.get('/sales');
            if (res.data.success) {
                const sorted = res.data.data.sort((a: any, b: any) => {
                    const dateA = new Date(a.invoiceDate).getTime();
                    const dateB = new Date(b.invoiceDate).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b._id || '').localeCompare(a._id || '');
                });
                setRecentSales(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingSales(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await api.get('/customers');
                if (res.data.success) setCustomers(res.data.data);
            } catch (error) { console.error('Error fetching customers:', error); }

            try {
                const res = await api.get('/products');
                if (res.data.success) setProducts(res.data.data || []);
            } catch (error) { console.error('Error fetching products:', error); }


        };
        fetchMasterData();
        fetchSales();
    }, []);

    const handleDateTimeChange = (e: any) => {
        const val = e.target.value;
        let d = '';
        let t = '';
        if (val) {
            const dt = new Date(val);
            d = val.split('T')[0];
            t = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        setFormData(prev => ({
            ...prev,
            invoiceDateTime: val,
            invoiceDate: d || prev.invoiceDate,
            entryTime: t || prev.entryTime
        }));
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset items if customer changes
        if (name === 'customer') {
            setItems([{ item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }]);
            setTripIds([]);
        }

        if (name === 'gstNumber' && value.length >= 3) {
            handleGstSearch(value);
        }

        if (name === 'customer') {
            const selected = customers.find(c => c._id === value);
            if (selected) {
                setFormData(prev => ({ ...prev, gstNumber: selected.gstNumber || '' }));
            }
        }
    };

    const handleGstSearch = async (gst: string) => {
        try {
            const res = await api.get(`/customers?search=${gst}`);
            if (res.data.success && res.data.data.length > 0) {
                const match = res.data.data.find((c: any) => c.gstNumber?.toLowerCase() === gst.toLowerCase()) || res.data.data[0];
                if (match) {
                    setFormData(prev => ({
                        ...prev,
                        customer: match._id,
                    }));
                }
            }
        } catch (error) {
            console.error('Error searching customer by GST:', error);
        }
    };

    const fetchTripSummary = async () => {
        if (!formData.customer) {
            showToast('Please select a Customer', 'error');
            return;
        }

        try {
            const res = await api.get(`/trips/customer-summary?customerId=${formData.customer}`);
            if (res.data.success) {
                const summary = res.data.data;
                if (summary.length === 0) {
                    showToast('No pending (non-billed) trips found for this customer', 'info');
                    return;
                }

                const newItems = summary.map((s: any) => {
                    const matched = products.find(p => p._id === s.stoneTypeId || p.name?.toLowerCase() === s.stoneTypeName?.toLowerCase());
                    return {
                        item: matched ? matched.name : s.stoneTypeName,
                        stoneType: matched ? matched._id : '',
                        quantity: s.totalQuantity,
                        unit: matched?.unit === 'MT' ? 'Tons' : (matched?.unit || s.unit || 'Tons'),
                        rate: matched?.baseRate || '',
                        amount: 0,
                        hsnCode: matched?.hsnCode || s.hsnCode || '',
                        gstPercentage: matched?.gstPercentage ?? s.gstPercentage ?? 5,
                        gstAmount: 0
                    };
                });

                const allTripIds = summary.flatMap((s: any) => s.tripIds);
                setItems(newItems);
                setTripIds(allTripIds);
                showToast(`✅ Found ${allTripIds.length} trips across ${summary.length} materials!`, 'success');
            }
        } catch (error: any) {
            console.error('Error fetching trip summary:', error);
            showToast(error.response?.data?.message || 'Error fetching trip summary', 'error');
        }
    };

    const handleToggleDeliveryStatus = async (sale: any) => {
        const newStatus = sale.deliveryStatus === 'completed' ? 'open' : 'completed';
        try {
            await api.patch(`/sales/${sale._id}/delivery-status`, { deliveryStatus: newStatus });
            showToast(`Sale marked as ${newStatus === 'completed' ? '✅ Completed' : '🔄 Reopened'}`, 'success');
            fetchSales();
        } catch (error) {
            console.error(error);
            showToast('Error updating delivery status', 'error');
        }
    };

    const handleItemChange = (index: number, e: any) => {
        const { name, value } = e.target;
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [name]: value };

        if (name === 'stoneType') {
            const selectedProduct = products.find(p => p._id === value);
            if (selectedProduct) {
                updatedItems[index].item = selectedProduct.name;
                updatedItems[index].hsnCode = selectedProduct.hsnCode || '';
                updatedItems[index].gstPercentage = selectedProduct.gstPercentage !== undefined ? selectedProduct.gstPercentage : 5;
                if (selectedProduct.baseRate) {
                    updatedItems[index].rate = selectedProduct.baseRate;
                }
                let unit = selectedProduct.unit || 'Tons';
                if (unit === 'Ton' || unit === 'MT') unit = 'Tons';
                if (unit === 'Unit') unit = 'Units';
                updatedItems[index].unit = unit;
            }
        }

        const qty = parseFloat(updatedItems[index].quantity) || 0;
        const rate = parseFloat(updatedItems[index].rate) || 0;
        const gstPct = parseFloat(updatedItems[index].gstPercentage) || 0;

        updatedItems[index].amount = qty * rate;
        updatedItems[index].gstAmount = (updatedItems[index].amount * gstPct) / 100;

        setItems(updatedItems);
    };

    const addItem = () => {
        setItems([...items, { item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const gstTotal = items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    const grandTotal = subtotal + gstTotal;

    const resetForm = () => {
        setEditId(null);
        setShowForm(false);
        setFormData({
            invoiceDateTime: getLocalNowISO(),
            invoiceDate: new Date().toISOString().split('T')[0],
            entryTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            customer: '',
            paymentType: 'Cash',
            gstPercentage: 0,
            dueDate: '',
            notes: '',
            fromLocation: 'Quarry',
            toLocation: '',
            receiptNumber: '',
            receiptFile: '',
            gstNumber: ''
        });
        setItems([{ item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }]);
        setTripIds([]);
    };

    const handleCreateNew = () => {
        setEditId(null);
        setFormData({
            invoiceDateTime: getLocalNowISO(),
            invoiceDate: new Date().toISOString().split('T')[0],
            entryTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            customer: '',
            paymentType: 'Cash',
            gstPercentage: 0,
            dueDate: '',
            notes: '',
            fromLocation: 'Quarry',
            toLocation: '',
            receiptNumber: '',
            receiptFile: '',
            gstNumber: ''
        });
        setItems([{ item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }]);
        setTripIds([]);
        setShowForm(true);
    };

    const handleEdit = async (saleId: string) => {
        try {
            const { data } = await api.get(`/sales/${saleId}`);
            if (data.success) {
                const sale = data.data;
                setEditId(sale._id);

                let dtVal = getLocalNowISO();
                if (sale.weighmentTime) {
                    const dt = new Date(sale.weighmentTime);
                    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
                    dtVal = dt.toISOString().slice(0, 16);
                } else if (sale.invoiceDate) {
                    const dStr = new Date(sale.invoiceDate).toISOString().split('T')[0];
                    dtVal = `${dStr}T12:00`;
                }

                setFormData({
                    invoiceDateTime: dtVal,
                    invoiceDate: sale.invoiceDate ? new Date(sale.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    entryTime: sale.entryTime || '',
                    customer: sale.customer?._id || '',
                    paymentType: sale.paymentType || 'Cash',
                    gstPercentage: sale.gstPercentage || 0,
                    dueDate: sale.dueDate ? new Date(sale.dueDate).toISOString().split('T')[0] : '',
                    notes: sale.notes || '',
                    fromLocation: sale.fromLocation || 'Quarry',
                    toLocation: sale.toLocation || '',
                    receiptNumber: sale.receiptNumber || '',
                    receiptFile: sale.receiptFile || '',
                    gstNumber: sale.customer?.gstNumber || ''
                });
                if (data.trips) {
                    setTripIds(data.trips.map((t: any) => t._id));
                } else {
                    setTripIds([]);
                }

                setItems(
                    sale.items?.map((item: any) => ({
                        item: item.item || '',
                        stoneType: item.productId?._id || item.productId || item.stoneType?._id || item.stoneType || '',
                        quantity: item.quantity || '',
                        unit: item.unit || 'Tons',
                        rate: item.rate || '',
                        amount: item.amount || 0,
                        hsnCode: item.hsnCode || '',
                        gstPercentage: item.gstPercentage !== undefined ? item.gstPercentage : (sale.gstPercentage || 0),
                        gstAmount: item.gstAmount || ((item.amount || 0) * (item.gstPercentage || sale.gstPercentage || 0)) / 100
                    })) || [{ item: '', stoneType: '', quantity: '', unit: 'Tons', rate: '', amount: 0, hsnCode: '', gstPercentage: 5, gstAmount: 0 }]
                );
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error(error);
            showToast('Error loading sale for editing', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const { data } = await api.delete(`/sales/${deleteId}`);
            if (data.success) {
                showToast('Sale deleted successfully!', 'success');
                if (editId === deleteId) resetForm();
                fetchSales();
            }
        } catch (error) {
            console.error(error);
            showToast('Error deleting sale', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            const payload = {
                ...formData,
                weighmentTime: formData.invoiceDateTime ? new Date(formData.invoiceDateTime) : new Date(),
                items: items.map(item => ({
                    item: item.item,
                    stoneType: item.stoneType || undefined,
                    productId: item.stoneType || undefined,
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit,
                    rate: parseFloat(item.rate) || 0,
                    hsnCode: item.hsnCode,
                    gstPercentage: parseFloat(item.gstPercentage) || 0,
                    gstAmount: item.gstAmount || 0
                })),
                subtotal,
                gstAmount: gstTotal,
                grandTotal,
                amountPaid: formData.paymentType === 'Cash' ? grandTotal : 0,
                tripIds,
            };

            if (editId) {
                const { data } = await api.put(`/sales/${editId}`, payload);
                if (data.success) {
                    showToast(`Sale updated! Invoice: ${data.data.invoiceNumber}`, 'success');
                    resetForm();
                    fetchSales();
                }
            } else {
                const { data } = await api.post('/sales', payload);
                if (data.success) {
                    showToast(`Sale recorded! Invoice: ${data.data.invoiceNumber}`, 'success');
                    resetForm();
                    fetchSales();
                }
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error saving sale', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const downloadTemplate = () => {
        const template = [
            {
                'Receipt Number': 'REC-12345',
                'Receipt File': '',
                'Invoice Date': new Date().toISOString().split('T')[0],
                'Customer Name': 'Example Customer',
                'Item': '20mm Blue Metal',
                'Quantity': 10,
                'Unit': 'Tons',
                'Rate': 550,
                'Payment Type': 'Cash',
                'GST Percentage': 5,
                'From Location': 'Quarry',
                'To Location': 'Site A',
                'Notes': 'Bulk load'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'SalesTemplate');
        XLSX.writeFile(wb, 'Sales_Bulk_Upload_Template.xlsx');
    };

    const handleFileUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                setIsUploading(true);
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                if (rawData.length === 0) {
                    showToast('The file is empty', 'error');
                    return;
                }

                // Map Excel headers to API keys with better date handling
                const salesData = rawData.map((row: any) => {
                    let invDate = row['Invoice Date'];
                    // Handle Excel serial dates if they occur
                    if (typeof invDate === 'number') {
                        invDate = new Date((invDate - (25567 + 1)) * 86400 * 1000).toISOString().split('T')[0];
                    }

                    return {
                        invoiceDate: invDate,
                        customerName: row['Customer Name'],
                        item: row['Item'],
                        quantity: row['Quantity'],
                        unit: row['Unit'],
                        rate: row['Rate'],
                        paymentType: row['Payment Type'],
                        gstPercentage: row['GST Percentage'],
                        fromLocation: row['From Location'],
                        toLocation: row['To Location'],
                        notes: row['Notes'],
                        receiptNumber: row['Receipt Number'],
                        receiptFile: row['Receipt File']
                    };
                });

                const res = await api.post('/sales/bulk', { salesData });
                if (res.data.success) {
                    showToast(`✅ ${res.data.message}`, 'success');
                    fetchSales();
                }
            } catch (error: any) {
                console.error(error);
                const msg = error.response?.data?.errors ? error.response.data.errors.join(', ') : (error.response?.data?.message || 'Error uploading file');
                showToast(msg, 'error');
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadExcel = () => {
        try {
            const filtered = recentSales.filter((s: any) => {
                const searchStr = search.toLowerCase();
                const cName = (s.customer?.name || s.contractor?.name || '').toLowerCase();
                const invNum = (s.invoiceNumber || '').toLowerCase();
                const rNum = (s.receiptNumber || '').toLowerCase();

                const matchesSearch = !search ||
                    cName.includes(searchStr) ||
                    invNum.includes(searchStr) ||
                    rNum.includes(searchStr);

                const matchesCustomer = !filterCustomer || cName.includes(filterCustomer.toLowerCase());

                const saleDate = s.invoiceDate ? new Date(s.invoiceDate).toISOString().split('T')[0] : '';
                const matchesStart = !filterStartDate || saleDate >= filterStartDate;
                const matchesEnd = !filterEndDate || saleDate <= filterEndDate;

                const matchesReceipt = !filterReceipt || rNum.includes(filterReceipt.toLowerCase());

                const matchesGst = !filterGst || (
                    filterGst === 'gst' ? (s.gstPercentage > 0) : (s.gstPercentage === 0 || !s.gstPercentage)
                );

                return matchesSearch && matchesCustomer && matchesStart && matchesEnd && matchesReceipt && matchesGst;
            });

            if (filtered.length === 0) return showToast('No data to export', 'error');

            const exportData = filtered.map((s: any) => ({
                'Invoice #': s.invoiceNumber,
                'Date': s.invoiceDate ? new Date(s.invoiceDate).toLocaleDateString('en-GB') : '',
                'Time': s.entryTime || (s.weighmentTime ? new Date(s.weighmentTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''),
                'Customer': s.customer?.name || s.contractor?.name || 'N/A',
                'Payment Mode': s.paymentType,
                'Items': s.items?.map((i: any) => `${i.item || (i.stoneType?.name)} (${i.quantity} ${i.unit})`).join(', '),
                'Subtotal': s.subtotal || 0,
                'GST Amount': s.gstAmount || 0,
                'Grand Total': s.grandTotal || 0,
                'Status': s.paymentStatus,
                'Receipt #': s.receiptNumber || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
            XLSX.writeFile(workbook, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast('Excel report downloaded!', 'success');
        } catch (error) {
            console.error('Download Error:', error);
            showToast('Failed to generate Excel report', 'error');
        }
    };

    const handleReceiptUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataFile = new FormData();
        formDataFile.append('bill', file);

        try {
            const { data } = await api.post('/upload', formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (data.success) {
                setFormData((prev) => ({ ...prev, receiptFile: data.filePath }));
                showToast('Receipt uploaded successfully!', 'success');
            }
        } catch (error) {
            console.error(error);
            showToast('Error uploading receipt', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Sale Entry Form — shown only when creating/editing */}
            {showForm && (
                <div className="panel animate__animated animate__fadeIn">
                    <div className="mb-8 flex items-center justify-between border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-5">
                        <div>
                            <h5 className="text-xl font-bold dark:text-white-light">
                                {editId ? '✏️ விற்பனை திருத்தம் (Edit Sale)' : '➕ புதிய விற்பனை (New Sale)'}
                            </h5>
                            <p className="text-white-dark text-xs mt-1">
                                {editId ? 'Modify existing sale record' : 'Record each sale with item details, quantity, and rate'}
                            </p>
                        </div>
                        <button className="btn btn-outline-danger btn-sm" onClick={resetForm}>
                            <IconX className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> Close
                        </button>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>

                        {/* Section 1: Invoice Details */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                                <IconEdit className="w-4 h-4" />
                                Invoice Details (விலைப்பட்டியல் விவரங்கள்)
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Date & Time (தேதி & நேரம்) *</label>
                                    <input 
                                        type="datetime-local" 
                                        name="invoiceDateTime" 
                                        className="form-input font-bold" 
                                        value={formData.invoiceDateTime} 
                                        onChange={handleDateTimeChange} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">GST Number (Search)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="gstNumber"
                                            className="form-input ltr:pr-10 rtl:pl-10 border-info"
                                            placeholder="Enter GST..."
                                            value={formData.gstNumber}
                                            onChange={handleChange}
                                        />
                                        <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-info" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block text-primary">
                                        Customer Name *
                                    </label>
                                    <select name="customer" className="form-select border-primary" value={formData.customer} onChange={handleChange} required>
                                        <option value="">Select Customer</option>
                                        {customers.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {formData.customer && (
                                        <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/10">
                                            {(() => {
                                                const selected = customers.find(c => c._id === formData.customer);
                                                if (selected) {
                                                    return (
                                                        <div className="text-[10px] space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-white-dark">Phone:</span>
                                                                <span className="font-bold">{(selected as any).phone || (selected as any).mobileNumber || 'N/A'}</span>
                                                            </div>
                                                            <div className="border-t border-primary/5 pt-1">
                                                                <span className="text-white-dark block mb-1">Address:</span>
                                                                <span className="font-semibold block break-words whitespace-pre-wrap">{selected.address || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                {canSeeFinancials && (
                                    <div>
                                        <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Payment Type *</label>
                                        <select name="paymentType" className="form-select border-warning" value={formData.paymentType} onChange={handleChange}>
                                            <option value="Cash">💵 Cash Sale (பணம்)</option>
                                            <option value="Credit">📒 Credit Sale (கடன்)</option>
                                        </select>
                                    </div>
                                )}
                                {formData.customer && (
                                    <div className="flex flex-col justify-end">
                                        <button 
                                            type="button" 
                                            className="btn btn-primary w-full shadow-lg shadow-primary/20 rounded-lg flex items-center justify-center gap-2 h-[42px] font-black active:scale-95 transition-all"
                                            onClick={fetchTripSummary}
                                        >
                                            <IconSearch className="w-4 h-4" /> 
                                            FETCH & CALCULATE TONS
                                        </button>
                                        {tripIds.length > 0 && (
                                            <div className="mt-2 bg-success/10 p-2 rounded-lg border border-success/20 flex items-center justify-between">
                                                <div className="text-[9px] text-success font-black uppercase tracking-widest leading-none">Trips Linked</div>
                                                <div className="text-xs font-black text-success ltr:ml-2 rtl:mr-2">#{tripIds.length} Trips</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {formData.paymentType === 'Credit' && (
                                    <div>
                                        <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Due Date</label>
                                        <input type="date" name="dueDate" className="form-input border-warning" value={formData.dueDate} onChange={handleChange} />
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Receipt Number</label>
                                    <input type="text" name="receiptNumber" className="form-input" placeholder="Enter receipt #" value={formData.receiptNumber} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Receipt Upload</label>
                                    <div className="flex items-center gap-2">
                                        <input type="file" className="form-input p-1 h-10 flex-1" accept=".jpg,.jpeg,.png,.pdf" onChange={handleReceiptUpload} />
                                        {formData.receiptFile && (
                                            <a href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}${formData.receiptFile}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info p-2" title="View Uploaded File">
                                                <IconEye className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Item Details */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                                    <IconPlus className="w-4 h-4" />
                                    Item Details
                                </div>
                                {tripIds.length === 0 && (
                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addItem}>
                                        <IconPlus className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> Add Item
                                    </button>
                                )}
                            </div>

                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Item (Material)</th>
                                            <th>HSN</th>
                                            <th>Quantity</th>
                                            <th>Unit</th>
                                            {canSeeFinancials && <th>Rate (₹)</th>}
                                            {canSeeFinancials && <th>Tax %</th>}
                                            {canSeeFinancials && <th className="!text-right">Amount (₹)</th>}
                                            <th className="!text-center w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <select name="stoneType" className="form-select text-sm font-semibold" value={item.stoneType} onChange={(e) => handleItemChange(idx, e)}>
                                                        <option value="">Select Product (பொருள் தேர்வு)</option>
                                                        {products.map(p => (
                                                            <option key={p._id} value={p._id}>
                                                                {p.name} {p.category ? `(${p.category})` : ''} {p.baseRate ? `- ₹${p.baseRate}/${p.unit || 'MT'}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input type="text" name="hsnCode" className="form-input text-sm w-24" placeholder="HSN" value={item.hsnCode} onChange={(e) => handleItemChange(idx, e)} />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="quantity"
                                                        className={`form-input text-sm w-28 ${tripIds.length > 0 ? 'bg-success/5 text-success font-bold cursor-not-allowed' : ''}`}
                                                        placeholder="0"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(idx, e)}
                                                        required
                                                        readOnly={tripIds.length > 0}
                                                    />
                                                </td>
                                                <td>
                                                    <select name="unit" className="form-select text-sm w-24" value={item.unit} onChange={(e) => handleItemChange(idx, e)}>
                                                        <option value="Tons">Tons</option>
                                                        <option value="Units">Units</option>
                                                        <option value="Kg">Kg</option>
                                                        <option value="CFT">CFT</option>
                                                        <option value="Loads">Loads</option>
                                                    </select>
                                                </td>
                                                {canSeeFinancials && (
                                                    <td>
                                                        <input type="number" name="rate" className="form-input text-sm w-28 border-primary/20" placeholder="0.00" value={item.rate} onChange={(e) => handleItemChange(idx, e)} required={canSeeFinancials} />
                                                    </td>
                                                )}
                                                {canSeeFinancials && (
                                                    <td>
                                                        <select name="gstPercentage" className="form-select text-sm w-24" value={item.gstPercentage} onChange={(e) => handleItemChange(idx, e)}>
                                                            <option value="0">0%</option>
                                                            <option value="5">5%</option>
                                                            <option value="12">12%</option>
                                                            <option value="18">18%</option>
                                                            <option value="28">28%</option>
                                                        </select>
                                                    </td>
                                                )}
                                                {canSeeFinancials && (
                                                    <td className="!text-right font-bold text-primary text-lg">
                                                        ₹{item.amount.toLocaleString()}
                                                    </td>
                                                )}
                                                <td className="!text-center">
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 3: Location Details */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                                <IconEdit className="w-4 h-4" />
                                Location Details (இட விவரங்கள்)
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">From Location</label>
                                    <input type="text" name="fromLocation" className="form-input font-bold text-primary" value={formData.fromLocation} onChange={handleChange} placeholder="Quarry" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">To Location (Destination)</label>
                                    <input type="text" name="toLocation" className="form-input" value={formData.toLocation} onChange={handleChange} placeholder="Enter destination..." />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: GST & Totals */}
                        {canSeeFinancials && (
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider border-b border-primary/10 pb-2">
                                    <IconEdit className="w-4 h-4" />
                                    GST & Totals
                                </div>
                                    <div className="bg-dark-light/5 dark:bg-dark p-6 rounded-xl space-y-6">
                                        {/* Material Subtotal Details */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-white-dark uppercase tracking-widest border-b border-primary/10 pb-2">
                                                <span>Material Base Values</span>
                                                <span>Amount</span>
                                            </div>
                                            <div className="space-y-2">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className="text-white-dark font-medium">
                                                            {idx + 1}. {item.item || 'Select Material'} 
                                                            <span className="text-[11px] ml-2 opacity-60 italic">({item.quantity} × ₹{item.rate})</span>
                                                        </span>
                                                        <span className="font-bold">₹{item.amount?.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-dashed border-primary/20 bg-primary/5 p-3 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-primary tracking-wider">Total Net Value (Subtotal):</span>
                                                <span className="font-black text-primary text-xl">₹{subtotal.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Material Tax Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-white-dark uppercase tracking-widest border-b border-primary/10 pb-2">
                                                <span>Tax Identification</span>
                                                <span>GST Amount</span>
                                            </div>
                                            <div className="space-y-2">
                                                {items.map((item, idx) => (
                                                    item.gstAmount > 0 && (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <span className="text-white-dark font-medium lowercase">
                                                                {idx + 1}. {item.item || 'Item'} (gst {item.gstPercentage}%)
                                                            </span>
                                                            <span className="font-bold text-warning-dark">₹{item.gstAmount?.toLocaleString()}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-dashed border-primary/20 bg-warning/5 p-3 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-warning-dark tracking-wider">Total GST:</span>
                                                <span className="font-black text-warning-dark text-xl">₹{gstTotal.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Grand Total - The Bottom Line */}
                                        <div className="flex justify-between items-center p-5 bg-primary/10 rounded-xl border-2 border-primary/20 shadow-inner">
                                            <div className="flex flex-col">
                                                <span className="font-black text-primary text-2xl uppercase tracking-tighter leading-none">Grand Total</span>
                                                <span className="text-[10px] text-white-dark mt-1 font-bold italic">
                                                    Net Value + All Applied Taxes
                                                </span>
                                            </div>
                                            <span className="font-black text-primary text-4xl ltr:text-right rtl:text-left drop-shadow-sm">₹{grandTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-bold text-white-dark uppercase mb-2 block">குறிப்பு (Notes)</label>
                            <textarea name="notes" className="form-textarea" rows={2} placeholder="Any additional notes..." value={formData.notes} onChange={handleChange}></textarea>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-8 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-danger px-8" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-10 shadow-lg shadow-primary/20" disabled={isSaving}>
                                {isSaving ? (
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 ltr:mr-2 rtl:ml-2 inline-block"></span>
                                ) : (
                                    <IconSave className="ltr:mr-2 rtl:ml-2" />
                                )}
                                {isSaving ? 'Saving...' : editId ? 'Update Sale' : 'Save Sale'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sales Table — hidden when form is open */}
            {!showForm && (
                <div className="panel">
                    <div className="flex flex-col gap-5 mb-5">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <h5 className="text-lg font-bold dark:text-white-light whitespace-nowrap">விற்பனை பட்டியல் (Sales List)</h5>
                            <div className="flex items-center gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                                {isOwner && (
                                    <>
                                        <button className="btn btn-outline-success whitespace-nowrap" onClick={handleDownloadExcel}>
                                            <IconDownload className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                            Download XL
                                        </button>
                                        <button className="btn btn-info whitespace-nowrap" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                            <IconFileUpload className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                            {isUploading ? 'Uploading...' : 'Bulk Upload'}
                                        </button>
                                    </>
                                )}
                                <button className="btn btn-primary shadow-lg shadow-primary/20 whitespace-nowrap" onClick={handleCreateNew}>
                                    <IconPlus className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    Create New Sale
                                </button>

                            </div>
                        </div>

                        {/* Filter Panel */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-primary/5 p-4 rounded-xl">
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">General Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Invoice #..."
                                        className="form-input ltr:pr-10 rtl:pl-10 h-10"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <IconSearch className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Filter Customer</label>
                                <select className="form-select h-10" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
                                    <option value="">All Customers</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Start Date</label>
                                <input type="date" className="form-input h-10" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">End Date</label>
                                <input type="date" className="form-input h-10" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Receipt #</label>
                                <input
                                    type="text"
                                    placeholder="Receipt #..."
                                    className="form-input h-10"
                                    value={filterReceipt}
                                    onChange={(e) => setFilterReceipt(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase mb-1 block">Billing Type</label>
                                <select className="form-select h-10" value={filterGst} onChange={(e) => setFilterGst(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="gst">📄 GST Account</option>
                                    <option value="normal">📄 Normal (0%)</option>
                                </select>
                            </div>
                        </div>
                    </div>
<div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Invoice #</th>
                                    <th>Date & Time</th>
                                    <th>Customer</th>
                                    <th>Location</th>
                                    <th>Items</th>
                                    {canSeeFinancials && (
                                        <>
                                            <th>Payment Type</th>
                                            <th className="!text-right">Subtotal</th>
                                            <th className="!text-right">GST</th>
                                            <th className="!text-right">Grand Total</th>
                                        </>
                                    )}
                                    <th className="!text-center">Status</th>
                                    <th className="!text-center">Receipt</th>
                                    <th className="!text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingSales ? (
                                    <tr><td colSpan={11} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-3 text-white-dark">
                                            <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-8 h-8 inline-block"></span>
                                            <span className="text-sm font-semibold">Loading sales records...</span>
                                        </div>
                                    </td></tr>
                                ) : (() => {
                                    const filtered = recentSales.filter(s => {
                                        const matchesSearch = !search ||
                                            s.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
                                            (s.customer?.name || s.contractor?.name || '').toLowerCase().includes(search.toLowerCase());

                                        const matchesCustomer = !filterCustomer ||
                                            (s.customer?.name === filterCustomer || s.contractor?.name === filterCustomer);

                                        const saleDate = s.invoiceDate ? new Date(s.invoiceDate).toISOString().split('T')[0] : '';
                                        const matchesStart = !filterStartDate || saleDate >= filterStartDate;
                                        const matchesEnd = !filterEndDate || saleDate <= filterEndDate;

                                        const matchesReceipt = !filterReceipt ||
                                            s.receiptNumber?.toLowerCase().includes(filterReceipt.toLowerCase());

                                        const matchesGst = !filterGst || (
                                            filterGst === 'gst' ? (s.gstPercentage > 0) : (s.gstPercentage === 0 || !s.gstPercentage)
                                        );

                                        return matchesSearch && matchesCustomer && matchesStart && matchesEnd && matchesReceipt && matchesGst;
                                    });

                                    if (filtered.length === 0) {
                                        return <tr><td colSpan={11} className="text-center py-6 text-white-dark">No sales records found</td></tr>;
                                    }

                                    return filtered.map((sale, idx) => (
                                        <tr key={sale._id} className={editId === sale._id ? 'bg-primary/5' : ''}>
                                            <td>{idx + 1}</td>
                                            <td className="font-bold">
                                                <div className="flex flex-col gap-1">
                                                    {(sale.grandTotal || 0) > 0 ? (
                                                        <Link href={`/sales-billing/invoices?id=${sale._id}`} target="_blank" className="text-primary hover:underline">
                                                            {sale.invoiceNumber}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-white-dark/50 cursor-not-allowed" title="Cannot generate invoice — total is ₹0">
                                                            {sale.invoiceNumber}
                                                        </span>
                                                    )}
                                                    <Link href={`/sales-billing/trip-checklist?id=${sale._id}`} target="_blank" className="badge bg-secondary/10 text-secondary hover:underline hover:bg-secondary hover:text-white transition-all text-[9px] w-max">
                                                        Trip Checklist
                                                    </Link>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                                                    {sale.invoiceDate ? new Date(sale.invoiceDate).toLocaleDateString('en-GB') : '—'}
                                                </div>
                                                <div className="text-[11px] text-primary font-mono font-bold">
                                                    {sale.entryTime || (sale.weighmentTime ? new Date(sale.weighmentTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '')}
                                                </div>
                                            </td>
                                            <td className="font-semibold">{sale.customer?.name || sale.contractor?.name || '—'}</td>
                                            <td>
                                                {sale.toLocation ? (
                                                    <span className="text-[11px] font-bold text-primary">{sale.toLocation}</span>
                                                ) : (
                                                    <span className="text-white-dark text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-dark/10 text-dark dark:bg-dark-light/10 dark:text-white-dark">
                                                    {sale.items?.length || 0} items
                                                </span>
                                            </td>
                                            {canSeeFinancials && (
                                                <>
                                                    <td>
                                                        <span className={`badge ${sale.paymentType === 'Cash' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'} text-[10px]`}>
                                                            {sale.paymentType === 'Cash' ? '💵 Cash' : '📒 Credit'}
                                                        </span>
                                                    </td>
                                                    <td className="!text-right font-medium text-white-dark whitespace-nowrap">
                                                        ₹{(sale.subtotal || 0).toLocaleString()}
                                                    </td>
                                                    <td className="!text-right font-medium text-success whitespace-nowrap">
                                                        ₹{(sale.gstAmount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="!text-right font-black text-primary whitespace-nowrap">
                                                        ₹{(sale.grandTotal || 0).toLocaleString()}
                                                    </td>
                                                </>
                                            )}
                                            <td className="!text-center">
                                                <span className={`badge ${sale.paymentStatus === 'Paid' ? 'bg-success/10 text-success'
                                                    : sale.paymentStatus === 'Partial' ? 'bg-warning/10 text-warning'
                                                        : 'bg-danger/10 text-danger'
                                                    }`}>
                                                    {sale.paymentStatus}
                                                </span>
                                            </td>

                                            <td className="!text-center">
                                                {sale.receiptNumber && <div className="text-[10px] font-bold text-white-dark mb-1">{sale.receiptNumber}</div>}
                                                {sale.receiptFile ? (
                                                    <a
                                                        href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}${sale.receiptFile}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="badge bg-info/10 text-info hover:bg-info hover:text-white transition-colors"
                                                    >
                                                        View File
                                                    </a>
                                                ) : (
                                                    <span className="text-white-dark/30">—</span>
                                                )}
                                            </td>
                                            <td className="!text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {canEditRecord(currentUser, sale.createdAt || sale.invoiceDate) ? (
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleEdit(sale._id)}
                                                            title="Edit Sale"
                                                        >
                                                            <IconEdit className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-white-dark italic">Locked</span>
                                                    )}
                                                    <Link
                                                        href={`/sales-billing/sales-entry/details?id=${sale._id}`}
                                                        className="btn btn-sm btn-outline-info"
                                                        title="View Sales Details"
                                                    >
                                                        <IconEye className="w-4 h-4" />
                                                    </Link>
                                                    {isOwner && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => setDeleteId(sale._id)}
                                                            title="Delete Sale"
                                                        >
                                                            <IconTrash className="w-4 h-4" />
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
                </div>
            )
            }

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                show={!!deleteId}
                title="Delete Sale"
                message="Are you sure you want to delete this sale? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

export default SalesEntryForm;
