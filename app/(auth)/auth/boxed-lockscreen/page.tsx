import ComponentsAuthUnlockForm from '@/components/auth/components-auth-unlock-form';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Unlock Box',
};

const BoxedLockScreen = () => {
    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/earth-movers-bg.jpg" alt="Earth Movers Background" className="h-full w-full object-cover" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-black/40 backdrop-blur-[2px] px-6 py-10 sm:px-16">
                <div className="relative w-full max-w-[850px] rounded-2xl bg-white/5 p-1 border border-white/10 shadow-3xl">
                    <div className="relative flex flex-col justify-center rounded-2xl bg-black/65 px-8 py-16 backdrop-blur-2xl lg:min-h-[700px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-12 flex items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="flex h-16 w-16 items-end justify-center overflow-hidden rounded-full ring-2 ring-primary ltr:mr-4 rtl:ml-4 shadow-lg shadow-primary/20">
                                    <img src="/assets/images/auth/user.png" className="w-full object-cover" alt="images" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-2xl font-black text-white tracking-tight uppercase">Session Locked</h4>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Enter Password to Unlock</p>
                                </div>
                            </div>
                            <ComponentsAuthUnlockForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoxedLockScreen;
