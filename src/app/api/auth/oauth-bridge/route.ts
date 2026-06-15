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
  // Behind the CS-server reverse proxy, req.url reports the internal host
  // (0.0.0.0:3019). Use the public NEXTAUTH_URL as the redirect base so the
  // browser is sent to a reachable URL instead of 0.0.0.0:3019.
  const base = process.env.NEXTAUTH_URL || new URL(req.url).origin

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.redirect(`${base}/login?error=oauth`)
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, role: true },
  })
  if (!user) {
    return NextResponse.redirect(`${base}/login?error=oauth`)
  }

  const res = NextResponse.redirect(`${base}/dashboard`)
  await issueSession(res, user)
  return res
}
