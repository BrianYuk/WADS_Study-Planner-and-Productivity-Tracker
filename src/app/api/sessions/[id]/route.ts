import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import type { JWTPayload } from '@/lib/auth'

// GET /api/sessions/[id] - Get a single study session
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const session = await prisma.studySession.findFirst({
      where: { id: params.id, userId: user.sub },
      include: { task: { select: { title: true, subject: true } } },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  })
}

// DELETE /api/sessions/[id] - Delete a study session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user: JWTPayload) => {
    const existing = await prisma.studySession.findFirst({
      where: { id: params.id, userId: user.sub },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    await prisma.studySession.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Session deleted successfully' })
  })
}
