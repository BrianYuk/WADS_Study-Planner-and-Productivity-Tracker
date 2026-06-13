import Groq from 'groq-sdk'
import { prisma } from '@/lib/db'

// Lazy Groq client — created on first use to prevent build-time crash when key absent
function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

const MODEL = 'llama-3.3-70b-versatile'

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
  aiScore: number
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

// ── AI FEATURE 1: Smart Task Prioritization ──────────────────────────
export async function prioritizeTasks(
  userId: string,
  tasks: TaskForPrioritization[]
): Promise<PrioritizationResult[]> {
  if (!tasks.length) return []

  const prompt = `You are Kira, an expert AI study companion. Analyze these student tasks and return a JSON array with prioritization scores.

Tasks:
${JSON.stringify(tasks, null, 2)}

For each task, evaluate urgency (due date), importance (subject, priority), effort, and status.

Return ONLY a valid JSON array (no markdown):
[{"taskId": "string", "aiScore": 0.85, "reasoning": "Due tomorrow, high priority", "suggestedOrder": 1}]

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

// ── AI FEATURE 2: Study Q&A Chat ─────────────────────────────────────
export async function answerStudyQuestion(
  userId: string,
  question: string,
  subject: string,
  history: ChatMessage[] = []
): Promise<StudyQAResult> {
  const systemPrompt = `You are Kira, a friendly AI study companion for university students.
Help students understand difficult concepts with clear, step-by-step explanations.
Guidelines: be encouraging, use relevant examples, keep answers concise (200-400 words),
and guide students to understand rather than doing their homework for them.
Focus on the subject: ${subject}.`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-6),
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

// ── AI FEATURE 3: Study Schedule Optimization ────────────────────────
export async function optimizeSchedule(
  userId: string,
  request: ScheduleRequest
): Promise<{ schedule: object[]; explanation: string }> {
  const prompt = `Create an optimized study schedule.

Tasks: ${JSON.stringify(request.tasks, null, 2)}
Available slots: ${JSON.stringify(request.availableSlots, null, 2)}
Max daily hours: ${request.preferences.maxDailyHours}

Apply spaced repetition and Pomodoro principles. Return ONLY valid JSON:
{"schedule": [{"taskId": "...", "day": "Monday", "startHour": 9, "endHour": 10, "technique": "Pomodoro"}], "explanation": "..."}`

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
