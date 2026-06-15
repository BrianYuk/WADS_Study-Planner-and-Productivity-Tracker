import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth, sanitizeInput } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
})

// PATCH /api/tasks/[id]/subtasks/[subtaskId] - update a subtask
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const subtask = await prisma.subtask.findFirst({
      where: { id: params.subtaskId, taskId: params.id },
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = updateSubtaskSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const data = validated.data
    const updated = await prisma.subtask.update({
      where: { id: params.subtaskId },
      data: {
        ...(data.title !== undefined && { title: sanitizeInput(data.title) }),
        ...(data.completed !== undefined && { completed: data.completed }),
      },
    })

    return NextResponse.json({ subtask: updated })
  })
}

// DELETE /api/tasks/[id]/subtasks/[subtaskId] - delete a subtask
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const subtask = await prisma.subtask.findFirst({
      where: { id: params.subtaskId, taskId: params.id },
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    await prisma.subtask.delete({ where: { id: params.subtaskId } })

    return NextResponse.json({ message: 'Subtask deleted successfully' })
  })
}
