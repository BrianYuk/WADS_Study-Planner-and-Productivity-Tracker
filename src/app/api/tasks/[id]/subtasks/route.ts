import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth, sanitizeInput } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(255),
})

// POST /api/tasks/[id]/subtasks - add a subtask to a task
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = createSubtaskSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const subtask = await prisma.subtask.create({
      data: {
        taskId: params.id,
        title: sanitizeInput(validated.data.title),
      },
    })

    return NextResponse.json({ subtask }, { status: 201 })
  })
}
