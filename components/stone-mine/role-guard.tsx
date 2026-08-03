'use client';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
    redirectTo?: string;
}

/**
 * RoleGuard — wraps a page and redirects unauthorized users.
 * allowedRoles: e.g. ['owner', 'manager']
 */
const RoleGuard = ({ children, allowedRoles, redirectTo = '/' }: RoleGuardProps) => {
    const router = useRouter();
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const userRole = currentUser?.role?.toLowerCase() ?? '';
    const isAllowed = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    useEffect(() => {
        if (currentUser !== undefined && !isAllowed) {
            router.replace(redirectTo);
        }
    }, [currentUser, isAllowed, router, redirectTo]);

    // While checking, render nothing
    if (!currentUser || !isAllowed) return null;

    return <>{children}</>;
};

export default RoleGuard;
