import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/auth/supabase';
import { hasRequiredRole, getRoleFromMetadata } from '@/lib/auth/session';

const publicPaths = ['/', '/login'];
const publicApiPaths = ['/api/health', '/api/auth/login', '/api/auth/logout', '/api/auth/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const supabase = await createMiddlewareClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  const role = getRoleFromMetadata(user?.user_metadata?.role);
  const userSession = user ? { id: user.id, email: user.email ?? '', role: role ?? 'staff' } : null;

  if (pathname.startsWith('/_next') || pathname.includes('/favicon')) {
    return response;
  }

  if (pathname.startsWith('/api/')) {
    if (publicApiPaths.includes(pathname)) {
      return response;
    }

    if (!userSession || !hasRequiredRole(userSession, 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return response;
  }

  if (publicPaths.includes(pathname)) {
    return response;
  }

  if (!userSession || !hasRequiredRole(userSession, 'staff')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
