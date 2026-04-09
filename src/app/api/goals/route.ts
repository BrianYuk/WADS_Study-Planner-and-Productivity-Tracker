import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

const goalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  targetDate: z.string().datetime(),
  targetValue: z.number().positive(),
  unit: z.string().max(50).default('hours'),
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER']).default('WEEKLY'),
})

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const goals = await prisma.goal.findMany({
      where: { userId: user.sub },
      orderBy: { targetDate: 'asc' },
    })
    return NextResponse.json({ goals })
  })
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const body = await req.json()
    const validated = goalSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const goal = await prisma.goal.create({
      data: { userId: user.sub, ...validated.data, targetDate: new Date(validated.data.targetDate) },
    })

    return NextResponse.json({ goal }, { status: 201 })
  })
}
