import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/middleware/apiMiddleware'
import { prioritizeTasks } from '@/lib/ai/aiService'
import { checkRateLimit } from '@/middleware/apiMiddleware'

// POST /api/ai/prioritize - AI task prioritization
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    // Stricter rate limit for AI endpoints
    if (!checkRateLimit(`ai:${user.sub}`, 20, 3600000)) {
      return NextResponse.json({ error: 'AI request limit reached. Try again later.' }, { status: 429 })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: user.sub, status: { in: ['TODO', 'IN_PROGRESS'] } },
      select: {
        id: true,
        title: true,
        subject: true,
        priority: true,
        dueDate: true,
        estimatedMins: true,
        status: true,
      },
      take: 50,
    })

    if (!tasks.length) {
      return NextResponse.json({ message: 'No active tasks to prioritize', results: [] })
    }

    const results = await prioritizeTasks(user.sub, tasks)

    // Update tasks with AI scores
    await Promise.all(
      results.map((r) =>
        prisma.task.update({
          where: { id: r.taskId, userId: user.sub },
          data: { aiPriority: r.aiScore },
        })
      )
    )

    return NextResponse.json({ results, tasksAnalyzed: tasks.length })
  })
}
