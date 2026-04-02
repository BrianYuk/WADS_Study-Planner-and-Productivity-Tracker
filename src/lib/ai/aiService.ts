import OpenAI from 'openai'
import { prisma } from '@/lib/db'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── AI FEATURE 1: Smart Task Prioritization ─────────────────────────────────
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
  aiScore: number       // 0-1
  reasoning: string
  suggestedOrder: number
}

export async function prioritizeTasks(
  userId: string,
  tasks: TaskForPrioritization[]
): Promise<PrioritizationResult[]> {
  if (!tasks.length) return []

  const prompt = `You are an expert study planner AI. Analyze these student tasks and return a JSON array with prioritization scores.

Tasks:
${JSON.stringify(tasks, null, 2)}

For each task, evaluate:
1. Urgency (due date proximity)
2. Importance (subject weight, priority label)
3. Estimated effort
4. Status

Return ONLY a valid JSON array (no markdown) with this structure:
[{
  "taskId": "string",
  "aiScore": 0.85,
  "reasoning": "Due tomorrow, high priority subject",
  "suggestedOrder": 1
}]

Sort by aiScore descending. aiScore is 0-1 where 1 = most urgent.`

  const start = Date.now()
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || '[]'
    const cleaned = content.replace(/```json|```/g, '').trim()
    const results: PrioritizationResult[] = JSON.parse(cleaned)

    // Log to DB
    await prisma.aIAnalysis.create({
      data: {
        userId,
        type: 'TASK_PRIORITIZATION',
        input: { taskCount: tasks.length },
        output: { results },
        model: 'gpt-4o-mini',
        tokensUsed: response.usage?.total_tokens,
        latencyMs: Date.now() - start,
      },
    })

    return results
  } catch (err) {
    console.error('[AI] Task prioritization failed:', err)
    // Fallback: sort by due date
    return tasks.map((t, i) => ({
      taskId: t.id,
      aiScore: 1 - i * 0.1,
      reasoning: 'Fallback ordering by position',
      suggestedOrder: i + 1,
    }))
  }
}

// ── AI FEATURE 2: Burnout & Overload Detection ──────────────────────────────
export interface ProductivityPattern {
  dailyStudyHours: number[]  // last 7 days
  completedTasks: number[]   // last 7 days
  focusScores: number[]      // last 7 days avg
  totalPendingTasks: number
  overdueCount: number
}

export interface BurnoutAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  score: number  // 0-100
  insights: string[]
  recommendations: string[]
  scheduleAdjustments: string[]
}

export async function detectBurnoutRisk(
  userId: string,
  pattern: ProductivityPattern
): Promise<BurnoutAnalysis> {
  const prompt = `You are a student wellbeing and productivity AI. Analyze this student's productivity pattern and detect burnout risk.

Data (last 7 days):
- Daily study hours: ${pattern.dailyStudyHours.join(', ')}
- Completed tasks per day: ${pattern.completedTasks.join(', ')}
- Focus scores (0-100): ${pattern.focusScores.join(', ')}
- Total pending tasks: ${pattern.totalPendingTasks}
- Overdue tasks: ${pattern.overdueCount}

Analyze for:
1. Study hour consistency and fatigue
2. Task completion trends (improving/declining)
3. Focus quality changes
4. Workload sustainability

Return ONLY valid JSON (no markdown):
{
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "score": 45,
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Take a 20-min break", "..."],
  "scheduleAdjustments": ["Move 2 tasks to next week", "..."]
}`

  const start = Date.now()
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.4,
    })

    const content = response.choices[0]?.message?.content || '{}'
    const cleaned = content.replace(/```json|```/g, '').trim()
    const analysis: BurnoutAnalysis = JSON.parse(cleaned)

    await prisma.aIAnalysis.create({
      data: {
        userId,
        type: 'BURNOUT_DETECTION',
        input: pattern as unknown as Record<string, unknown>,
        output: analysis as unknown as Record<string, unknown>,
        model: 'gpt-4o-mini',
        tokensUsed: response.usage?.total_tokens,
        latencyMs: Date.now() - start,
      },
    })

    return analysis
  } catch (err) {
    console.error('[AI] Burnout detection failed:', err)
    return {
      riskLevel: 'LOW',
      score: 0,
      insights: ['Analysis temporarily unavailable'],
      recommendations: ['Continue your current study routine'],
      scheduleAdjustments: [],
    }
  }
}

// ── AI FEATURE 3: Study Schedule Optimization ───────────────────────────────
export interface ScheduleRequest {
  tasks: TaskForPrioritization[]
  availableSlots: { day: string; startHour: number; endHour: number }[]
  preferences: { maxDailyHours: number; preferredSubjects?: string[] }
}

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

Return ONLY valid JSON:
{
  "schedule": [
    {"taskId": "...", "day": "Monday", "startHour": 9, "endHour": 10, "technique": "Pomodoro"}
  ],
  "explanation": "Brief explanation of the schedule rationale"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
