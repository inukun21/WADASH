import './globals.css';
import Sidebar from '@/components/Sidebar';
import ConditionalLayout from '@/components/ConditionalLayout';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
    title: 'WADASH - WhatsApp Bot Dashboard',
    description: 'Advanced WhatsApp Bot Control Panel',
};

import { Outfit } from 'next/font/google';
import { ReactNode } from 'react';

const outfit = Outfit({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${outfit.className} min-h-screen selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden`} suppressHydrationWarning>
                <ThemeProvider>
                    {/* Ambient Background Effects - Opacity controlled by CSS or just kept subtle */}
                    <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none opacity-50 dark:opacity-100" />
                    <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none opacity-50 dark:opacity-100" />

                    <ConditionalLayout>
                        {children}
                    </ConditionalLayout>
                </ThemeProvider>
            </body>
        </html>
    );
}
