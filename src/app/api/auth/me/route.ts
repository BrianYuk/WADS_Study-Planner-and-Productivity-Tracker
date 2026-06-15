import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth, sanitizeInput } from '@/middleware/apiMiddleware'

export const dynamic = 'force-dynamic'

// GET /api/auth/me — returns the currently authenticated user
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, name: true, email: true, role: true, timezone: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: dbUser })
  })
}

const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  timezone: z.string().min(1).max(50).optional(),
})

// PATCH /api/auth/me — updates the current user's profile
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const body = await req.json()
    const validated = updateMeSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const data = validated.data
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const dbUser = await prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(data.name && { name: sanitizeInput(data.name) }),
        ...(data.timezone && { timezone: data.timezone }),
      },
      select: { id: true, name: true, email: true, role: true, timezone: true },
    })

    return NextResponse.json({ user: dbUser, message: 'Profile updated successfully' })
  })
}
