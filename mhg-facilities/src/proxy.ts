import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Update session and get user
  const { user, supabaseResponse } = await updateSession(request)

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Check if the current path is a protected route (dashboard, etc.)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/locations') ||
    pathname.startsWith('/tickets') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/vendors') ||
    pathname.startsWith('/compliance') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings')

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserve the original URL as a redirect parameter
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}
