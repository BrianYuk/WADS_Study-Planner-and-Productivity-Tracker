import Groq from 'groq-sdk'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/middleware/apiMiddleware'

// Lazy Groq client — created on first use to prevent build-time crash when key absent
function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

const MODEL = 'llama-3.3-70b-versatile'

// Lets Kira create one or more tasks on the user's behalf when asked in chat
const createTaskTool: Groq.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_task',
    description: 'Create one or more tasks, assignments, or reminders on the student\'s to-do list. Pass every task the user mentions in this single call via the tasks array, even if there is only one. Call this whenever the user explicitly asks to add, create, or schedule a task — NOT for a longer-term goal/mission (use create_mission for those).',
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: 'One entry per task to create.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Short, clear title for the task, e.g. "Math Homework".' },
              description: { type: 'string', description: 'Optional longer description or notes about the task.' },
              subject: { type: 'string', description: 'Subject or category, e.g. "Math", "Programming". Omit if not specified.' },
              priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], description: 'Priority level. Default MEDIUM if not specified.' },
              dueDate: { type: 'string', description: 'Due date and time in ISO 8601 format YYYY-MM-DDTHH:MM. Convert any format (DD/MM/YYYY, "tomorrow", "next Monday") using today\'s date. Use T23:59 if only a date is given. Omit if no due date was given.' },
              estimatedMins: { type: 'number', description: 'Estimated completion time in minutes. Omit if not specified.' },
              subtasks: { type: 'array', items: { type: 'string' }, description: 'Optional list of subtask titles. Use when the user lists steps, or when breaking down a complex task would be helpful.' },
            },
            required: ['title'],
          },
        },
      },
      required: ['tasks'],
    },
  },
}

// Lets Kira create one or more missions (Goal records, shown as "Mission" in the UI) on the user's behalf
const createMissionTool: Groq.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_mission',
    description: 'Create one or more missions for the student — longer-term goals tracked toward a measurable target by a target date, e.g. "Study 20 hours this week" or "Read 5 chapters by finals". Pass every mission the user mentions in this single call via the missions array, even if there is only one. Use this when the user asks to set a goal, mission, or target — NOT for a single to-do item (use create_task for those).',
    parameters: {
      type: 'object',
      properties: {
        missions: {
          type: 'array',
          description: 'One entry per mission to create.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Short, clear title for the mission, e.g. "Study 20 hours this week".' },
              description: { type: 'string', description: 'Optional longer description or notes about the mission.' },
              targetDate: { type: 'string', description: 'Target date by which the mission should be completed, in ISO 8601 format YYYY-MM-DDTHH:MM. Convert any format ("by Friday", "end of month", DD/MM/YYYY) using today\'s date. Use T23:59 if only a date is given. Required.' },
              targetValue: { type: 'number', description: 'The numeric target to reach, e.g. 20 for "20 hours". Default to 1 if the user gives no measurable amount.' },
              unit: { type: 'string', description: 'Unit for the target value, e.g. "hours", "chapters", "sessions". Default "hours" if not specified.' },
              type: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER'], description: 'How often the mission resets/applies. Default WEEKLY if not specified.' },
            },
            required: ['title', 'targetDate'],
          },
        },
      },
      required: ['missions'],
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

interface TaskItemArgs {
  title?: string
  description?: string
  subject?: string
  priority?: string
  dueDate?: string
  estimatedMins?: number
  subtasks?: string[]
}

