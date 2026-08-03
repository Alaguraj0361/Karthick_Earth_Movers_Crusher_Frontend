'use client';
import React from 'react';
import IconX from '@/components/icon/icon-x';
import IconInfoTriangle from '@/components/icon/icon-info-triangle';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconHelpCircle from '@/components/icon/icon-help-circle';

interface ConfirmationModalProps {
    show: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'warning' | 'info' | 'question';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    show,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    onConfirm,
    onCancel,
}) => {
    if (!show) return null;

    const config = {
        danger: {
            bg: 'bg-danger/10',
            icon: 'text-danger',
            btn: 'btn-danger shadow-danger/20',
            Icon: IconInfoTriangle
        },
        success: {
            bg: 'bg-success/10',
            icon: 'text-success',
            btn: 'btn-success shadow-success/20',
            Icon: IconCircleCheck
        },
        warning: {
            bg: 'bg-warning/10',
            icon: 'text-warning',
            btn: 'btn-warning shadow-warning/20',
            Icon: IconInfoTriangle
        },
        info: {
            bg: 'bg-info/10',
            icon: 'text-info',
            btn: 'btn-info shadow-info/20',
            Icon: IconInfoCircle
        },
        question: {
            bg: 'bg-primary/10',
            icon: 'text-primary',
            btn: 'btn-primary shadow-primary/20',
            Icon: IconHelpCircle
        }
    }[type] || {
        bg: 'bg-info/10',
        icon: 'text-info',
        btn: 'btn-info shadow-info/20',
        Icon: IconInfoCircle
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-[#0e1726] rounded-3xl w-full max-w-sm shadow-2xl animate__animated animate__zoomIn animate__faster overflow-hidden border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5">
                    <h5 className="text-xl font-black uppercase tracking-tight dark:text-white-light">{title}</h5>
                    <button type="button" className="text-white-dark hover:text-dark dark:hover:text-white-light transition-colors" onClick={onCancel}>
                        <IconX className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 text-center">
                    <div className={`mx-auto w-24 h-24 rounded-full ${config.bg} flex items-center justify-center mb-6 animate__animated animate__pulse animate__infinite`}>
                        <config.Icon className={`w-12 h-12 ${config.icon}`} />
                    </div>
                    <p className="text-base font-medium text-white-dark leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-3 px-6 pb-8">
                    <button
                        type="button"
                        className="btn btn-outline-dark px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all hover:bg-gray-100 dark:hover:bg-white/5"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`btn px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg transition-all hover:scale-105 active:scale-95 ${config.btn}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
