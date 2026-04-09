import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import { subDays, startOfWeek, eachDayOfInterval, format } from 'date-fns'

// GET /api/analytics/dashboard
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const thirtyDaysAgo = subDays(now, 30)

    const [
      taskStats,
      recentSessions,
      weeklyGoals,
      subjectBreakdown,
    ] = await Promise.all([
      // Task stats
      prisma.task.groupBy({
        by: ['status'],
        where: { userId: user.sub },
        _count: { id: true },
      }),

      // Study sessions last 7 days
      prisma.studySession.findMany({
        where: { userId: user.sub, startTime: { gte: sevenDaysAgo } },
        select: { startTime: true, durationMins: true, focusScore: true, subject: true },
        orderBy: { startTime: 'asc' },
      }),

      // Active goals
      prisma.goal.findMany({
        where: { userId: user.sub, status: 'ACTIVE' },
        take: 5,
      }),

      // Subject breakdown last 30 days
      prisma.studySession.groupBy({
        by: ['subject'],
        where: { userId: user.sub, startTime: { gte: thirtyDaysAgo }, subject: { not: null } },
        _sum: { durationMins: true },
        _count: { id: true },
        orderBy: { _sum: { durationMins: 'desc' } },
        take: 10,
      }),
    ])

    // Build daily chart data
    const days = eachDayOfInterval({ start: sevenDaysAgo, end: now })
    const dailyData = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const daySessions = recentSessions.filter(
        (s) => format(s.startTime, 'yyyy-MM-dd') === dayStr
      )
      return {
        date: dayStr,
        label: format(day, 'EEE'),
        studyMins: daySessions.reduce((sum, s) => sum + (s.durationMins || 0), 0),
        sessionCount: daySessions.length,
        avgFocus: daySessions.length
          ? Math.round(daySessions.reduce((s, x) => s + (x.focusScore || 0), 0) / daySessions.length)
          : 0,
      }
    })

    const taskMap = Object.fromEntries(taskStats.map((t) => [t.status, t._count.id]))

    return NextResponse.json({
      tasks: {
        total: Object.values(taskMap).reduce((a, b) => a + b, 0),
        todo: taskMap.TODO || 0,
        inProgress: taskMap.IN_PROGRESS || 0,
        completed: taskMap.COMPLETED || 0,
        cancelled: taskMap.CANCELLED || 0,
      },
      study: {
        totalMins7Days: recentSessions.reduce((sum, s) => sum + (s.durationMins || 0), 0),
        sessionCount7Days: recentSessions.length,
        avgFocusScore: recentSessions.length
          ? Math.round(
              recentSessions.filter((s) => s.focusScore).reduce((s, x) => s + (x.focusScore || 0), 0) /
                recentSessions.filter((s) => s.focusScore).length || 1
            )
          : 0,
      },
      dailyData,
      goals: weeklyGoals,
      subjectBreakdown: subjectBreakdown.map((s) => ({
        subject: s.subject,
        totalMins: s._sum.durationMins || 0,
        sessions: s._count.id,
      })),
    })
  })
}
