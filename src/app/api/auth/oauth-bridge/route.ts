import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/db'
import { issueSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Bridges a NextAuth (Google) session into this app's access_token /
// refresh_token cookies, so middleware and withAuth-protected API routes
// work the same regardless of how the user signed in.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/login?error=oauth', req.url))
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, role: true },
  })

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=oauth', req.url))
  }

  const res = NextResponse.redirect(new URL('/dashboard', req.url))

  await issueSession(res, user)

  return res
}