// Parses the model's create_task tool-call arguments (one or more tasks),
// creates them, and returns a combined confirmation message for the chat reply.
async function createTasksFromArgs(userId: string, rawArgs: string): Promise<{ answer: string; tasks: CreatedTask[] }> {
  let args: { tasks?: TaskItemArgs[] } = {}
  try {
    args = JSON.parse(rawArgs)
  } catch {
    return { answer: "Sorry, I couldn't quite parse that. Could you rephrase it?", tasks: [] }
  }

  const items = Array.isArray(args.tasks) ? args.tasks.slice(0, 20) : []
  const created: CreatedTask[] = []
  const lines: string[] = []

  for (const item of items) {
    const title = (item.title || '').trim().slice(0, 255)
    if (!title) continue

    const priority = (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).includes(item.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
      ? (item.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
      : 'MEDIUM'

    let dueDate: Date | null = null
    if (item.dueDate) {
      // The model returns a local datetime string with no timezone (e.g. "2026-02-26T23:59").
      // Pin it to Asia/Jakarta (UTC+7) so it isn't misread as UTC and shifted a day.
      const raw = item.dueDate.trim()
      const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)
      const parsed = new Date(hasTz ? raw : `${raw}+07:00`)
      if (!isNaN(parsed.getTime())) dueDate = parsed
    }

    const estimatedMins = item.estimatedMins && item.estimatedMins > 0 ? Math.round(item.estimatedMins) : null

    const task = await prisma.task.create({
      data: {
        userId,
        title: sanitizeInput(title),
        description: item.description ? sanitizeInput(item.description.trim().slice(0, 2000)) : null,
        subject: item.subject ? sanitizeInput(item.subject.trim().slice(0, 100)) : null,
        priority,
        dueDate,
        estimatedMins,
        tags: [],
      },
    })

    const subtaskTitles = (item.subtasks || [])
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 100)
    if (subtaskTitles.length > 0) {
      await prisma.subtask.createMany({
        data: subtaskTitles.map(st => ({
          taskId: task.id,
          title: sanitizeInput(st.trim().slice(0, 255)),
        })),
      })
    }

    created.push(task)

    const dueStr = dueDate
      ? `, due ${dueDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`
      : ''
    const subjStr = task.subject ? ` under ${task.subject}` : ''
    const estStr = estimatedMins
      ? ` (~${estimatedMins < 60 ? `${estimatedMins}m` : `${Math.floor(estimatedMins / 60)}h${estimatedMins % 60 ? ` ${estimatedMins % 60}m` : ''}`})`
      : ''
    const subtasksStr = subtaskTitles.length > 0 ? ` with ${subtaskTitles.length} subtask${subtaskTitles.length > 1 ? 's' : ''}` : ''
    lines.push(`"${task.title}"${subjStr}${estStr}${subtasksStr}${dueStr}`)
  }

  if (created.length === 0) {
    return { answer: "Sure — what would you like to call this task?", tasks: [] }
  }

  const answer = created.length === 1
    ? `✅ Done! I've added ${lines[0]} to your tasks.`
    : `✅ Done! I've added ${created.length} tasks:\n${lines.map(l => `- ${l}`).join('\n')}`

  return { answer, tasks: created }
}

export interface CreatedMission {
  id: string
  title: string
  targetDate: Date
  targetValue: number
  unit: string
  type: string
  status: string
}

interface MissionItemArgs {
  title?: string
  description?: string
  targetDate?: string
  targetValue?: number
  unit?: string
  type?: string
}

