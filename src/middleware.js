import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'textail-erp-secret-key-change-in-production-2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const TOKEN_NAME = 'textail_token';

// Role-based page access rules
const ADMIN_ONLY_PAGES = ['/', '/inventory', '/reports', '/admin/users'];
const EMPLOYEE_ALLOWED_PAGES = ['/billing', '/invoices'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Allow static files, assets, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') // Static files with extensions (.png, .jpg, .css, etc.)
  ) {
    return NextResponse.next();
  }

  // 2. Allow public customer e-bill routes (for WhatsApp links opened by customers)
  if (pathname.startsWith('/bill/') || pathname.startsWith('/api/bill/')) {
    return NextResponse.next();
  }

  // 3. Allow public auth APIs (login & initial setup)
  if (pathname === '/api/auth/login' || pathname === '/api/auth/setup') {
    return NextResponse.next();
  }

  // 4. Extract token from HTTP-only cookie
  const token = request.cookies.get(TOKEN_NAME)?.value;
  let decodedUser = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      decodedUser = payload;
    } catch {
      decodedUser = null;
    }
  }

  // 5. If user visits /login:
  if (pathname === '/login') {
    if (decodedUser) {
      // Already authenticated, redirect to appropriate destination
      const redirectUrl = new URL(
        decodedUser.role === 'admin' ? '/' : '/billing',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }
    // Allow unauthenticated users to view login page
    return NextResponse.next();
  }

  // 6. If user is NOT authenticated:
  if (!decodedUser) {
    // For protected API endpoints, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please sign in with a valid account' },
        { status: 401 }
      );
    }

    // For protected web pages, redirect directly to /login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      // Invalidate expired/malformed token cookie
      response.cookies.delete(TOKEN_NAME);
    }
    return response;
  }

  // 7. Role-based route enforcement for authenticated users
  if (decodedUser.role === 'employee') {
    // Block employees from accessing admin-only pages
    const isAdminOnly = ADMIN_ONLY_PAGES.some(
      (page) => pathname === page || (page !== '/' && pathname.startsWith(page))
    );

    if (isAdminOnly) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
      // Redirect employee to their designated page (POS Billing)
      const billingUrl = new URL('/billing', request.url);
      return NextResponse.redirect(billingUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
