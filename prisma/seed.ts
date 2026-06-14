import { PrismaClient, Priority, TaskStatus, GoalType, GoalStatus, SessionType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// ts-node doesn't auto-load .env like Next.js does, so parse it manually.
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnv()

const prisma = new PrismaClient()

const DEMO_EMAIL = 'demo@kiraflow.app'
const DEMO_PASSWORD = 'Demo1234!'

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(n: number, hour: number): Date {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return new Date(d.getTime() - n * DAY_MS)
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setHours(23, 59, 0, 0)
  return new Date(d.getTime() + n * DAY_MS)
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, name: 'Demo Student' },
    create: {
      email: DEMO_EMAIL,
      name: 'Demo Student',
      passwordHash,
      preferences: { create: {} },
    },
  })

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  })

  // Reset previous demo data so the seed can be re-run safely
  await prisma.studySession.deleteMany({ where: { userId: user.id } })
  await prisma.goal.deleteMany({ where: { userId: user.id } })
  await prisma.task.deleteMany({ where: { userId: user.id } })

  await prisma.task.createMany({
    data: [
      { userId: user.id, title: 'Data Structures Assignment', subject: 'Computer Science', priority: Priority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(2), estimatedMins: 180 },
      { userId: user.id, title: 'Calculus Problem Set 4', subject: 'Mathematics', priority: Priority.URGENT, status: TaskStatus.TODO, dueDate: daysFromNow(1), estimatedMins: 90 },
      { userId: user.id, title: 'Essay Draft – Modern Literature', subject: 'English', priority: Priority.MEDIUM, status: TaskStatus.TODO, dueDate: daysFromNow(5), estimatedMins: 150 },
      { userId: user.id, title: 'Physics Lab Report', subject: 'Physics', priority: Priority.HIGH, status: TaskStatus.COMPLETED, estimatedMins: 120, actualMins: 110 },
      { userId: user.id, title: 'Database Systems Quiz Prep', subject: 'Computer Science', priority: Priority.MEDIUM, status: TaskStatus.COMPLETED, estimatedMins: 60, actualMins: 55 },
      { userId: user.id, title: 'Read Chapter 7 – Algorithms', subject: 'Computer Science', priority: Priority.LOW, status: TaskStatus.TODO, dueDate: daysFromNow(7), estimatedMins: 45 },
      { userId: user.id, title: 'Group Project Planning Notes', subject: 'Business', priority: Priority.LOW, status: TaskStatus.CANCELLED, estimatedMins: 30 },
    ],
  })

  await prisma.goal.createMany({
    data: [
      { userId: user.id, title: 'Study 20 hours this week', description: 'Hit a solid weekly study target', targetDate: daysFromNow(7), targetValue: 20, currentValue: 12.5, unit: 'hours', type: GoalType.WEEKLY, status: GoalStatus.ACTIVE },
      { userId: user.id, title: 'Complete 15 tasks this month', description: 'Stay on top of coursework', targetDate: daysFromNow(20), targetValue: 15, currentValue: 9, unit: 'tasks', type: GoalType.MONTHLY, status: GoalStatus.ACTIVE },
      { userId: user.id, title: 'Maintain a 10-day study streak', description: 'Build a consistent study habit', targetDate: daysFromNow(10), targetValue: 10, currentValue: 6, unit: 'days', type: GoalType.WEEKLY, status: GoalStatus.ACTIVE },
    ],
  })

  const sessions: { dayOffset: number; hour: number; durationMins: number; subject: string; focusScore: number; type: SessionType }[] = [
    { dayOffset: 6, hour: 9,  durationMins: 90,  subject: 'Computer Science', focusScore: 80, type: SessionType.POMODORO },
    { dayOffset: 5, hour: 14, durationMins: 60,  subject: 'Mathematics',      focusScore: 70, type: SessionType.PRACTICE },
    { dayOffset: 3, hour: 10, durationMins: 120, subject: 'Computer Science', focusScore: 85, type: SessionType.DEEP_WORK },
    { dayOffset: 3, hour: 16, durationMins: 45,  subject: 'Physics',          focusScore: 75, type: SessionType.REVIEW },
    { dayOffset: 2, hour: 11, durationMins: 75,  subject: 'English',          focusScore: 65, type: SessionType.POMODORO },
    { dayOffset: 1, hour: 9,  durationMins: 90,  subject: 'Mathematics',      focusScore: 90, type: SessionType.PRACTICE },
    { dayOffset: 1, hour: 19, durationMins: 30,  subject: 'Computer Science', focusScore: 60, type: SessionType.READING },
    { dayOffset: 0, hour: 8,  durationMins: 60,  subject: 'Computer Science', focusScore: 88, type: SessionType.POMODORO },
  ]

  await prisma.studySession.createMany({
    data: sessions.map((s) => {
      const startTime = daysAgo(s.dayOffset, s.hour)
      const endTime = new Date(startTime.getTime() + s.durationMins * 60000)
      return {
        userId: user.id,
        subject: s.subject,
        startTime,
        endTime,
        durationMins: s.durationMins,
        focusScore: s.focusScore,
        type: s.type,
      }
    }),
  })

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
