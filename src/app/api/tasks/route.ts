import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import { sanitizeInput } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  subject: z.string().max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  estimatedMins: z.number().min(1).max(1440).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
})

// GET /api/tasks - list user's tasks
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const subject = url.searchParams.get('subject')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)

    const where: Record<string, unknown> = { userId: user.sub }
    if (status) where.status = status
    if (subject) where.subject = { contains: subject, mode: 'insensitive' }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { subtasks: true },
        orderBy: [{ aiPriority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json({
      tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  })
}

// POST /api/tasks - create task
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const body = await req.json()
    const validated = createTaskSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const data = validated.data
    const task = await prisma.task.create({
      data: {
        userId: user.sub,
        title: sanitizeInput(data.title),
        description: data.description ? sanitizeInput(data.description) : null,
        subject: data.subject ? sanitizeInput(data.subject) : null,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedMins: data.estimatedMins,
        tags: data.tags,
      },
      include: { subtasks: true },
    })

    return NextResponse.json({ task }, { status: 201 })
  })
}
