'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar } from '@/store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '@/store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '@/components/icon/icon-carets-down';
import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconMinus from '@/components/icon/icon-minus';
import IconMenuChat from '@/components/icon/menu/icon-menu-chat';
import IconMenuMailbox from '@/components/icon/menu/icon-menu-mailbox';
import IconMenuTodo from '@/components/icon/menu/icon-menu-todo';
import IconMenuNotes from '@/components/icon/menu/icon-menu-notes';
import IconMenuScrumboard from '@/components/icon/menu/icon-menu-scrumboard';
import IconMenuContacts from '@/components/icon/menu/icon-menu-contacts';
import IconMenuInvoice from '@/components/icon/menu/icon-menu-invoice';
import IconMenuCalendar from '@/components/icon/menu/icon-menu-calendar';
import IconMenuComponents from '@/components/icon/menu/icon-menu-components';
import IconMenuElements from '@/components/icon/menu/icon-menu-elements';
import IconMenuCharts from '@/components/icon/menu/icon-menu-charts';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import IconMenuFontIcons from '@/components/icon/menu/icon-menu-font-icons';
import IconMenuDragAndDrop from '@/components/icon/menu/icon-menu-drag-and-drop';
import IconMenuTables from '@/components/icon/menu/icon-menu-tables';
import IconMenuDatatables from '@/components/icon/menu/icon-menu-datatables';
import IconMenuForms from '@/components/icon/menu/icon-menu-forms';
import IconMenuUsers from '@/components/icon/menu/icon-menu-users';
import IconPlus from '@/components/icon/icon-plus';
import IconMenuPages from '@/components/icon/menu/icon-menu-pages';
import IconMenuAuthentication from '@/components/icon/menu/icon-menu-authentication';
import IconMenuDocumentation from '@/components/icon/menu/icon-menu-documentation';
import { usePathname } from 'next/navigation';
import { getTranslation } from '@/i18n';

