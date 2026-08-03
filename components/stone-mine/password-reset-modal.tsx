'use client';
import React, { useState } from 'react';
import IconX from '@/components/icon/icon-x';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconEye from '@/components/icon/icon-eye';

interface PasswordResetModalProps {
    show: boolean;
    title: string;
    userName: string;
    onConfirm: (password: string) => void;
    onCancel: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
    show,
    title,
    userName,
    onConfirm,
    onCancel,
}) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    if (!show) return null;

    const handleConfirm = () => {
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        onConfirm(password);
        setPassword('');
        setShowPassword(false);
        setError('');
    };

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
                    <div className="mb-6 text-center">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
                            <IconLockDots className="w-10 h-10 text-warning" />
                        </div>
                        <p className="text-white-dark font-medium">Resetting password for <span className="text-dark dark:text-white font-bold italic">{userName}</span></p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-white-dark tracking-widest mb-1 block">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-input ps-4 pe-12 rounded-xl border-2 py-3 ${error ? 'border-danger bg-danger/5' : 'border-gray-100 dark:border-white/10 dark:bg-black/20 focus:border-primary'}`}
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="absolute end-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide Password' : 'Show Password'}
                                >
                                    <IconEye fill={showPassword} className="h-5 w-5" />
                                </button>
                            </div>
                            {error && <p className="text-danger text-[10px] font-bold mt-1 uppercase tracking-wider">{error}</p>}
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-8 flex gap-3">
                    <button
                        type="button"
                        className="btn btn-outline-dark flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px]"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        onClick={handleConfirm}
                    >
                        Reset Password
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordResetModal;
