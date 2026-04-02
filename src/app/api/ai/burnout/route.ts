import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import { detectBurnoutRisk } from '@/lib/ai/aiService'
import { checkRateLimit } from '@/middleware/apiMiddleware'
import { subDays, startOfDay } from 'date-fns'

// GET /api/ai/burnout - Burnout risk analysis
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    if (!checkRateLimit(`burnout:${user.sub}`, 10, 3600000)) {
      return NextResponse.json({ error: 'Request limit reached' }, { status: 429 })
    }

    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)

    // Gather last 7 days of data
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.sub, startTime: { gte: sevenDaysAgo } },
      orderBy: { startTime: 'asc' },
    })

    const completedTasks = await prisma.task.findMany({
      where: {
        userId: user.sub,
        status: 'COMPLETED',
        updatedAt: { gte: sevenDaysAgo },
      },
    })

    const overdueTasks = await prisma.task.count({
      where: {
        userId: user.sub,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
    })

    const pendingCount = await prisma.task.count({
      where: { userId: user.sub, status: { in: ['TODO', 'IN_PROGRESS'] } },
    })

    // Build daily arrays (last 7 days)
    const dailyStudyHours: number[] = Array(7).fill(0)
    const dailyCompleted: number[] = Array(7).fill(0)
    const dailyFocus: number[] = Array(7).fill(0)
    const dailyFocusCount: number[] = Array(7).fill(0)

    sessions.forEach((s) => {
      const dayIndex = 6 - Math.floor((now.getTime() - s.startTime.getTime()) / 86400000)
      if (dayIndex >= 0 && dayIndex < 7) {
        dailyStudyHours[dayIndex] += (s.durationMins || 0) / 60
        if (s.focusScore) {
          dailyFocus[dayIndex] += s.focusScore
          dailyFocusCount[dayIndex]++
        }
      }
    })

    completedTasks.forEach((t) => {
      const dayIndex = 6 - Math.floor((now.getTime() - t.updatedAt.getTime()) / 86400000)
      if (dayIndex >= 0 && dayIndex < 7) dailyCompleted[dayIndex]++
    })

    const focusScores = dailyFocus.map((f, i) => (dailyFocusCount[i] ? f / dailyFocusCount[i] : 50))

    const analysis = await detectBurnoutRisk(user.sub, {
      dailyStudyHours: dailyStudyHours.map((h) => Math.round(h * 10) / 10),
      completedTasks: dailyCompleted,
      focusScores: focusScores.map(Math.round),
      totalPendingTasks: pendingCount,
      overdueCount: overdueTasks,
    })

    return NextResponse.json({ analysis, generatedAt: now.toISOString() })
  })
}
