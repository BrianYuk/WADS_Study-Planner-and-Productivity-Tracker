import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.sub },
      orderBy: { sentAt: 'desc' },
      take: 50,
    })
    const unreadCount = notifications.filter((n) => !n.isRead).length
    return NextResponse.json({ notifications, unreadCount })
  })
}

// PATCH /api/notifications - mark all as read
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await prisma.notification.updateMany({
      where: { userId: user.sub, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    return NextResponse.json({ message: 'All notifications marked as read' })
  })
}
