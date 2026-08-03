'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconEye from '@/components/icon/icon-eye';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const ComponentsAuthUnlockForm = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const submitForm = (e: any) => {
        e.preventDefault();
        router.push('/');
    };
    return (
        <form className="space-y-6 text-white" onSubmit={submitForm}>
            <div>
                <label htmlFor="Password" className="text-[10px] font-black uppercase text-white/60 mb-2 block tracking-[0.2em] ml-1">
                    Password
                </label>
                <div className="relative group text-white-dark mt-1">
                    <input
                        id="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="form-input ps-12 pe-12 rounded-xl h-14 font-bold border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary focus:text-white text-white transition-all placeholder:text-white/30"
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
            <button type="submit" className="btn btn-primary h-14 w-full rounded-xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all transform hover:scale-[1.01] active:scale-[0.98]">
                Unlock Account
            </button>
        </form>
    );
};

export default ComponentsAuthUnlockForm;
