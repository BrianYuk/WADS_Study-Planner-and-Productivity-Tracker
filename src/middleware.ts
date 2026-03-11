import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/',
  '/login',
  '/register',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Add security headers to all responses
  const res = NextResponse.next()
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    try {
      verifyToken(token)
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('access_token')
      return response
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
