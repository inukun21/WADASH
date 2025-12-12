'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { ReactNode } from 'react';
import { useSessionValidator } from '@/hooks/useSessionValidator';

export default function ConditionalLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Pages that should not have sidebar
    const noSidebarPages = ['/login', '/signup', '/register'];
    const shouldShowSidebar = !noSidebarPages.includes(pathname);

    // Enable session validation only for authenticated pages
    if (shouldShowSidebar) {
        useSessionValidator();
    }

    if (!shouldShowSidebar) {
        // Render without sidebar for login/signup pages
        return <>{children}</>;
    }

    // Render with sidebar for dashboard pages
    return (
        <div className="flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8 pb-32 md:pb-8 relative z-10">
                {children}
            </main>
        </div>
    );
}
