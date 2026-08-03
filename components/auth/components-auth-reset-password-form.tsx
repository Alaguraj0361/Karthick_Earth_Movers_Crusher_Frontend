'use client';
import IconMail from '@/components/icon/icon-mail';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';

const ComponentsAuthResetPasswordForm = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const submitForm = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgotpassword', { email });
            if (data.success) {
                showToast('Please check your email for the password reset link.', 'success');
                setEmail('');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error processing request', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="space-y-6 text-white" onSubmit={submitForm}>
            <div>
                <label htmlFor="Email" className="text-[10px] font-black uppercase text-white/60 mb-2 block tracking-[0.2em] ml-1">
                    Email Address
                </label>
                <div className="relative group text-white-dark">
                    <input
                        id="Email"
                        type="email"
                        placeholder="Enter your registered email"
                        className="form-input ps-12 rounded-xl h-14 font-bold border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary focus:text-white text-white transition-all placeholder:text-white/30"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-white transition-colors">
                        <IconMail fill={true} />
                    </span>
                </div>
            </div>
            <button type="submit" className="btn btn-primary h-14 w-full rounded-xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all transform hover:scale-[1.01] active:scale-[0.98]" disabled={loading}>
                {loading ? 'Sending Link...' : 'Send Recovery Link'}
            </button>

            <div className="text-center mt-6">
                <Link href="/login" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary hover:underline transition-all">Back to Login</Link>
            </div>
        </form>
    );
};

export default ComponentsAuthResetPasswordForm;
