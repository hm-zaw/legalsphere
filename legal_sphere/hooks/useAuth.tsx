import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const userDataStr = localStorage.getItem('userData');
      
      if (!token || !userDataStr) {
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userDataStr);
      setUser(userData);
    } catch (error) {
      console.error('Error checking authentication:', error);
      // Clear invalid data
      localStorage.removeItem('userToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userData');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userData');
    
    // Clear cookies
    document.cookie = 'userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    setUser(null);
    router.push('/login');
  };

  const hasRole = (requiredRole: string) => {
    return user?.role === requiredRole;
  };

  const canAccess = (allowedRoles: string[]) => {
    return user?.role && allowedRoles.includes(user.role);
  };

  return {
    user,
    loading,
    logout,
    hasRole,
    canAccess,
    isAuthenticated: !!user,
    checkAuth
  };
}

// Higher-order component for route protection
export function withRoleProtection(WrappedComponent: React.ComponentType<any>, allowedRoles: string[]) {
  return function ProtectedRoute(props: any) {
    const { user, loading, isAuthenticated, canAccess } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        if (!canAccess(allowedRoles)) {
          // Redirect to appropriate dashboard based on user role
          const redirectPath = getRedirectPath(user?.role);
          router.push(redirectPath);
          return;
        }
      }
    }, [loading, isAuthenticated, user, canAccess, router]);

    if (loading) {
      return <div className="min-h-screen bg-[#efefec] flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated || !canAccess(allowedRoles)) {
      return null; // Will redirect
    }

    return <WrappedComponent {...props} />;
  };
}

function getRedirectPath(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin-dashboard';
    case 'lawyer':
      return '/lawyer-dashboard';
    case 'client':
    case 'user':
      return '/dashboard';
    default:
      return '/login';
  }
}
