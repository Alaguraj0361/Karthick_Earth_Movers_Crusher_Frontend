'use client';
import React, { useState } from 'react';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconSave from '@/components/icon/icon-save';
import IconEye from '@/components/icon/icon-eye';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/stone-mine/toast-notification';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.put('/auth/updatepassword', {
                currentPassword,
                newPassword,
            });

            if (data.success) {
                showToast('Password updated successfully', 'success');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                router.push('/');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to update password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline font-bold">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Settings</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Change Password</span></li>
            </ul>

            <div className="panel max-w-xl mx-auto shadow-2xl rounded-3xl border-none">
                <div className="mb-8 flex items-center justify-between">
                    <h5 className="text-xl font-black dark:text-white-light tracking-tight uppercase">Update Credentials</h5>
                </div>
                <div className="mb-5 border-t border-[#ebedf2] pt-8 dark:border-[#1b2e4b]">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="currentPassword" className="text-[10px] font-black uppercase text-white-dark mb-2 block tracking-widest">Current Password</label>
                            <div className="relative text-white-dark mt-1 group">
                                <input
                                    id="currentPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    placeholder="Enter Current Password"
                                    className="form-input ps-12 pe-12 rounded-xl h-12 font-bold border-2 focus:border-primary transition-all"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary">
                                    <IconLockDots fill={true} />
                                </span>
                                <button
                                    type="button"
                                    className="absolute end-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    title={showCurrentPassword ? 'Hide Password' : 'Show Password'}
                                >
                                    <IconEye fill={showCurrentPassword} className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="text-[10px] font-black uppercase text-white-dark mb-2 block tracking-widest">New Password</label>
                            <div className="relative text-white-dark mt-1 group">
                                <input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Enter New Password (min 6 characters)"
                                    className="form-input ps-12 pe-12 rounded-xl h-12 font-bold border-2 focus:border-primary transition-all"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary">
                                    <IconLockDots fill={true} />
                                </span>
                                <button
                                    type="button"
                                    className="absolute end-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    title={showNewPassword ? 'Hide Password' : 'Show Password'}
                                >
                                    <IconEye fill={showNewPassword} className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="text-[10px] font-black uppercase text-white-dark mb-2 block tracking-widest">Confirm New Password</label>
                            <div className="relative text-white-dark mt-1 group">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm New Password"
                                    className="form-input ps-12 pe-12 rounded-xl h-12 font-bold border-2 focus:border-primary transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary">
                                    <IconLockDots fill={true} />
                                </span>
                                <button
                                    type="button"
                                    className="absolute end-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                                >
                                    <IconEye fill={showConfirmPassword} className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end pt-6">
                            <button type="submit" className="btn btn-primary w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_20px_rgba(67,97,238,0.3)] transition-all transform hover:scale-[1.02]" disabled={loading}>
                                <IconSave className="mr-2 w-4 h-4" />
                                {loading ? 'Processing...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
