import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ZodError } from 'zod'

export type AuthenticatedRequest = NextRequest & { user: JWTPayload }

// ── Auth middleware ───────────────────────────────────────────────────────────
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader  = req.headers.get('authorization')
    const cookieToken = req.cookies.get('access_token')?.value
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : cookieToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    // Verify user still exists in database
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return handler(req, payload)
  } catch (err) {
    return handleApiError(err)
  }
}

// ── Admin-only middleware ─────────────────────────────────────────────────────
export async function withAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (req, user) => {
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
    }
    return handler(req, user)
  })
}

// ── Centralised error handler ─────────────────────────────────────────────────
// Catches all known error types and returns consistent JSON error responses.
// Prevents stack traces and internal details leaking to the client.
export function handleApiError(err: unknown): NextResponse {
  // Zod validation errors — 400
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: err.flatten() },
      { status: 400 }
    )
  }

  // JWT errors — 401
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  if (err instanceof Error && err.name === 'TokenExpiredError') {
    return NextResponse.json({ error: 'Token expired' }, { status: 401 })
  }

  // Prisma known errors
  const prismaCode = (err as { code?: string })?.code
  if (prismaCode) {
    switch (prismaCode) {
      case 'P2002':
        // Unique constraint violation (e.g. duplicate email)
        return NextResponse.json({ error: 'A record with this value already exists' }, { status: 409 })
      case 'P2025':
        // Record not found
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      case 'P2003':
        // Foreign key constraint violation
        return NextResponse.json({ error: 'Related resource not found' }, { status: 400 })
      case 'P1001':
      case 'P1002':
      case 'P1008':
        // Database connection error (Neon cold start)
        console.error('[DB] Connection error:', prismaCode)
        return NextResponse.json(
          { error: 'Database temporarily unavailable. Please try again.' },
          { status: 503 }
        )
    }
  }

  // Generic server error — log full details server-side, return vague message to client
  console.error('[API] Unhandled error:', err)
  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  )
}

// ── Input sanitization ────────────────────────────────────────────────────────
// Escapes HTML special characters to prevent stored XSS attacks.
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

// ── Deep sanitization for objects ────────────────────────────────────────────
// Recursively sanitizes all string values in an object.
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) => (typeof v === 'string' ? sanitizeInput(v) : v))
    } else {
      result[key] = value
    }
  }
  return result as T
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
// In-memory rate limiter. Simple and effective for single-instance deployments.
// For multi-instance production: replace with Redis-backed rate limiter.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 900000 // 15 minutes default
): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false

  entry.count++
  return true
}

// Returns the remaining requests and reset time for a given identifier
export function getRateLimitInfo(identifier: string, maxRequests = 100): {
  remaining: number
  resetAt: number
} {
  const entry = rateLimitMap.get(identifier)
  if (!entry || entry.resetAt < Date.now()) {
    return { remaining: maxRequests, resetAt: Date.now() }
  }
  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt:   entry.resetAt,
  }
}
