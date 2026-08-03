'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import Link from 'next/link';
import api from '@/utils/api';
import { canEditRecord } from '@/utils/permissions';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import IconPlus from '@/components/icon/icon-plus';
import IconSave from '@/components/icon/icon-save';
import IconSearch from '@/components/icon/icon-search';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconWheel from '@/components/icon/icon-wheel';
import IconEye from '@/components/icon/icon-eye';
import IconArrowLeft from '@/components/icon/icon-arrow-left';

const TransportVendorManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const canSeeFinancials = currentUser?.role?.toLowerCase() !== 'supervisor';

    const { showToast } = useToast();
    const [vendors, setVendors] = useState<any[]>([]);
    const [balances, setBalances] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [viewVendor, setViewVendor] = useState<any>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const initialFormState = {
        name: '',
        companyName: '',
        mobileNumber: '',
        alternateNumber: '',
        address: '',
        gstNumber: '',
        panNumber: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        vehicles: [] as any[],
        paymentMode: 'Bank',
        creditTerms: 'Per Trip',
        advancePaid: '0',
        outstandingBalance: '0',
        notes: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transRes, balRes] = await Promise.all([
                api.get('/vendors/transport'),
                api.get('/vendors/outstanding')
            ]);
            if (transRes.data.success) setVendors(transRes.data.data);
            const balMap: any = {};
            if (balRes.data.success) {
                balRes.data.data.forEach((b: any) => {
                    if (b.vendorType === 'TransportVendor') balMap[b.vendorId] = b.balance;
                });
            }
            setBalances(balMap);
        } catch (error) {
            console.error(error);
            showToast('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                vehicles: formData.vehicles,
                advancePaid: Number(formData.advancePaid),
                outstandingBalance: Number(formData.outstandingBalance)
            };
            if (editId) {
                await api.put(`/vendors/transport/${editId}`, payload);
                showToast('Transport vendor updated successfully!', 'success');
            } else {
                await api.post('/vendors/transport', payload);
                showToast('Transport vendor registered successfully!', 'success');
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error saving transport vendor', 'error');
        }
    };

    const handleEdit = (vendor: any) => {
        setFormData({
            name: vendor.name,
            companyName: vendor.companyName || '',
            mobileNumber: vendor.mobileNumber,
            alternateNumber: vendor.alternateNumber || '',
            address: vendor.address || '',
            gstNumber: vendor.gstNumber || '',
            panNumber: vendor.panNumber || '',
            bankName: vendor.bankName || '',
            accountNumber: vendor.accountNumber || '',
            ifscCode: vendor.ifscCode || '',
            vehicles: vendor.vehicles && vendor.vehicles.length > 0 ? vendor.vehicles.map((v: any) => ({
                vehicleType: v.vehicleType || 'Lorry',
                vehicleName: v.vehicleName || '',
                vehicleNumber: v.vehicleNumber || '',
                capacity: v.capacity || '10 Ton',
                ratePerTrip: v.ratePerTrip?.toString() || '0',
                padiKasu: v.padiKasu?.toString() || '0',
                driverName: v.driverName || '',
                driverMobile: v.driverMobile || '',
                driverLicenseNumber: v.driverLicenseNumber || '',
                insuranceNumber: v.insuranceNumber || '',
                insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : '',
                fcExpiry: v.fcExpiry ? v.fcExpiry.split('T')[0] : '',
                permitNumber: v.permitNumber || '',
                permitExpiry: v.permitExpiry ? v.permitExpiry.split('T')[0] : ''
            })) : [],
            paymentMode: vendor.paymentMode || 'Bank',
            creditTerms: vendor.creditTerms || 'Per Trip',
            advancePaid: vendor.advancePaid?.toString() || '0',
            outstandingBalance: vendor.outstandingBalance?.toString() || '0',
            notes: vendor.notes || ''
        });
        setEditId(vendor._id);
        setViewVendor(null);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditId(null);
        setShowForm(false);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/vendors/transport/${deleteId}`);
            showToast('Vendor deleted successfully!', 'success');
            setDeleteId(null);
            setViewVendor(null);
            fetchData();
        } catch (error) {
            showToast('Error deleting vendor', 'error');
        }
    };



    const filteredVendors = vendors.filter((v) =>
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.mobileNumber?.includes(searchQuery)
    );

    const isExpired = (d: string) => !!d && new Date(d) < new Date();
    const isExpiringSoon = (d: string) => {
        if (!d) return false;
        const days = Math.ceil((new Date(d).getTime() - new Date().getTime()) / 86400000);
        return days <= 30 && days >= 0;
    };
    const expiryBadge = (d: string) => {
        if (!d) return null;
        if (isExpired(d)) return <span className="badge bg-danger/10 text-danger text-[9px] ml-1">EXPIRED</span>;
        if (isExpiringSoon(d)) return <span className="badge bg-warning/10 text-warning text-[9px] ml-1">SOON</span>;
        return null;
    };

    // ─── VENDOR DETAIL VIEW ───────────────────────────────────────────────
    if (viewVendor) {
        return (
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setViewVendor(null)} className="btn btn-outline-primary btn-sm w-9 h-9 p-0 flex items-center justify-center">
                        <IconArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white-light">{viewVendor.name}</h2>
                        {viewVendor.companyName && <p className="text-info text-xs font-bold">{viewVendor.companyName}</p>}
                    </div>
                    <div className="ml-auto flex gap-2">
                        <button onClick={() => handleEdit(viewVendor)} className="btn btn-outline-info btn-sm">
                            <IconEdit className="w-4 h-4 mr-1" /> Edit
                        </button>
                        {isOwner && (
                            <button onClick={() => setDeleteId(viewVendor._id)} className="btn btn-outline-danger btn-sm">
                                <IconTrashLines className="w-4 h-4 mr-1" /> Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="panel">
                        <h6 className="font-bold text-primary mb-3 flex items-center gap-2">
                            <span className="bg-primary text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">1</span>
                            Basic Details
                        </h6>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-white-dark">Mobile</span><span className="font-bold">{viewVendor.mobileNumber}</span></div>
                            {viewVendor.alternateNumber && <div className="flex justify-between"><span className="text-white-dark">Alt. Mobile</span><span className="font-bold">{viewVendor.alternateNumber}</span></div>}
                            {viewVendor.address && <div className="flex justify-between"><span className="text-white-dark">Address</span><span className="font-bold text-right max-w-[160px]">{viewVendor.address}</span></div>}
                            {viewVendor.gstNumber && <div className="flex justify-between"><span className="text-white-dark">GST</span><span className="font-bold uppercase">{viewVendor.gstNumber}</span></div>}
                            {viewVendor.panNumber && <div className="flex justify-between"><span className="text-white-dark">PAN</span><span className="font-bold uppercase">{viewVendor.panNumber}</span></div>}
                        </div>
                    </div>

                    <div className="panel">
                        <h6 className="font-bold text-success mb-3 flex items-center gap-2">
                            <span className="bg-success text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">2</span>
                            Bank Details
                        </h6>
                        {viewVendor.bankName ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-white-dark">Bank</span><span className="font-bold">{viewVendor.bankName}</span></div>
                                <div className="flex justify-between"><span className="text-white-dark">Account No.</span><span className="font-bold font-mono">{viewVendor.accountNumber}</span></div>
                                <div className="flex justify-between"><span className="text-white-dark">IFSC</span><span className="font-bold uppercase">{viewVendor.ifscCode}</span></div>
                            </div>
                        ) : (
                            <p className="text-white-dark text-xs italic">No bank details entered</p>
                        )}
                    </div>

                    <div className="panel">
                        <h6 className="font-bold text-warning mb-3 flex items-center gap-2">
                            <span className="bg-warning text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">3</span>
                            Payment Setup
                        </h6>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-white-dark">Mode</span><span className="font-bold">{viewVendor.paymentMode}</span></div>
                            <div className="flex justify-between"><span className="text-white-dark">Terms</span><span className="font-bold">{viewVendor.creditTerms}</span></div>
                            {canSeeFinancials && (
                                <>
                                    <div className="flex justify-between"><span className="text-white-dark">Advance Paid</span><span className="font-bold text-success">₹{viewVendor.advancePaid?.toLocaleString() || 0}</span></div>
                                    <div className="flex justify-between pt-2 border-t border-danger/10"><span className="text-white-dark text-danger font-bold">Opening Balance</span><span className="font-black text-danger">₹{viewVendor.outstandingBalance?.toLocaleString() || 0}</span></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <DeleteConfirmModal show={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete Transport Vendor" message="Are you sure you want to delete this vendor?" />
            </div>
        );
    }

    // ─── FORM VIEW ────────────────────────────────────────────────────────
    if (showForm) {
        return (
            <div className="panel animate__animated animate__fadeIn">
                <div className="flex items-center justify-between mb-5 border-b pb-4 dark:border-[#1b2e4b]">
                    <h5 className="font-bold text-lg">{editId ? 'Edit Transport Vendor' : 'Register New Transport Vendor'}</h5>
                    <button className="text-white-dark hover:text-danger" onClick={resetForm}>✕ Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1: Basic Details */}
                    <div>
                        <h6 className="text-primary font-bold mb-4 flex items-center">
                            <span className="bg-primary text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">1</span>
                            Basic Details (அடிப்படை தகவல்)
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="text-sm font-bold">Vendor / Owner Name *</label>
                                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required placeholder="Owner Name" />
                            </div>
                            <div>
                                <label className="text-sm font-bold">Company Name (If Any)</label>
                                <input type="text" name="companyName" className="form-input" value={formData.companyName} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm font-bold">Mobile Number *</label>
                                <input type="text" name="mobileNumber" className="form-input" value={formData.mobileNumber} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-sm font-bold">Alternate Number</label>
                                <input type="text" name="alternateNumber" className="form-input" value={formData.alternateNumber} onChange={handleChange} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-bold">Address</label>
                                <input type="text" name="address" className="form-input" value={formData.address} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm font-bold">GST Number</label>
                                <input type="text" name="gstNumber" className="form-input uppercase" value={formData.gstNumber} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm font-bold">PAN Number</label>
                                <input type="text" name="panNumber" className="form-input uppercase" value={formData.panNumber} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Bank Details */}
                    <div className="pt-4 border-t dark:border-[#1b2e4b]">
                        <h6 className="text-success font-bold mb-4 flex items-center">
                            <span className="bg-success text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">2</span>
                            Bank Details (வங்கி தகவல்)
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="text-sm font-bold">Bank Name</label>
                                <input type="text" name="bankName" className="form-input" value={formData.bankName} onChange={handleChange} placeholder="e.g. SBI, IOB" />
                            </div>
                            <div>
                                <label className="text-sm font-bold">Account Number</label>
                                <input type="text" name="accountNumber" className="form-input font-mono" value={formData.accountNumber} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm font-bold">IFSC Code</label>
                                <input type="text" name="ifscCode" className="form-input uppercase" value={formData.ifscCode} onChange={handleChange} />
                            </div>
                        </div>
                    </div>



                    {/* Section 4: Payment Details */}
                    <div className="pt-4 border-t dark:border-[#1b2e4b]">
                        <h6 className="text-warning font-bold mb-4 flex items-center">
                            <span className="bg-warning text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">4</span>
                            Payment Details (கட்டணம் தகவல்)
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div>
                                <label className="text-sm font-bold">Payment Mode</label>
                                <select name="paymentMode" className="form-select" value={formData.paymentMode} onChange={handleChange}>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank">Bank</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold">Credit Terms</label>
                                <select name="creditTerms" className="form-select" value={formData.creditTerms} onChange={handleChange}>
                                    <option value="Per Trip">Per Trip</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="15 days">15 days</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>
                            {canSeeFinancials && (
                                <>
                                    <div>
                                        <label className="text-sm font-bold">Advance Paid (₹)</label>
                                        <input type="number" name="advancePaid" className="form-input" value={formData.advancePaid} onChange={handleChange} />
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-danger">Opening Balance (₹)</label>
                                        <input type="number" name="outstandingBalance" className="form-input font-bold border-danger/20 text-danger" value={formData.outstandingBalance} onChange={handleChange} />
                                    </div>
                                </>
                            )}
                            <div className="md:col-span-3">
                                <label className="text-sm font-bold">Notes / Remarks</label>
                                <input type="text" name="notes" className="form-input" value={formData.notes} onChange={handleChange} placeholder="Any special notes..." />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-5 gap-3 border-t dark:border-[#1b2e4b]">
                        <button type="button" className="btn btn-outline-danger" onClick={resetForm}>Cancel</button>
                        <button type="submit" className="btn btn-primary px-10">
                            <IconSave className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            {editId ? 'Update Vendor' : 'Save Transport Vendor'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ─── LIST VIEW ────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">Transport Vendors (போக்குவரத்து ஒப்பந்ததாரர்கள்)</h2>
                    <p className="text-white-dark text-sm mt-1">Manage transport fleet partners and payment balances.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn btn-primary shadow-lg" onClick={() => setShowForm(true)}>
                        <IconPlus className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        Add New Vendor
                    </button>
                </div>
            </div>

            <div className="panel border-t-4 border-primary">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <h5 className="font-bold text-lg dark:text-white-light">Registered Vendors <span className="text-white-dark text-sm font-normal ml-2">· Click a row to view full details</span></h5>
                    <div className="relative w-full max-w-xs">
                        <input type="text" placeholder="Search by name, company..." className="form-input ltr:pr-11 rtl:pl-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <IconSearch className="w-5 h-5 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark" />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Vendor Info</th>
                                <th>Vehicle History</th>
                                {canSeeFinancials && <th className="!text-right text-danger">Outstanding (₹)</th>}
                                <th className="!text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                            ) : filteredVendors.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8">No vendors found.</td></tr>
                            ) : (
                                filteredVendors.map((v) => (
                                    <tr key={v._id} className="cursor-pointer" onClick={() => setViewVendor(v)}>
                                        <td>
                                            <div className="font-bold text-primary">{v.name}</div>
                                            <div className="text-xs text-white-dark">{v.mobileNumber}</div>
                                            {v.companyName && <div className="text-xs text-info italic">{v.companyName}</div>}
                                        </td>

                                        <td>
                                            <div className="text-xs font-semibold">{v.vehicles?.length || 0} Vehicles Registered</div>
                                            <div className="text-[10px] text-white-dark">Terms: {v.paymentMode} | {v.creditTerms}</div>
                                        </td>
                                        {canSeeFinancials && (
                                            <td className="!text-right font-black text-danger text-base whitespace-nowrap">
                                                ₹{(() => {
                                                    const tripTotal = v.vehicles?.reduce((acc: number, veh: any) => acc + (Number(veh.ratePerTrip || 0) + Number(veh.padiKasu || 0)), 0) || 0;
                                                    return ((tripTotal + (v.outstandingBalance || 0)) - (v.advancePaid || 0) + (balances[v._id] || 0)).toLocaleString();
                                                })()}
                                            </td>
                                        )}
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Link href={`/vendors/transport/${v._id}`} className="btn btn-sm btn-outline-info p-1">
                                                    <IconEye className="w-4 h-4" />
                                                </Link>
                                                {canEditRecord(currentUser, v.createdAt) ? (
                                                    <button onClick={() => handleEdit(v)} className="btn btn-sm btn-outline-info p-1">
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-white-dark italic flex items-center">Locked</span>
                                                )}
                                                {isOwner && (<button onClick={() => setDeleteId(v._id)} className="btn btn-sm btn-outline-danger p-1"><IconTrashLines className="w-4 h-4" /></button>)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <DeleteConfirmModal show={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete Transport Vendor" message="Are you sure you want to delete this transport vendor?" />
        </div>
    );
};

export default TransportVendorManagement;
