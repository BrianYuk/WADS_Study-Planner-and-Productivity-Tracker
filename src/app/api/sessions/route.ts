import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

const sessionSchema = z.object({
  taskId: z.string().uuid().optional(),
  subject: z.string().max(100).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  durationMins: z.number().min(1).max(720).optional(),
  focusScore: z.number().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
  type: z.enum(['POMODORO', 'DEEP_WORK', 'REVIEW', 'PRACTICE', 'READING']).default('POMODORO'),
})

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    const where: Record<string, unknown> = { userId: user.sub }
    if (from || to) {
      where.startTime = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      }
    }

    const sessions = await prisma.studySession.findMany({
      where,
      include: { task: { select: { title: true, subject: true } } },
      orderBy: { startTime: 'desc' },
      take: 100,
    })

    const totalMins = sessions.reduce((sum, s) => sum + (s.durationMins || 0), 0)
    return NextResponse.json({ sessions, totalMins, count: sessions.length })
  })
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const body = await req.json()
    const validated = sessionSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const data = validated.data
    const session = await prisma.studySession.create({
      data: {
        userId: user.sub,
        taskId: data.taskId,
        subject: data.subject,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        durationMins: data.durationMins,
        focusScore: data.focusScore,
        notes: data.notes,
        type: data.type,
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  })
}
