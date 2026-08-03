import ComponentsAuthLoginForm from '@/components/auth/components-auth-login-form';
import IconFacebookCircle from '@/components/icon/icon-facebook-circle';
import IconGoogle from '@/components/icon/icon-google';
import IconInstagram from '@/components/icon/icon-instagram';
import IconTwitter from '@/components/icon/icon-twitter';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
    title: 'Login Boxed',
};

const BoxedSignIn = () => {
    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/earth-movers-bg.jpg" alt="Earth Movers Background" className="h-full w-full object-cover" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-black/40 backdrop-blur-[2px] px-6 py-10 sm:px-16">
                <div className="relative w-full max-w-[850px] rounded-2xl bg-white/5 p-1 border border-white/10 shadow-3xl">
                    <div className="relative flex flex-col justify-center rounded-2xl bg-black/65 px-8 py-16 backdrop-blur-2xl lg:min-h-[700px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-12 text-center">
                                <img src="/assets/images/logo.png" alt="Karthick Earth Movers" className="w-48 mx-auto mb-4" />
                                <div className="h-1 w-20 bg-primary mx-auto mt-4 rounded-full"></div>
                            </div>
                            <ComponentsAuthLoginForm />
                            {/* Social media icons and separator removed as per user request */}
                            {/* Signup link removed as per user request */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoxedSignIn;
