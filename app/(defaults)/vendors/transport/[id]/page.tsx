'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconPhone from '@/components/icon/icon-phone';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconWheel from '@/components/icon/icon-wheel';
import IconArchive from '@/components/icon/icon-archive';

const TransportVendorDetailsPage = ({ params }: { params: any }) => {
    const id = params.id;
    const router = useRouter();
    const { showToast } = useToast();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const { data: res } = await api.get(`/vendors/transport/${id}`);
            if (res.success) {
                setData(res.data);
            } else {
                showToast('Failed to fetch details', 'error');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error fetching transport vendor details', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="panel text-center py-20">
                <h2 className="text-2xl font-bold uppercase tracking-tight">Vendor not found</h2>
                <button className="btn btn-primary mt-4" onClick={() => router.back()}>Go Back</button>
            </div>
        );
    }

    const { vendor, assets } = data;

    return (
        <div className="space-y-6 animate__animated animate__fadeIn uppercase">
            {/* Header & Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="btn btn-outline-primary rounded-full w-10 h-10 p-0 flex items-center justify-center hover:scale-110 transition-all font-black shadow-lg"
                >
                    <IconArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-black dark:text-white-light tracking-tight italic">
                        Transport Vendor Profile
                    </h2>
                    <p className="text-white-dark text-[10px] font-black tracking-widest opacity-70">
                        Fleet analysis and connected assets for {vendor.name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vendor Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="panel border-t-4 border-info shadow-xl rounded-3xl overflow-hidden group">
                        <div className="flex flex-col items-center text-center p-6 bg-info/5 border-b border-info/10">
                            <div className="w-24 h-24 rounded-3xl bg-info flex items-center justify-center text-white text-4xl font-black mb-4 shadow-2xl rotate-3 group-hover:rotate-0 transition-all">
                                {vendor.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-black text-info tracking-tighter italic">{vendor.name}</h3>
                            <p className="text-[10px] font-black text-white-dark/60 tracking-widest mt-1">
                                {vendor.companyName || 'INDIVIDUAL OWNER'}
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info shrink-0">
                                    <IconPhone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white-dark uppercase tracking-widest">Mobile Number</p>
                                    <p className="font-black text-sm">{vendor.mobileNumber}</p>
                                    {vendor.alternateNumber && <p className="text-[9px] text-white-dark/60 font-bold">{vendor.alternateNumber} (Alt)</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <IconMapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white-dark uppercase tracking-widest">Office Address</p>
                                    <p className="font-bold text-xs leading-relaxed">{vendor.address || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white-light dark:border-white-dark/10">
                                <div>
                                    <p className="text-[9px] font-black text-white-dark uppercase tracking-widest mb-1">GST Number</p>
                                    <p className="font-black text-xs text-info">{vendor.gstNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white-dark uppercase tracking-widest mb-1">PAN Number</p>
                                    <p className="font-black text-xs text-secondary">{vendor.panNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Terms Card */}
                    <div className="panel shadow-xl rounded-3xl p-6 bg-primary/5 border border-primary/20">
                        <h4 className="font-black text-xs tracking-widest text-primary mb-4 flex items-center gap-2 italic">
                            COMMERCIAL TERMS
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-white-dark">PAYMENT MODE</span>
                                <span className="badge badge-outline-primary rounded-xl px-4 italic">{vendor.paymentMode}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-white-dark">CREDIT TERMS</span>
                                <span className="badge badge-outline-secondary rounded-xl px-4 italic">{vendor.creditTerms || 'Immediate'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black pt-4 border-t border-primary/10">
                                <span className="text-danger font-black">OPENING BALANCE</span>
                                <span className="text-lg font-black text-danger tracking-tighter italic">₹{(vendor.outstandingBalance || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assets List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="panel shadow-xl rounded-3xl p-0 overflow-hidden border-none border-t-4 border-warning">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-warning/5">
                            <h4 className="text-lg font-black text-warning italic flex items-center gap-2 uppercase tracking-tighter">
                                <IconWheel className="w-5 h-5" />
                                Linked Machines & Vehicles ({assets.length})
                            </h4>
                            <div className="text-[10px] font-black tracking-widest bg-warning/10 px-3 py-1 rounded-full text-warning uppercase">
                                Registered Fleet
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table-hover custom-table">
                                <thead className="bg-gray-50/50 dark:bg-dark-light/5">
                                    <tr>
                                        <th className="font-black uppercase tracking-widest text-[9px]">Asset Information</th>
                                        <th className="font-black uppercase tracking-widest text-[9px]">Category / Type</th>
                                        <th className="font-black uppercase tracking-widest text-[9px]">Operator / Driver</th>
                                        <th className="font-black uppercase tracking-widest text-[9px] text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-20 text-white-dark italic font-bold">
                                                No machines or vehicles registered under this vendor yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map((asset: any) => (
                                            <tr key={asset._id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${asset.type === 'Machine' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
                                                            {asset.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-sm">{asset.name}</div>
                                                            <div className="text-[10px] text-white-dark uppercase tracking-widest font-bold">
                                                                {asset.vehicleNumber || asset.registrationNumber || 'NO PLATE'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black text-black dark:text-white uppercase">{asset.category || 'General'}</span>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md w-fit ${asset.type === 'Machine' ? 'bg-info text-white' : 'bg-primary text-white'}`}>
                                                            {asset.type.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-[10px] font-black">{asset.driverName || asset.operatorName || 'NOT SET'}</div>
                                                    <div className="text-[9px] text-white-dark uppercase font-bold tracking-tighter">Person In Charge</div>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${asset.status === 'active' ? 'bg-success/20 text-success border border-success/30' : 'bg-danger/20 text-danger border border-danger/30'}`}>
                                                        {asset.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bank Details Section */}
                    <div className="panel shadow-xl rounded-3xl p-6 bg-success/5 border-l-4 border-success">
                        <h4 className="font-black text-xs tracking-widest text-success mb-4 flex items-center gap-2 italic">
                            BANK ACCOUNT DETAILS
                        </h4>
                        {vendor.bankName ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[9px] font-black text-white-dark uppercase tracking-widest mb-1">Bank Name</p>
                                    <p className="font-black text-sm">{vendor.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white-dark uppercase tracking-widest mb-1">Account Number</p>
                                    <p className="font-black text-sm tracking-tighter">{vendor.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white-dark uppercase tracking-widest mb-1">IFSC Code</p>
                                    <p className="font-black text-sm text-success">{vendor.ifscCode}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-white-dark italic">No bank information provided.</p>
                        )}
                    </div>

                    {/* Remarks Section */}
                    {vendor.notes && (
                        <div className="panel shadow-xl rounded-2xl bg-gray-50 dark:bg-dark-light/5 border-l-4 border-primary p-6">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                Vendor Remarks / Notes
                            </p>
                            <p className="italic text-sm font-bold leading-relaxed text-white-dark">
                                "{vendor.notes}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransportVendorDetailsPage;
