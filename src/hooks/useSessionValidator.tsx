'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const VALIDATION_INTERVAL = 30000; // 30 seconds

export function useSessionValidator() {
    const router = useRouter();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const validateSession = async () => {
            try {
                const response = await fetch('/api/auth/validate');
                const data = await response.json();

                if (!data.valid) {
                    console.log('[Session Validator] Session invalid:', data.reason);

                    // Clear cookies and logout
                    await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'logout' })
                    });

                    // Clear local storage
                    if (typeof window !== 'undefined') {
                        localStorage.clear();
                    }

                    // Redirect to login
                    router.push('/login?reason=account_deleted');
                }
            } catch (error) {
                console.error('[Session Validator] Error:', error);
            }
        };

        // Initial validation
        validateSession();

        // Set up periodic validation
        intervalRef.current = setInterval(validateSession, VALIDATION_INTERVAL);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [router]);
}
