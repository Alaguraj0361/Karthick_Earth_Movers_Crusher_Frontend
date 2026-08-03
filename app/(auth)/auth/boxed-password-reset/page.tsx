import ComponentsAuthResetPasswordForm from '@/components/auth/components-auth-reset-password-form';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Recover Id Box',
};

const BoxedPasswordReset = () => {
    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/earth-movers-bg.jpg" alt="Earth Movers Background" className="h-full w-full object-cover" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-black/40 backdrop-blur-[2px] px-6 py-10 sm:px-16">
                <div className="relative w-full max-w-[850px] rounded-2xl bg-white/5 p-1 border border-white/10 shadow-3xl">
                    <div className="relative flex flex-col justify-center rounded-2xl bg-black/65 px-8 py-16 backdrop-blur-2xl lg:min-h-[700px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10 text-center">
                                <h1 className="text-4xl font-extrabold uppercase !leading-snug text-white mb-3 tracking-tight">Recover</h1>
                                <p className="text-lg font-bold leading-normal text-primary uppercase tracking-[0.2em] mb-1">Password</p>
                                <div className="h-1 w-20 bg-primary mx-auto mt-4 rounded-full"></div>
                            </div>
                            <ComponentsAuthResetPasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoxedPasswordReset;
