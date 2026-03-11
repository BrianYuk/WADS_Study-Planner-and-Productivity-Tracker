import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth'
import { prisma } from '@/lib/db'

export type AuthenticatedRequest = NextRequest & { user: JWTPayload }

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization')
    const cookieToken = req.cookies.get('access_token')?.value
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : cookieToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    // Check user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return handler(req, payload)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export async function withAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (req, user) => {
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, user)
  })
}

// Input sanitization helper
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

// Rate limit map (simple in-memory; use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 900000 // 15 minutes
): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false

  entry.count++
  return true
}
