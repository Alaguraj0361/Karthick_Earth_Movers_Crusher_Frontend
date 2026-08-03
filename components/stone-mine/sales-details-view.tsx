'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { useSearchParams, useRouter } from 'next/navigation';
import api, { getFileUrl } from '@/utils/api';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconPrinter from '@/components/icon/icon-printer';
import IconCalendar from '@/components/icon/icon-calendar';
import IconUser from '@/components/icon/icon-user';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconBox from '@/components/icon/icon-box';
import IconWheel from '@/components/icon/icon-wheel';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import Link from 'next/link';
import IconFile from '@/components/icon/icon-file';
import IconEye from '@/components/icon/icon-eye';

const SalesDetailsView = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const saleId = searchParams.get('id');
    const [sale, setSale] = useState<any>(null);
    const [trips, setTrips] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const canSeeFinancials = currentUser?.role?.toLowerCase() === 'owner' || currentUser?.role?.toLowerCase() === 'manager';

    const fetchData = async () => {
        if (!saleId) return;
        try {
            setLoading(true);
            const { data } = await api.get(`/sales/${saleId}`);
            if (data.success) {
                setSale(data.data);
                setTrips((data.trips || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setPayments((data.payments || []).sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
            }
        } catch (error) {
            console.error('Error fetching sale details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saleId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="panel p-5 text-center">
                <h4 className="text-lg font-bold">Sale not found</h4>
                <button className="btn btn-primary mt-4" onClick={() => router.back()}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button className="btn btn-outline-primary btn-sm mb-2" onClick={() => router.back()}>
                        <IconArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Back
                    </button>
                    <h2 className="text-2xl font-bold dark:text-white-light">Sales Details: {sale.invoiceNumber}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {currentUser?.role?.toLowerCase() === 'owner' && (
                        <Link href={`/sales-billing/invoices?id=${sale._id}`} target="_blank" className="btn btn-primary">
                            <IconPrinter className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Billing Format (Invoice)
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Sale Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Primary Info Card */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-bold text-lg">General Information</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <IconCalendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white-dark text-xs uppercase font-bold">Invoice Date</p>
                                    <p className="font-bold">{new Date(sale.invoiceDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-info/10 rounded-lg text-info">
                                    <IconUser className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white-dark text-xs uppercase font-bold">Customer</p>
                                    <p className="font-bold">{sale.customer?.name || 'Walk-in'}</p>
                                    <p className="text-xs text-white-dark">{sale.customer?.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-success/10 rounded-lg text-success">
                                    <IconMapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white-dark text-xs uppercase font-bold">Destination</p>
                                    <p className="font-bold">{sale.toLocation || 'N/A'}</p>
                                </div>
                            </div>
                            {canSeeFinancials && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-warning/10 rounded-lg text-warning">
                                        <IconInfoCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white-dark text-xs uppercase font-bold">Payment Status</p>
                                        <p className="font-bold">{sale.paymentStatus} ({sale.paymentType})</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Material Items */}
                    <div className="panel">
                        <h5 className="font-bold text-lg mb-5">Material Items</h5>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        {canSeeFinancials && <th className="text-center">Rate</th>}
                                        <th className="text-center">Total Qty</th>
                                        {canSeeFinancials && <th className="text-right">Amount</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items?.map((item: any, i: number) => (
                                        <tr key={i}>
                                            <td className="font-bold">{item.item}</td>
                                            {canSeeFinancials && <td className="text-center">₹{item.rate}</td>}
                                            <td className="text-center">{item.quantity} {item.unit}</td>
                                            {canSeeFinancials && <td className="text-right font-bold">₹{item.amount?.toLocaleString()}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Linked Trips Section */}
                    <div className="panel border-t-4 border-info">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-bold text-lg flex items-center gap-2">
                                <IconWheel className="w-5 h-5 text-info" /> Linked Trips (பயண விவரங்கள்)
                            </h5>
                            <span className="badge bg-info/10 text-info">{trips.length} Trips</span>
                        </div>
                        {trips.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Vehicle / Driver</th>
                                            <th>Material</th>
                                            <th className="text-center">Delivered Qty</th>
                                            <th>Route</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trips.map((trip: any, i: number) => (
                                            <tr key={i}>
                                                <td className="text-xs">{new Date(trip.date).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="font-bold text-xs">{trip.vehicleId?.vehicleNumber}</div>
                                                    <div className="text-[10px] text-white-dark">{trip.driverId?.name}</div>
                                                </td>
                                                <td className="text-xs">{trip.stoneTypeId?.name}</td>
                                                <td className="text-center font-bold">{trip.loadQuantity} {trip.loadUnit}</td>
                                                <td className="text-[10px] uppercase">{trip.fromLocation} → {trip.toLocation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-white-dark italic">No trips recorded for this sale yet.</div>
                        )}
                    </div>
                </div>

                {/* Right Column: Financial Summary & Remarks */}
                <div className="lg:col-span-1 space-y-6">
                    {canSeeFinancials && (
                        <>
                            <div className="panel bg-primary text-white">
                                <h5 className="font-bold text-lg mb-4 text-white">Financial Summary</h5>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center opacity-80">
                                        <span>Subtotal:</span>
                                        <span>₹{sale.subtotal?.toLocaleString()}</span>
                                    </div>
                                    {sale.gstAmount > 0 && (
                                        <div className="flex justify-between items-center opacity-80">
                                            <span>GST ({sale.gstPercentage || ((sale.gstAmount / (sale.subtotal || 1)) * 100).toFixed(0)}%):</span>
                                            <span>₹{sale.gstAmount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-3 border-t border-white/20 text-xl font-black italic">
                                        <span>Grand Total:</span>
                                        <span>₹{sale.grandTotal?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="panel">
                                <h5 className="font-bold text-lg mb-4">Payment History</h5>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                                        <div>
                                            <p className="text-xs text-white-dark uppercase font-bold">Total Paid</p>
                                            <p className="text-lg font-black text-success">₹{sale.amountPaid?.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-white-dark uppercase font-bold">Pending</p>
                                            <p className="text-lg font-black text-danger">₹{sale.balanceAmount?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {payments.length > 0 ? (
                                        <div className="space-y-2">
                                            {payments.map((p: any, i: number) => (
                                                <div key={i} className="flex justify-between text-xs p-2 border-b border-white-light dark:border-white-dark/10 last:border-0">
                                                    <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                                                    <span className="font-bold">₹{p.amount?.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-center text-white-dark italic">No payment records found.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {sale.receiptFile && (
                        <div className="panel">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-bold text-lg flex items-center gap-2">
                                    <IconFile className="w-5 h-5 text-primary" /> Receipt Copy
                                </h5>
                                <a
                                    href={getFileUrl(sale.receiptFile)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-xs btn-outline-primary"
                                >
                                    <IconEye className="w-3 h-3 ltr:mr-1 rtl:ml-1" /> Full View
                                </a>
                            </div>
                            <div className="bg-white-light/30 dark:bg-white-dark/5 rounded-lg border border-white-light dark:border-white-dark/10 overflow-hidden">
                                {sale.receiptFile.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={getFileUrl(sale.receiptFile)}
                                        className="w-full h-[400px]"
                                        title="Receipt PDF"
                                    ></iframe>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={getFileUrl(sale.receiptFile)}
                                        alt="Receipt"
                                        className="w-full h-auto object-contain max-h-[500px] mx-auto"
                                    />
                                )}
                            </div>
                            {sale.receiptNumber && (
                                <p className="mt-2 text-xs text-center font-bold text-white-dark">
                                    Ref #: {sale.receiptNumber}
                                </p>
                            )}
                        </div>
                    )}

                    {sale.notes && (
                        <div className="panel">
                            <h5 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <IconBox className="w-5 h-5 text-warning" /> Remarks
                            </h5>
                            <p className="text-sm text-white-dark">{sale.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesDetailsView;
