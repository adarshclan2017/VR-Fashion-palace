'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

const PAGE_ACCESS = {
  '/': { roles: ['admin'] },
  '/billing': { roles: ['admin', 'employee'] },
  '/inventory': { roles: ['admin'] },
  '/reports': { roles: ['admin'] },
  '/invoices': { roles: ['admin', 'employee'] },
  '/admin/users': { roles: ['admin'] },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Route protection
  useEffect(() => {
    if (loading) return;

    // Don't redirect on login page
    if (pathname === '/login') {
      if (user) {
        // Already logged in, redirect to appropriate home
        router.replace(user.role === 'admin' ? '/' : '/billing');
      }
      return;
    }

    // Not logged in → redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check page access
    const access = PAGE_ACCESS[pathname];
    if (access && !access.roles.includes(user.role)) {
      // No access → redirect employee to billing, admin to home
      router.replace(user.role === 'admin' ? '/' : '/billing');
    }
  }, [user, loading, pathname, router]);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.replace('/login');
  };

  const canAccess = (path) => {
    if (!user) return false;
    const access = PAGE_ACCESS[path];
    if (!access) return true;
    return access.roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canAccess, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
