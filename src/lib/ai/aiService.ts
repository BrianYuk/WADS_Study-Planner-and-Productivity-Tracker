import Groq from 'groq-sdk'
import { prisma } from '@/lib/db'

// ── Lazy Groq client ──────────────────────────────────────────────────────────
// Created on first use to prevent build-time crash when API key is absent
function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

const MODEL = 'llama-3.3-70b-versatile' // Free Groq model

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TaskForPrioritization {
  id: string
  title: string
  subject?: string | null
  priority: string
  dueDate?: Date | null
  estimatedMins?: number | null
  status: string
}

export interface PrioritizationResult {
  taskId: string
  aiScore: number       // 0-1, higher = more urgent
  reasoning: string
  suggestedOrder: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StudyQAResult {
  answer: string
  subject: string
  tokensUsed: number
  latencyMs: number
}

export interface ScheduleRequest {
  tasks: TaskForPrioritization[]
  availableSlots: { day: string; startHour: number; endHour: number }[]
  preferences: { maxDailyHours: number; preferredSubjects?: string[] }
}

// ── AI FEATURE 1: Smart Task Prioritization ───────────────────────────────────
// Analyzes student tasks and returns AI-scored prioritization
export async function prioritizeTasks(
  userId: string,
  tasks: TaskForPrioritization[]
): Promise<PrioritizationResult[]> {
  if (!tasks.length) return []

  const prompt = `You are Kira, an expert AI study companion. Analyze these student tasks and return a JSON array with prioritization scores.

Tasks:
${JSON.stringify(tasks, null, 2)}

For each task, evaluate:
1. Urgency (due date proximity)
2. Importance (subject weight, priority label)
3. Estimated effort
4. Current status

Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[{
  "taskId": "string",
  "aiScore": 0.85,
  "reasoning": "Due tomorrow, high priority subject",
  "suggestedOrder": 1
}]

Sort by aiScore descending. aiScore is 0-1 where 1 = most urgent.`

  const start = Date.now()
  try {
    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || '[]'
    const cleaned = content.replace(/```json|```/g, '').trim()
    const results: PrioritizationResult[] = JSON.parse(cleaned)

    await prisma.aIAnalysis.create({
      data: {
        userId,
        type: 'TASK_PRIORITIZATION',
        input: { taskCount: tasks.length },
        output: JSON.parse(JSON.stringify({ results })),
        model: MODEL,
        tokensUsed: response.usage?.total_tokens,
        latencyMs: Date.now() - start,
      },
    })

    return results
  } catch (err) {
    console.error('[AI] Task prioritization failed:', err)
    return tasks.map((t, i) => ({
      taskId: t.id,
      aiScore: 1 - i * 0.1,
      reasoning: 'Fallback ordering by position',
      suggestedOrder: i + 1,
    }))
  }
}

// ── AI FEATURE 2: Study Q&A Chat ──────────────────────────────────────────────
// Kira answers study questions with step-by-step explanations
export async function answerStudyQuestion(
  userId: string,
  question: string,
  subject: string,
  history: ChatMessage[] = []
): Promise<StudyQAResult> {
  const systemPrompt = `You are Kira, a friendly and knowledgeable AI study companion for university students. 
Your role is to help students understand difficult concepts, solve problems, and improve their study skills.

Guidelines:
- Give clear, step-by-step explanations
- Use examples relevant to the student's level
- Be encouraging and supportive
- If asked about ${subject}, focus on that subject context
- Keep answers concise but complete (200-400 words max)
- Never do homework for students — guide them to understand instead`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-6), // Keep last 6 messages for context
    { role: 'user' as const, content: question },
  ]

  const start = Date.now()
  try {
    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const answer = response.choices[0]?.message?.content || 'Sorry, I could not generate an answer.'
    const tokensUsed = response.usage?.total_tokens || 0
    const latencyMs = Date.now() - start

    await prisma.aIAnalysis.create({
      data: {
        userId,
        type: 'STUDY_QA',
        input: JSON.parse(JSON.stringify({ question, subject })),
        output: JSON.parse(JSON.stringify({ answer, tokensUsed })),
        model: MODEL,
        tokensUsed,
        latencyMs,
      },
    })

    return { answer, subject, tokensUsed, latencyMs }
  } catch (err) {
    console.error('[AI] Study Q&A failed:', err)
    return {
      answer: 'Sorry, I am temporarily unavailable. Please try again in a moment.',
      subject,
      tokensUsed: 0,
      latencyMs: Date.now() - start,
    }
  }
}

// ── AI FEATURE 3: Study Schedule Optimization ─────────────────────────────────
// Creates an optimized study schedule using AI
export async function optimizeSchedule(
  userId: string,
  request: ScheduleRequest
): Promise<{ schedule: object[]; explanation: string }> {
  const prompt = `Create an optimized study schedule for a student.

Tasks to schedule:
${JSON.stringify(request.tasks, null, 2)}

Available time slots:
${JSON.stringify(request.availableSlots, null, 2)}

Preferences:
- Max daily study hours: ${request.preferences.maxDailyHours}
- Preferred subjects first: ${request.preferences.preferredSubjects?.join(', ') || 'none'}

Apply spaced repetition, cognitive load balancing, and Pomodoro principles.

Return ONLY valid JSON (no markdown):
{
  "schedule": [
    {"taskId": "...", "day": "Monday", "startHour": 9, "endHour": 10, "technique": "Pomodoro"}
  ],
  "explanation": "Brief explanation of the schedule rationale"
}`

  try {
    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content || '{}'
    const cleaned = content.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('[AI] Schedule optimization failed:', err)
    return { schedule: [], explanation: 'Schedule optimization temporarily unavailable.' }
  }
}
