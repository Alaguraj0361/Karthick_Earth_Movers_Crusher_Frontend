'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { IRootState } from '@/store';
import Loading from '@/components/layouts/loading';
import { logout } from '@/store/authSlice';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch();

    // Only read isAuthenticated and user — NOT loading — to avoid re-renders when loading changes
    const isAuthenticated = useSelector((state: IRootState) => state.auth.isAuthenticated);
    const user = useSelector((state: IRootState) => state.auth.user);

    // Use a ref to track if the first auth check is done.
    // Using ref (not state) means updating it does NOT cause a re-render.
    const initialized = useRef(false);
    const [ready, setReady] = useState(false);

    const isAuthRoute = pathname.startsWith('/auth') || pathname === '/login';

    useEffect(() => {
        // If already initialized and on an auth page while not authenticated,
        // do nothing — the user is just on the login page submitting forms.
        // This prevents the Loading screen from flashing on login attempts.
        if (initialized.current && isAuthRoute && !isAuthenticated) {
            return;
        }

        // If Redux says authenticated but no token in storage, clear it
        const token = localStorage.getItem('token');
        if (!token && isAuthenticated) {
            dispatch(logout());
            router.replace('/login');
            initialized.current = true;
            setReady(true);
            return;
        }

        if (!isAuthenticated && !isAuthRoute) {
            // Not logged in — send to login page
            router.replace('/login');
            initialized.current = true;
            setReady(true);
            return;
        }

        if (isAuthenticated) {
            const userRole = user?.role?.toLowerCase();
            const isOwner = userRole === 'owner';

            if (isAuthRoute) {
                // Already logged in — send to their default page
                if (isOwner) {
                    router.replace('/');
                } else {
                    router.replace('/expenses/diesel');
                }
                initialized.current = true;
                setReady(true);
                return;
            }

            // If a non-owner tries to go to the dashboard (/), redirect them
            if (pathname === '/' && !isOwner) {
                router.replace('/expenses/diesel');
                initialized.current = true;
                setReady(true);
                return;
            }
        }

        // Everything is fine — show the page
        initialized.current = true;
        setReady(true);
    }, [isAuthenticated, user, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Show loading spinner only during the very first check on page load
    if (!ready) {
        return <Loading />;
    }

    // Unauthenticated trying to access protected page — render nothing (redirect already fired)
    if (!isAuthenticated && !isAuthRoute) {
        return null;
    }

    return <>{children}</>;
}