const Sidebar = () => {
    const dispatch = useDispatch();
    const { t } = getTranslation();
    const pathname = usePathname();
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const userRole = useSelector((state: IRootState) => state.auth.user?.role?.toLowerCase());
    const isOwner = userRole === 'owner';
    const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';

    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        setActiveRoute();
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const setActiveRoute = () => {
        let allLinks = document.querySelectorAll('.sidebar ul a.active');
        for (let i = 0; i < allLinks.length; i++) {
            const element = allLinks[i];
            element?.classList.remove('active');
        }
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        selector?.classList.add('active');
    };

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="h-full bg-white dark:bg-black flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 shrink-0">
                        <Link href={isOwner ? "/" : "/expenses/diesel"} className="main-logo flex shrink-0 items-center">
                            <img className="ml-[5px] w-40 flex-none rounded-lg" src="/assets/images/logo.png" alt="logo" />
                            {/* <span className="align-middle text-xl font-black ltr:ml-2 rtl:mr-2 dark:text-white-light lg:inline uppercase tracking-tighter">Karthick Earth Movers</span> */}
                        </Link>

                        <button
                            type="button"
                            className="collapse-icon flex h-8 w-8 items-center rounded-full transition duration-300 hover:bg-gray-500/10 rtl:rotate-180 dark:text-white-light dark:hover:bg-dark-light/10"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="relative flex-1 min-h-0">
                        <ul className="relative space-y-0.5 p-4 py-0 font-semibold">
                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                <IconMinus className="hidden h-5 w-4 flex-none" />
                                <span>Stone Mine</span>
                            </h2>

                            <li className="nav-item">
                                <ul>
                                    {isOwner && (
                                        <li className="nav-item">
                                            <Link href="/" className="group">
                                                <div className="flex items-center">
                                                    <IconMenuDashboard className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Dashboard</span>
                                                </div>
                                            </Link>
                                        </li>
                                    )}
                                    {/* 1. Sales & Billing */}
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'sales-billing' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('sales-billing')}>
                                            <div className="flex items-center">
                                                <IconMenuContacts className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Sales & Billing</span>
                                            </div>

                                            <div className={currentMenu !== 'sales-billing' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                <IconCaretDown />
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'sales-billing' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <Link href="/sales-billing/customers">Customer Management</Link>
                                                </li>
                                                {isOwnerOrManager && (
                                                    <>
                                                        <li>
                                                            <Link href="/sales-billing/quotations">Quotations</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="/sales-billing/sales-entry">Sales Entry</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="/sales-billing/invoices">Invoice Generation</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="/sales-billing/bills">Bill Generation (Non-Tax)</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="/sales-billing/trip-checklist">Trip Checklist</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="/sales-billing/cash-credit">Cash / Credit Sales</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="/sales-billing/pending-payments">Pending Payments</Link>
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                        </AnimateHeight>
                                    </li>

                                    {/* 2. Expenses */}
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'expense-mgmt' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('expense-mgmt')}>
                                            <div className="flex items-center">
                                                <IconMenuInvoice className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Expenses</span>
                                            </div>

                                            <div className={currentMenu !== 'expense-mgmt' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                <IconCaretDown />
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'expense-mgmt' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <Link href="/expenses/diesel">Diesel / Fuel</Link>
                                                </li>
                                                <li>
                                                    <Link href="/expenses/machine-maintenance">Maintenance</Link>
                                                </li>
                                                {isOwnerOrManager && (
                                                    <li>
                                                        <Link href="/expenses/labour-wages">Labour Wages</Link>
                                                    </li>
                                                )}

                                                {/* <li>
                                                    <Link href="/expenses/transport-charges">Transport</Link>
                                                </li> */}
                                                <li>
                                                    <Link href="/expenses/office-misc">Office & Misc</Link>
                                                </li>
                                                <li>
                                                    <Link href="/expenses/police">Police Expense</Link>
                                                </li>
                                                <li>
                                                    <Link href="/expenses/transport-contractor">Vendor Other Expenses</Link>
                                                </li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>

                                    {/* 3. Transport Management */}
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'transport-mgmt' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('transport-mgmt')}>
                                            <div className="flex items-center">
                                                <IconMenuScrumboard className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Transport Management</span>
                                            </div>

                                            <div className={currentMenu !== 'transport-mgmt' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                <IconCaretDown />
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'transport-mgmt' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <Link href="/transport/permits">Permit Management</Link>
                                                </li>
                                                <li>
                                                    <Link href="/transport/trips">Vehicle Trip Management</Link>
                                                </li>
                                                {isOwnerOrManager && (
                                                    <>
                                                        <li>
                                                            <Link href="/transport/driver-payments">Driver Payment</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="/transport/driver-advance">Driver Advance</Link>
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                        </AnimateHeight>
                                    </li>

                                    {/* 4. Transport Vendor Management */}
                                    {isOwnerOrManager && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'vendor-mgmt' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('vendor-mgmt')}>
                                                <div className="flex items-center">
                                                    <IconMenuUsers className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Transport Vendor Manage</span>
                                                </div>

                                                <div className={currentMenu !== 'vendor-mgmt' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'vendor-mgmt' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">

                                                    <li>
                                                        <Link href="/vendors/transport">Transport Vendors</Link>
                                                    </li>

                                                    <li>
                                                        <Link href="/vendors/advance">Vendor Advance</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/vendors/payments">Vendor Payment</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/vendors/trip-search">Trip Search & Export</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/vendors/outstanding">Vendor Pending Payment</Link>
                                                    </li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* 4. Labour Management */}
                                    {isOwnerOrManager && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'labour-mgmt' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('labour-mgmt')}>
                                                <div className="flex items-center">
                                                    <IconMenuUsers className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Labour Management</span>
                                                </div>

                                                <div className={currentMenu !== 'labour-mgmt' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'labour-mgmt' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li>
                                                        <Link href="/labour/list">Labour List</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/labour/attendance">Daily Attendance</Link>
                                                    </li>

                                                    <li>
                                                        <Link href="/labour/advance">Advance Payment</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/labour/report">Labour Report</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/labour/operator-salary">Machine Operator Salary</Link>
                                                    </li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* 5. Machine & Vehicle */}
                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'asset-mgmt' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('asset-mgmt')}>
                                            <div className="flex items-center">
                                                <IconMenuWidgets className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Machine & Vehicle</span>
                                            </div>

                                            <div className={currentMenu !== 'asset-mgmt' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                <IconCaretDown />
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'asset-mgmt' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <Link href="/assets/machines">Machine Details</Link>
                                                </li>
                                                <li>
                                                    <Link href="/assets/machine-production">Machine Production</Link>
                                                </li>
                                                <li>
                                                    <Link href="/assets/vehicles">Vehicle Details</Link>
                                                </li>
                                                <li>
                                                    <Link href="/spare-parts">Spare Parts</Link>
                                                </li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>


                                    {/* Blasting Management */}
                                    {isOwnerOrManager && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'blasting-mgmt' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('blasting-mgmt')}>
                                                <div className="flex items-center">
                                                    <IconMenuWidgets className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Blasting</span>
                                                </div>
                                                <div className={currentMenu !== 'blasting-mgmt' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'blasting-mgmt' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li>
                                                        <Link href="/blasting/records">Blasting Records</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/blasting/advance">Advance</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/blasting/explosive-shop">Explosive Shop</Link>
                                                    </li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* 7. Quarry Lease Management */}
                                    {isOwnerOrManager && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'quarry-lease' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('quarry-lease')}>
                                                <div className="flex items-center">
                                                    <IconMenuPages className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Quarry Lease Mgmt</span>
                                                </div>

                                                <div className={currentMenu !== 'quarry-lease' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'quarry-lease' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li>
                                                        <Link href="/quarry-lease-settlement">Lease Settlement</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/quarry-lease-expenses">Lease Expenses</Link>
                                                    </li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* Rental Management */}
                                    <li className="nav-item">
                                        <Link href="/rentals" className="group">
                                            <div className="flex items-center">
                                                <IconMenuCalendar className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Rental Management</span>
                                            </div>
                                        </Link>
                                    </li>

                                    {isOwner && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'accounts-reports' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('accounts-reports')}>
                                                <div className="flex items-center">
                                                    <IconMenuCharts className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Accounts & Reports</span>
                                                </div>

                                                <div className={currentMenu !== 'accounts-reports' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'accounts-reports' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li>
                                                        <Link href="/accounts-reports/day-book">Day Book</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/accounts-reports/cash-flow">Cash Flow Statement</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/accounts-reports/profit-loss">Profit & Loss A/c</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/accounts-reports/summary">Monthly/Yearly Reports</Link>
                                                    </li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* 8. Masters */}
                                    {isOwnerOrManager && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'masters-mgmt' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('masters-mgmt')}>
                                                <div className="flex items-center">
                                                    <IconMenuForms className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Masters</span>
                                                </div>

                                                <div className={currentMenu !== 'masters-mgmt' ? '-rotate-90 rtl:rotate-90' : ''}>
                                                    <IconCaretDown />
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'masters-mgmt' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li>
                                                        <Link href="/masters/stone-types">Stone Types</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/masters/explosive-materials">Explosive Materials</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/masters/vehicle-categories">Vehicle Categories</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/masters/machine-categories">Machine Categories</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/masters/expense-categories">Expense Categories</Link>
                                                    </li>
                                                    {isOwner && (
                                                        <li>
                                                            <Link href="/masters/roles">User Roles</Link>
                                                        </li>
                                                    )}
                                                    <li>
                                                        <Link href="/masters/work-types">Work Types</Link>
                                                    </li>
                                                    <li>
                                                        <Link href="/masters/maintenance-types">Maintenance Types</Link>
                                                    </li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* 9. User Management */}
                                    {isOwner && (
                                        <li className="nav-item">
                                            <Link href="/users/management" className="group">
                                                <div className="flex items-center">
                                                    <IconMenuUsers className="shrink-0 group-hover:!text-primary" />
                                                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">User Management</span>
                                                </div>
                                            </Link>
                                        </li>
                                    )}

                                    {/* 10. Workflow Guide */}
                                    <li className="nav-item">
                                        <Link href="/workflow" className="group">
                                            <div className="flex items-center">
                                                <IconMenuDocumentation className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Workflow Guide</span>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
