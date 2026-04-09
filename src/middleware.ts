import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/',
  '/login',
  '/register',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static files
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next(), false)
  }
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  // ── Protect dashboard routes ──────────────────────────────────────────────
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    try {
      verifyToken(token)
    } catch {
      const redirect = NextResponse.redirect(new URL('/login', request.url))
      redirect.cookies.delete('access_token')
      return redirect
    }
  }

  return addSecurityHeaders(res, true)
}

// ── Security headers ──────────────────────────────────────────────────────────
// Applied to all responses. Protects against XSS, clickjacking, MIME sniffing.
function addSecurityHeaders(res: NextResponse, includeCSP: boolean): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (includeCSP) {
    // Content Security Policy — restricts which resources can be loaded
    res.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://lh3.googleusercontent.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
    )
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
