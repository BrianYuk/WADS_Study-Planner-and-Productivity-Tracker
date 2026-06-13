import { PrismaClient } from '@prisma/client'

// ── Singleton pattern ─────────────────────────────────────────────────────────
// Prevents multiple PrismaClient instances during Next.js hot-reload in dev,
// which would exhaust the connection pool.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        // Neon serverless: use the pooler URL with ?pgbouncer=true for connection pooling.
        // The pooler URL uses port 6543 (PgBouncer) instead of 5432 (direct connection).
        // Set DATABASE_URL in .env to the Neon pooler connection string:
        // postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ── Retry logic for Neon cold-start P1001 errors ─────────────────────────────
// Neon free tier pauses the database after 5 minutes of inactivity.
// The first query after a pause fails with P1001 "Can't reach database server".
// This wrapper retries up to 3 times with exponential backoff,
// giving the database time to wake up before the user sees an error.

type PrismaOperation<T> = () => Promise<T>

export async function withRetry<T>(
  operation: PrismaOperation<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (err: unknown) {
      lastError = err

      // Only retry on Neon cold-start connection errors
      const code = (err as { code?: string })?.code
      const isConnectionError = ['P1001', 'P1002', 'P1008'].includes(code ?? '')

      if (!isConnectionError || attempt === maxRetries) {
        throw err
      }

      // Exponential backoff: 500ms → 1000ms → 2000ms
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      console.warn(`[DB] Connection attempt ${attempt} failed (${code}). Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ── Health check ──────────────────────────────────────────────────────────────
export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}
