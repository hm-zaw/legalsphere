'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkRouteAccess, getRedirectUrl, getUserFromRequest } from '@/lib/auth';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get user data from localStorage (client-side)
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('userToken');
    
    let userRole = null;
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        userRole = parsedUserData.role;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Check route access
    if (!checkRouteAccess(pathname, userRole)) {
      const redirectUrl = getRedirectUrl(userRole);
      router.push(redirectUrl);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
