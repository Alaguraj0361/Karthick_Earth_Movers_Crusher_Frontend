'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconEye from '@/components/icon/icon-eye';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';

const ComponentsAuthResetNewPasswordForm = ({ token }: { token: string }) => {
    const router = useRouter();
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const submitForm = async (e: any) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.put(`/auth/resetpassword/${token}`, { password });
            if (data.success) {
                showToast('Your password has been successfully reset. You are now logged in.', 'success');
                router.push('/');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error resetting password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="space-y-6 text-white" onSubmit={submitForm}>
            <div>
                <label htmlFor="Password" className="text-[10px] font-black uppercase text-white/60 mb-2 block tracking-[0.2em] ml-1">New Password</label>
                <div className="relative group text-white-dark">
                    <input
                        id="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="form-input ps-12 pe-12 rounded-xl h-14 font-bold border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary focus:text-white text-white transition-all placeholder:text-white/30"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-white transition-colors">
                        <IconLockDots fill={true} />
                    </span>
                    <button
                        type="button"
                        className="absolute end-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                        <IconEye fill={showPassword} className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="ConfirmPassword" className="text-[10px] font-black uppercase text-white/60 mb-2 block tracking-[0.2em] ml-1">Confirm Password</label>
                <div className="relative group text-white-dark">
                    <input
                        id="ConfirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        className="form-input ps-12 pe-12 rounded-xl h-14 font-bold border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary focus:text-white text-white transition-all placeholder:text-white/30"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-white transition-colors">
                        <IconLockDots fill={true} />
                    </span>
                    <button
                        type="button"
                        className="absolute end-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                    >
                        <IconEye fill={showConfirmPassword} className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <button type="submit" className="btn btn-primary h-14 w-full rounded-xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all transform hover:scale-[1.01] active:scale-[0.98]" disabled={loading}>
                {loading ? 'Updating Password...' : 'Apply New Password'}
            </button>
        </form>
    );
};

export default ComponentsAuthResetNewPasswordForm;