// Parses the model's create_mission tool-call arguments (one or more missions),
// creates them (Goal records), and returns a combined confirmation message.
async function createMissionsFromArgs(userId: string, rawArgs: string): Promise<{ answer: string; missions: CreatedMission[] }> {
  let args: { missions?: MissionItemArgs[] } = {}
  try {
    args = JSON.parse(rawArgs)
  } catch {
    return { answer: "Sorry, I couldn't quite parse that. Could you rephrase it?", missions: [] }
  }

  const items = Array.isArray(args.missions) ? args.missions.slice(0, 20) : []
  const created: CreatedMission[] = []
  const lines: string[] = []

  for (const item of items) {
    const title = (item.title || '').trim().slice(0, 200)
    if (!title) continue

    let targetDate: Date | null = null
    if (item.targetDate) {
      // Same local-time pinning as task due dates — see createTasksFromArgs.
      const raw = item.targetDate.trim()
      const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)
      const parsed = new Date(hasTz ? raw : `${raw}+07:00`)
      if (!isNaN(parsed.getTime())) targetDate = parsed
    }
    if (!targetDate) continue

    const targetValue = item.targetValue && item.targetValue > 0 ? item.targetValue : 1
    const unit = item.unit ? sanitizeInput(item.unit.trim().slice(0, 50)) : 'hours'
    const type = (['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER'] as const).includes(item.type as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER')
      ? (item.type as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER')
      : 'WEEKLY'

    const mission = await prisma.goal.create({
      data: {
        userId,
        title: sanitizeInput(title),
        description: item.description ? sanitizeInput(item.description.trim().slice(0, 500)) : null,
        targetDate,
        targetValue,
        unit,
        type,
      },
    })

    created.push(mission)

    const dateStr = targetDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    lines.push(`"${mission.title}" — reach ${targetValue} ${unit} by ${dateStr}`)
  }

  if (created.length === 0) {
    return { answer: "Sure — what would you like to call this mission, and by when?", missions: [] }
  }

  const answer = created.length === 1
    ? `🎯 Mission accepted! I've set ${lines[0]}.`
    : `🎯 Missions accepted! I've set ${created.length} missions:\n${lines.map(l => `- ${l}`).join('\n')}`

  return { answer, missions: created }
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
  tasksCreated?: CreatedTask[]
  missionsCreated?: CreatedMission[]
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

// ── Profanity / aggression guard for chat ────────────────────────────
// Deterministic local check run before calling the model — cheaper, faster,
// and guarantees a consistent, recognizable response (not subject to the
// model's interpretation of "be nice").
const PROFANITY_PATTERN = /\b(fuck(?:ing|er|ed)?|bullshit|shit(?:ty)?|bitch(?:es)?|asshole|ass|prick|twat|wanker|bollocks|arse|bastard|dick(?:head)?|piss(?:ed)?|douche(?:bag)?|cunt|slut|whore|retard(?:ed)?|dumbass|jackass|motherfucker|goddamn|dammit|wtf|stfu|ffs)\b/i
const AGGRESSION_PATTERN = /\b(shut up|shut your mouth|i hate you|you suck|screw you|piss off|get lost|go to hell|kill yourself|(?:you'?re|you are) (?:useless|worthless|garbage|trash|stupid|dumb|an idiot))\b/i

function isProfaneOrAggressive(text: string): boolean {
  return PROFANITY_PATTERN.test(text) || AGGRESSION_PATTERN.test(text)
}

const LEMON_JOKES = [
  "When life gives you lemons, don't make lemonade — turn them into stress balls. Cheaper than therapy, and way more citrusy.",
  "I told my lemon tree about my deadlines. It dropped a lemon on my head and said nothing. Brutal, but fair. Take five minutes and breathe.",
  "They say when life hands you lemons, make lemonade. I say negotiate for the sugar first — self-care isn't optional.",
  "Why did the lemon stop rolling downhill? It ran out of juice. Recharge for a bit — you've got more juice than you think.",
  "Life: 'Here's a lemon.' Me: 'I'm allergic to bad days.' Life: 'Too bad.' Me, five minutes later, sipping lemonade: 'okay, fine, this is actually nice.'",
  "A lemon walks into a study session. Everyone says 'you're looking a little sour today.' It says 'yeah, but I'm still squeezing the most out of it.'",
]

function supportiveResponse(): string {
  const joke = LEMON_JOKES[Math.floor(Math.random() * LEMON_JOKES.length)]
  return `Hey friend, I'm here to help and support you, and I want to make sure you have a positive experience. Here's something to cheer you up:\n\n${joke}`
}

// ── AI FEATURE 2: Study Q&A Chat ─────────────────────────────────────
export async function answerStudyQuestion(
  userId: string,
  question: string,
  subject: string,
  history: ChatMessage[] = []
): Promise<StudyQAResult> {
  // Use the user's local date (Asia/Jakarta, UTC+7) so "tomorrow"/"today" are
  // computed correctly. toISOString() would give UTC, which is up to a day behind.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const start = Date.now()

  try {
    if (isProfaneOrAggressive(question)) {
      const answer = supportiveResponse()
      const latencyMs = Date.now() - start

      await prisma.aIAnalysis.create({
        data: {
          userId,
          type: 'STUDY_QA',
          input: JSON.parse(JSON.stringify({ question, subject, flagged: true })),
          output: JSON.parse(JSON.stringify({ answer })),
          model: MODEL,
          tokensUsed: 0,
          latencyMs,
        },
      })

      return { answer, subject, tokensUsed: 0, latencyMs }
    }

    const [openTasks, doneTasks] = await Promise.all([
      prisma.task.findMany({
        where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 30,
        select: { title: true, subject: true, priority: true, status: true, dueDate: true },
      }),
      prisma.task.findMany({
        where: { userId, status: 'COMPLETED' },
        orderBy: { updatedAt: 'desc' },
        take: 15,
        select: { title: true, subject: true },
      }),
    ])

    const taskContext = `Uncompleted tasks (${openTasks.length}):
${openTasks.length ? openTasks.map(t => `- ${t.title}${t.subject ? ` [${t.subject}]` : ''} (${t.status}, ${t.priority}${t.dueDate ? `, due ${t.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''})`).join('\n') : 'None'}

Recently completed tasks (${doneTasks.length}):
${doneTasks.length ? doneTasks.map(t => `- ${t.title}${t.subject ? ` [${t.subject}]` : ''}`).join('\n') : 'None'}`

    const systemPrompt = `You are Kira, a friendly AI study companion for students.
Help students understand difficult concepts with clear, step-by-step explanations.
Guidelines: be encouraging, use relevant examples, keep answers concise (200-400 words),
and guide students to understand rather than doing their homework for them.
Always respond in English only, even if the student writes in a different language — politely ask them to continue in English if needed.
Focus on the subject: ${subject}.

You have access to the student's current tasks below. Reference specific titles when relevant to answer questions about their workload, progress, or what's left to do.
${taskContext}

You can also manage the student's to-do list and missions — these are different things, do not confuse them:
- A task is a single concrete to-do item (assignment, reminder), optionally with subtasks and a due date. If the user asks to add, create, or schedule a task, assignment, or reminder, call create_task with a tasks array — one entry per task — each with: title, description, subject, priority (LOW/MEDIUM/HIGH/URGENT), due date+time (ISO 8601 YYYY-MM-DDTHH:MM), estimated duration in minutes, and subtasks (array of step titles).
- A mission is a longer-term goal tracked toward a measurable target by a target date (e.g. "study 20 hours this week"). If the user asks to set a goal, mission, or target, call create_mission with a missions array — one entry per mission — each with: title, description, targetDate (ISO 8601), targetValue (number), unit (e.g. "hours"), and type (DAILY/WEEKLY/MONTHLY/SEMESTER).
If the user mentions multiple tasks and/or missions in one message, put every task in the tasks array and every mission in the missions array of a single call each — don't ask one at a time. You may call create_task and create_mission in the same turn if the user mentions both kinds of items.
Today's date is ${today}; convert any date/time format ("tomorrow", "next Monday", DD/MM/YYYY) to ISO 8601. If the user asks to break a task into steps, populate the subtasks array.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-6),
      { role: 'user' as const, content: question },
    ]

    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 1500,
      temperature: 0.7,
      tools: [createTaskTool, createMissionTool],
      tool_choice: 'auto',
    })

    const message = response.choices[0]?.message
    let tokensUsed = response.usage?.total_tokens || 0

    const toolCalls = message?.tool_calls || []
    if (toolCalls.length > 0) {
      const confirmationById = new Map<string, string>()
      let tasksCreated: CreatedTask[] = []
      let missionsCreated: CreatedMission[] = []

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === 'create_task') {
          const { answer, tasks } = await createTasksFromArgs(userId, toolCall.function.arguments)
          confirmationById.set(toolCall.id, answer)
          tasksCreated = tasksCreated.concat(tasks)
        } else if (toolCall.function.name === 'create_mission') {
          const { answer, missions } = await createMissionsFromArgs(userId, toolCall.function.arguments)
          confirmationById.set(toolCall.id, answer)
          missionsCreated = missionsCreated.concat(missions)
        }
      }

      const confirmations = toolCalls.map(tc => confirmationById.get(tc.id) || 'Done.')

      // On a tool-calling turn Groq returns empty message content, so if the user's
      // message also asked a question or wanted an explanation alongside the action
      // request (e.g. "explain X and add a task for it"), that part would otherwise
      // be silently dropped. Ask the model to address anything else from the
      // original message before appending the deterministic tool confirmations below.
      let knowledgeAnswer = (message?.content || '').trim()
      if (!knowledgeAnswer) {
        try {
          const followUp = await getGroq().chat.completions.create({
            model: MODEL,
            messages: [
              ...messages,
              { role: 'assistant' as const, content: message?.content || null, tool_calls: toolCalls },
              ...toolCalls.map((tc, i) => ({ role: 'tool' as const, tool_call_id: tc.id, content: confirmations[i] })),
              { role: 'user' as const, content: 'Besides what you just created, did my last message also ask a question or request an explanation? If so, answer it now following your usual guidelines. If there was nothing else to address, reply with exactly NONE.' },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          })
          tokensUsed += followUp.usage?.total_tokens || 0
          const followUpContent = (followUp.choices[0]?.message?.content || '').trim()
          if (followUpContent && followUpContent.toUpperCase() !== 'NONE') {
            knowledgeAnswer = followUpContent
          }
        } catch (err) {
          console.error('[AI] Follow-up answer failed:', err)
        }
      }

      const answer = [knowledgeAnswer, ...confirmations].filter(Boolean).join('\n\n')
      const latencyMs = Date.now() - start

      await prisma.aIAnalysis.create({
        data: {
          userId,
          type: 'STUDY_QA',
          input: JSON.parse(JSON.stringify({ question, subject })),
          output: JSON.parse(JSON.stringify({ answer, taskIds: tasksCreated.map(t => t.id), missionIds: missionsCreated.map(m => m.id) })),
          model: MODEL,
          tokensUsed,
          latencyMs,
        },
      })

      return {
        answer,
        subject,
        tokensUsed,
        latencyMs,
        tasksCreated: tasksCreated.length ? tasksCreated : undefined,
        missionsCreated: missionsCreated.length ? missionsCreated : undefined,
      }
    }

    const latencyMs = Date.now() - start
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
