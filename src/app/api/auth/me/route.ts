import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'

// GET /api/auth/me — returns the currently authenticated user
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: dbUser })
  })
}
