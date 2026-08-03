'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconUser from '@/components/icon/icon-user';
import IconMail from '@/components/icon/icon-mail';
import IconAt from '@/components/icon/icon-at';
import IconAward from '@/components/icon/icon-award';
import Link from 'next/link';

const Profile = () => {
    const user = useSelector((state: IRootState) => state.auth.user);

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link href="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Users</span>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Profile</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
                    <div className="panel lg:col-span-1">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Personal Information</h5>
                        </div>
                        <div className="mb-5">
                            <div className="flex flex-col justify-center items-center">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
                                    <IconUser className="w-12 h-12" />
                                </div>
                                <p className="font-semibold text-primary text-xl capitalize">{user?.name || 'N/A'}</p>
                                <span className="badge badge-outline-success mt-2 capitalize">{user?.role || 'N/A'}</span>
                            </div>
                            <ul className="mt-8 flex flex-col space-y-4 font-semibold text-white-dark">
                                <li className="flex items-center gap-3">
                                    <IconAward className="shrink-0 text-primary" />
                                    <span>{user?.role || 'N/A'}</span>
                                </li>
                                <li className="flex items-center gap-3 text-break">
                                    <IconAt className="shrink-0 text-primary" />
                                    <span>@{user?.username || 'N/A'}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <IconMail className="shrink-0 text-primary" />
                                    <span className="truncate">{user?.email || 'No email provided'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="panel lg:col-span-2 xl:col-span-3">
                        <div className="mb-5 flex items-center justify-between">
                            <h5 className="font-semibold text-lg dark:text-white-light">User Profile Details</h5>
                            <Link href="/users/change-password" title="Settings">
                                <button className="btn btn-primary btn-sm">Edit Password</button>
                            </Link>
                        </div>
                        <div className="table-responsive text-[#515365] dark:text-white-light font-semibold">
                            <table className="whitespace-nowrap w-full">
                                <tbody className="divide-y divide-[#ebedf2] dark:divide-[#1b2e4b]">
                                    <tr>
                                        <td className="py-4 w-1/3 text-white-dark font-bold">Full Name</td>
                                        <td className="py-4 capitalize">{user?.name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 text-white-dark font-bold">Username</td>
                                        <td className="py-4">@{user?.username || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 text-white-dark font-bold">User Role</td>
                                        <td className="py-4">
                                            <span className="badge bg-success-light text-success capitalize">{user?.role || 'N/A'}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 text-white-dark font-bold">Account Type</td>
                                        <td className="py-4 capitalize">
                                            {user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'owner' ? 'Administrator' : 'Standard User'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 text-white-dark font-bold">Contact Email</td>
                                        <td className="py-4">{user?.email || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
