import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/middleware/apiMiddleware'
import { answerStudyQuestion } from '@/lib/ai/aiService'
import { checkRateLimit } from '@/middleware/apiMiddleware'

const chatSchema = z.object({
  question: z.string().min(1).max(1000),
  subject:  z.string().max(100).default('General'),
  history:  z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).default([]),
})

// POST /api/ai/chat — Kira study Q&A
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    // Rate limit: 30 questions per hour per user
    if (!checkRateLimit(`ai-chat:${user.sub}`, 30, 3600000)) {
      return NextResponse.json(
        { error: 'Chat limit reached. Try again in an hour.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const validated = chatSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { question, subject, history } = validated.data
    const result = await answerStudyQuestion(user.sub, question, subject, history)

    return NextResponse.json(result)
  })
}
