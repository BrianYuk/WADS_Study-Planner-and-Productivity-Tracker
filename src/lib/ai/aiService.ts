import Groq from 'groq-sdk'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/middleware/apiMiddleware'

// Lazy Groq client — created on first use to prevent build-time crash when key absent
function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

const MODEL = 'llama-3.3-70b-versatile'

// Lets Kira create a task on the user's behalf when asked in chat
const createTaskTool: Groq.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_task',
    description: 'Create a new task, assignment, or reminder on the student\'s to-do list. Call this whenever the user explicitly asks to add, create, or schedule a task.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short, clear title for the task, e.g. "Math Homework".' },
        subject: { type: 'string', description: 'Subject or category for the task, e.g. "Math", "School". Omit if not specified.' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], description: 'Priority of the task. Default to MEDIUM if not specified.' },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format. Convert any date format given by the user (e.g. DD/MM/YYYY) into YYYY-MM-DD. Omit if no due date was given.' },
      },
      required: ['title'],
    },
  },
}

export interface CreatedTask {
  id: string
  title: string
  subject: string | null
  priority: string
  dueDate: Date | null
  status: string
}

// Parses the model's create_task tool-call arguments, creates the task, and
// returns a confirmation message for the chat reply.
async function createTaskFromArgs(userId: string, rawArgs: string): Promise<{ answer: string; task: CreatedTask | null }> {
  let args: { title?: string; subject?: string; priority?: string; dueDate?: string } = {}
  try {
    args = JSON.parse(rawArgs)
  } catch {
    return { answer: "Sorry, I couldn't quite parse that task. Could you rephrase it?", task: null }
  }

  const title = (args.title || '').trim().slice(0, 255)
  if (!title) {
    return { answer: "Sure — what would you like to call this task?", task: null }
  }

  const priority = (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).includes(args.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
    ? (args.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
    : 'MEDIUM'

  let dueDate: Date | null = null
  if (args.dueDate) {
    const parsed = new Date(args.dueDate)
    if (!isNaN(parsed.getTime())) dueDate = parsed
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: sanitizeInput(title),
      subject: args.subject ? sanitizeInput(args.subject.trim().slice(0, 100)) : null,
      priority,
      dueDate,
      tags: [],
    },
  })

  const dueStr = dueDate ? ` (due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` : ''
  const subjStr = task.subject ? ` under ${task.subject}` : ''
  const answer = `✅ Done! I've added "${task.title}"${subjStr} to your tasks${dueStr}.`

  return { answer, task }
}

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
  taskCreated?: CreatedTask
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
  const today = new Date().toISOString().slice(0, 10)
  const systemPrompt = `You are Kira, a friendly AI study companion for university students.
Help students understand difficult concepts with clear, step-by-step explanations.
Guidelines: be encouraging, use relevant examples, keep answers concise (200-400 words),
and guide students to understand rather than doing their homework for them.
Focus on the subject: ${subject}.

You can also manage the student's to-do list. If the user asks you to add, create, or schedule a task, assignment, or reminder, call the create_task function with the details extracted from their message. Today's date is ${today}; convert any date the user gives (e.g. DD/MM/YYYY) into YYYY-MM-DD format for dueDate.`

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
      tools: [createTaskTool],
      tool_choice: 'auto',
    })

    const message = response.choices[0]?.message
    const tokensUsed = response.usage?.total_tokens || 0
    const latencyMs = Date.now() - start

    const toolCall = message?.tool_calls?.find(tc => tc.function.name === 'create_task')
    if (toolCall) {
      const { answer, task } = await createTaskFromArgs(userId, toolCall.function.arguments)

      await prisma.aIAnalysis.create({
        data: {
          userId,
          type: 'STUDY_QA',
          input: JSON.parse(JSON.stringify({ question, subject })),
          output: JSON.parse(JSON.stringify({ answer, taskCreated: task?.id || null })),
          model: MODEL,
          tokensUsed,
          latencyMs,
        },
      })

      return { answer, subject, tokensUsed, latencyMs, taskCreated: task || undefined }
    }

    const answer = message?.content || 'Sorry, I could not generate an answer.'

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
