'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import IconUser from '@/components/icon/icon-user';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, setLoading } from '@/store/authSlice';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';

const ComponentsAuthRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const submitForm = async (e: any) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        dispatch(setLoading(true));
        try {
            // Role is typically 'Supervisor' by default to match enum.
            // Backend handles first-user-as-Owner if applicable.
            const { data } = await api.post('/auth/register', {
                name,
                username,
                email,
                password,
                role: 'Supervisor' // Default role to match enum
            });

            if (data.success) {
                dispatch(setCredentials({ user: data.user, token: data.token }));
                showToast('Registration successful', 'success');
                router.push('/');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Something went wrong. Please try again.', 'error');
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
            <div>
                <label htmlFor="Name">Full Name</label>
                <div className="relative text-white-dark">
                    <input
                        id="Name"
                        type="text"
                        placeholder="Enter Name"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconUser fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="Username">Username</label>
                <div className="relative text-white-dark">
                    <input
                        id="Username"
                        type="text"
                        placeholder="Enter Username"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconUser fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="Email">Email</label>
                <div className="relative text-white-dark">
                    <input
                        id="Email"
                        type="email"
                        placeholder="Enter Email"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconMail fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="Password">Password</label>
                <div className="relative text-white-dark">
                    <input
                        id="Password"
                        type="password"
                        placeholder="Enter Password"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconLockDots fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="ConfirmPassword">Confirm Password</label>
                <div className="relative text-white-dark">
                    <input
                        id="ConfirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconLockDots fill={true} />
                    </span>
                </div>
            </div>
            <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)] font-bold py-3">
                Sign Up
            </button>
            <div className="text-center dark:text-white mt-8 text-xs font-bold text-white-dark uppercase tracking-widest">
                Already have an account?&nbsp;
                <Link href="/login" className="text-primary font-black hover:underline mt-2 block sm:inline-block">SIGN IN</Link>
            </div>
        </form>
    );
};


export default ComponentsAuthRegisterForm;

