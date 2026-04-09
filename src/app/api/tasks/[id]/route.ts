import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import { sanitizeInput } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  subject: z.string().max(100).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMins: z.number().min(1).max(1440).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

// GET /api/tasks/[id] - Get a single task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: user.sub },
      include: { subtasks: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  })
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = updateTaskSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const data = validated.data

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(data.title && { title: sanitizeInput(data.title) }),
        ...(data.description !== undefined && {
          description: data.description ? sanitizeInput(data.description) : null,
        }),
        ...(data.subject !== undefined && {
          subject: data.subject ? sanitizeInput(data.subject) : null,
        }),
        ...(data.priority && { priority: data.priority }),
        ...(data.status && { status: data.status }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.estimatedMins !== undefined && { estimatedMins: data.estimatedMins }),
        ...(data.tags && { tags: data.tags }),
      },
      include: { subtasks: true },
    })

    return NextResponse.json({ task, message: 'Task updated successfully' })
  })
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Task deleted successfully' })
  })
}
