'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconUser from '@/components/icon/icon-user';
import IconEye from '@/components/icon/icon-eye';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/authSlice';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';

const ComponentsAuthLoginForm = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const submitForm = async (e: any) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/login', { username, password });

            if (data.success) {
                dispatch(setCredentials({ user: data.user, token: data.token }));
                showToast('Signed in successfully', 'success');

                // Redirect based on role: Admin/Owner to Dashboard, others to Diesel Expenses
                const userRole = data.user?.role?.toLowerCase();
                if (userRole === 'admin' || userRole === 'owner') {
                    router.push('/');
                } else {
                    router.push('/expenses/diesel');
                }
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Invalid username or password';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-6 text-white" onSubmit={submitForm}>
            <div>
                <label htmlFor="Username" className="text-[10px] font-black uppercase text-white/60 mb-2 block tracking-[0.2em] ml-1">Username or Email</label>
                <div className="relative group text-white-dark">
                    <input
                        id="Username"
                        type="text"
                        placeholder="Enter Username or Email"
                        className={`form-input ps-12 rounded-xl h-14 font-bold border-2 bg-white/5 focus:bg-white/10 focus:text-white text-white transition-all placeholder:text-white/30 ${errorMessage ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-primary'}`}
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setErrorMessage(''); }}
                        required
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-white transition-colors">
                        <IconUser fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="Password" className="text-[10px] font-black uppercase text-white/60 mb-2 block tracking-[0.2em] ml-1">Password</label>
                <div className="relative group text-white-dark">
                    <input
                        id="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter Password"
                        className={`form-input ps-12 pe-12 rounded-xl h-14 font-bold border-2 bg-white/5 focus:bg-white/10 focus:text-white text-white transition-all placeholder:text-white/30 ${errorMessage ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-primary'}`}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                        required
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
                <div className="flex justify-end pt-4">
                    <Link href="/auth/boxed-password-reset" className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] hover:text-primary hover:underline transition-all">Forgot Password?</Link>
                </div>
            </div>

            {errorMessage && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl animate-pulse-once">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errorMessage}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary h-14 w-full rounded-xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
                {isLoading ? 'Signing in...' : 'Secure Sign in'}
            </button>
        </form>
    );
};

export default ComponentsAuthLoginForm;

