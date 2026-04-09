import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, signAccessToken, signRefreshToken, isValidPassword } from '@/lib/auth'
import { checkRateLimit, sanitizeInput } from '@/middleware/apiMiddleware'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`register:${ip}`, 5, 3600000)) {
    return NextResponse.json({ error: 'Too many registration attempts' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const validated = registerSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const { name, email, password } = validated.data

    // Password strength
    if (!isValidPassword(password)) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      }, { status: 400 })
    }

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const safeName = sanitizeInput(name)

    const user = await prisma.user.create({
      data: {
        name: safeName,
        email,
        passwordHash,
        preferences: { create: {} }, // default preferences
      },
      select: { id: true, name: true, email: true, role: true },
    })

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })
    const refreshToken = signRefreshToken(user.id)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const res = NextResponse.json({ user, message: 'Registration successful' }, { status: 201 })
    res.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    })
    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/api/auth',
    })

    return res
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
