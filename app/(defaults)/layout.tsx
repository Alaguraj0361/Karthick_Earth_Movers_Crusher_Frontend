'use client';
import ContentAnimation from '@/components/layouts/content-animation';
import Footer from '@/components/layouts/footer';
import Header from '@/components/layouts/header';
import MainContainer from '@/components/layouts/main-container';
import Overlay from '@/components/layouts/overlay';
import ScrollToTop from '@/components/layouts/scroll-to-top';
import Sidebar from '@/components/layouts/sidebar';
import Portals from '@/components/portals';
import { usePathname } from 'next/navigation';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (pathname && pathname.includes('/print/')) {
        return <div className="min-h-screen bg-[#f4f5f8] dark:bg-slate-950">{children}</div>;
    }

    return (
        <div className="relative">
            <Overlay />
            <ScrollToTop />

            {/* APP SETTING LAUNCHER REMOVED */}

            <MainContainer>
                {/* BEGIN SIDEBAR */}
                <Sidebar />
                {/* END SIDEBAR */}
                <div className="main-content flex min-h-screen flex-col">
                    {/* BEGIN TOP NAVBAR */}
                    <Header />
                    {/* END TOP NAVBAR */}

                    {/* BEGIN CONTENT AREA */}
                    <ContentAnimation>{children}</ContentAnimation>
                    {/* END CONTENT AREA */}

                    {/* BEGIN FOOTER */}
                    <Footer />
                    {/* END FOOTER */}
                    <Portals />
                </div>
            </MainContainer>
        </div>
    );
}
