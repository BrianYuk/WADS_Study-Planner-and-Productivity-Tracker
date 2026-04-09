import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  targetDate: z.string().datetime().optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED']).optional(),
})

// GET /api/goals/[id] - Get a single goal
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const goal = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({ goal })
  })
}

// PATCH /api/goals/[id] - Update a goal (title, progress, status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = updateGoalSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const data = validated.data

    const goal = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.targetDate && { targetDate: new Date(data.targetDate) }),
        ...(data.targetValue && { targetValue: data.targetValue }),
        ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
        ...(data.unit && { unit: data.unit }),
        ...(data.status && { status: data.status }),
      },
    })

    return NextResponse.json({ goal, message: 'Goal updated successfully' })
  })
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.goal.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Goal deleted successfully' })
  })
}
