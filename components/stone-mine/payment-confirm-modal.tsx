'use client';
import React, { useState } from 'react';
import IconX from '@/components/icon/icon-x';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconCreditCard from '@/components/icon/icon-credit-card';

interface PaymentConfirmModalProps {
    show: boolean;
    title: string;
    amount: number;
    workerName: string;
    modes: string[];
    onConfirm: (mode: string) => void;
    onCancel: () => void;
}

const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
    show,
    title,
    amount,
    workerName,
    modes,
    onConfirm,
    onCancel,
}) => {
    const [selectedMode, setSelectedMode] = useState(modes[0] || 'Cash');

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0e1726] rounded-3xl w-full max-w-md shadow-2xl animate__animated animate__zoomIn animate__faster border border-white/10 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
                    <h5 className="text-xl font-black uppercase tracking-tight dark:text-white-light">{title}</h5>
                    <button type="button" className="text-gray-400 hover:text-danger transition-colors" onClick={onCancel}>
                        <IconX className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-4 relative">
                            <IconDollarSign className="w-12 h-12 text-success" />
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0e1726] p-1.5 rounded-full shadow-lg border border-gray-100 dark:border-white/10">
                                <IconCreditCard className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase text-white-dark tracking-widest mb-1">Confirming Payout For</p>
                        <h4 className="text-2xl font-black text-dark dark:text-white italic uppercase">{workerName}</h4>
                        <div className="mt-4 inline-block bg-success/10 px-6 py-2 rounded-2xl border border-success/20">
                            <span className="text-sm font-black text-success uppercase tracking-widest mr-2">Net Payable:</span>
                            <span className="text-2xl font-black text-success italic">₹{amount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-white-dark tracking-widest mb-1 block">Choose Payment Mode (பணம் செலுத்தும் முறை)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {modes.map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] ${selectedMode === mode
                                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                                        : 'border-gray-100 dark:border-white/5 hover:border-primary/50 text-white-dark hover:text-primary'}`}
                                    onClick={() => setSelectedMode(mode)}
                                >
                                    <div className={`w-2 h-2 rounded-full ${selectedMode === mode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-8 flex gap-3">
                    <button
                        type="button"
                        className="btn btn-outline-dark flex-1 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[11px]"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-success flex-1 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-success/20 transition-all hover:scale-[1.02] active:scale-95 text-white"
                        onClick={() => onConfirm(selectedMode)}
                    >
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmModal;
