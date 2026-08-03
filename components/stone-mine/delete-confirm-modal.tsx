'use client';
import React from 'react';
import IconX from '@/components/icon/icon-x';
import IconTrash from '@/components/icon/icon-trash';

interface DeleteConfirmModalProps {
    show: boolean;
    title?: string;
    message?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    show,
    title = 'Delete',
    message = 'Are you sure you want to delete this item?',
    onConfirm,
    onCancel,
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-[#0e1726] rounded-lg w-full max-w-sm shadow-2xl animate__animated animate__fadeInUp">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-0">
                    <h5 className="text-lg font-bold dark:text-white-light">{title}</h5>
                    <button type="button" className="text-white-dark hover:text-dark dark:hover:text-white-light" onClick={onCancel}>
                        <IconX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 text-center">
                    <div className="mx-auto w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-5">
                        <IconTrash className="w-8 h-8 text-danger" />
                    </div>
                    <p className="text-base text-white-dark">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-3 px-5 pb-5">
                    <button type="button" className="btn btn-outline-dark px-6" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-danger px-6 shadow-lg shadow-danger/20" onClick={onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
