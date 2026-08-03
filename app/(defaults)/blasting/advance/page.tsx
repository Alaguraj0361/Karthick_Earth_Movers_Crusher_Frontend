'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import BlastingAdvanceManagement from '@/components/stone-mine/blasting/blasting-advance-management';

const BlastingAdvancePage = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const role = currentUser?.role?.toLowerCase();
    const isAuthorized = role === 'owner' || role === 'manager';

    if (!isAuthorized) {
        return (
            <div className="panel flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-danger/10 p-4 rounded-full mb-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h5 className="text-2xl font-bold text-danger">Access Restricted</h5>
                <p className="text-white-dark mt-2 max-w-sm">
                    Only <strong>Owner</strong> and <strong>Manager</strong> roles are authorized to view Blasting Advance.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h5 className="font-semibold text-lg dark:text-white-light">💰 Blasting Advance</h5>
                    <p className="text-white-dark text-xs mt-1">Manage advances paid for blasting operations</p>
                </div>
            </div>
            <div className="panel">
                <BlastingAdvanceManagement />
            </div>
        </div>
    );
};

export default BlastingAdvancePage;
