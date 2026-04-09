import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db'

// GET /api/health — public health check endpoint
// Returns database status and basic app info.
// Useful for monitoring and debugging cold-start issues.
export async function GET() {
  const db = await checkDatabaseHealth()

  const status = db.ok ? 200 : 503

  return NextResponse.json(
    {
      status:    db.ok ? 'ok' : 'degraded',
      app:       'Kira Flow',
      version:   process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        status:    db.ok ? 'connected' : 'unreachable',
        latencyMs: db.latencyMs,
      },
    },
    { status }
  )
}
