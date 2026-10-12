import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'textail-erp-secret-key-change-in-production-2026';
const TOKEN_NAME = 'textail_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Sign a JWT token
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE });
}

// Verify a JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

// Remove auth cookie
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

// Get current user from cookie (for API routes)
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) return null;

    return {
      _id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  } catch {
    return null;
  }
}

// Check if user has required role
export function hasRole(user, requiredRole) {
  if (!user) return false;
  if (requiredRole === 'admin') return user.role === 'admin';
  // employee role can access employee-level features; admin can access everything
  return user.role === 'admin' || user.role === 'employee';
}

// Role-based access definitions
export const PAGE_ACCESS = {
  '/': { roles: ['admin'], label: 'Dashboard' },
  '/billing': { roles: ['admin', 'employee'], label: 'New Bill (POS)' },
  '/inventory': { roles: ['admin'], label: 'Stock & Rolls' },
  '/reports': { roles: ['admin'], label: 'Sales Reports' },
  '/invoices': { roles: ['admin', 'employee'], label: 'Invoices' },
  '/admin/users': { roles: ['admin'], label: 'User Management' },
};
