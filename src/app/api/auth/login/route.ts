import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { comparePassword, issueSession } from '@/lib/auth'
import { checkRateLimit } from '@/middleware/apiMiddleware'

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  // Rate limit: 10 login attempts per 15 minutes per IP
  if (!checkRateLimit(`login:${ip}`, 10, 900000)) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait 15 minutes.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const validated = loginSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 })
    }

    const { email, password } = validated.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    })

    // Always run compare to prevent timing attacks
    const passwordMatch = user
      ? await comparePassword(password, user.passwordHash)
      : await comparePassword(password, '$2b$12$invalidhashfortimingatk')

    if (!user || !passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      message: 'Login successful',
    })

    await issueSession(res, user)

    return res
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
