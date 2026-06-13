/**
 * Security Test Suite — Kira Flow
 * COMP6703001 Web Application Development & Security
 *
 * Maps to rubric Section 7.1 Security Testing:
 *   - XSS test attempts
 *   - Injection test attempts
 *   - Authentication and authorization testing
 */

// Mock Prisma so importing middleware doesn't instantiate a real DB client
jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    aIAnalysis: { create: jest.fn() },
  },
}))


import { sanitizeInput, sanitizeObject, checkRateLimit } from '@/middleware/apiMiddleware'
import { isValidPassword, signAccessToken, verifyToken } from '@/lib/auth'

// ─────────────────────────────────────────────────────────────
// 1. XSS (Cross-Site Scripting) Protection
// ─────────────────────────────────────────────────────────────
describe('Security: XSS Protection', () => {
  it('SEC-XSS-01: neutralises <script> tags in user input', () => {
    const malicious = '<script>alert("xss")</script>'
    const clean = sanitizeInput(malicious)
    expect(clean).not.toContain('<script>')
    expect(clean).toContain('&lt;script&gt;')
  })

  it('SEC-XSS-02: escapes img onerror payloads', () => {
    const payload = '<img src=x onerror="alert(1)">'
    const clean = sanitizeInput(payload)
    expect(clean).not.toContain('<img')
    expect(clean).not.toContain('onerror="')
  })

  it('SEC-XSS-03: escapes javascript: URIs and quotes', () => {
    const payload = '"><a href="javascript:alert(1)">click</a>'
    const clean = sanitizeInput(payload)
    expect(clean).not.toContain('"><a href="')
    expect(clean).toContain('&quot;')
  })

  it('SEC-XSS-04: sanitises nested object fields recursively', () => {
    const body = {
      title: '<script>steal()</script>',
      nested: { note: '<b>bold</b>' },
    }
    const clean = sanitizeObject(body)
    expect(clean.title).not.toContain('<script>')
    expect((clean.nested as { note: string }).note).not.toContain('<b>')
  })

  it('SEC-XSS-05: sanitises string arrays inside objects', () => {
    const body = { tags: ['<script>a</script>', 'normal'] }
    const clean = sanitizeObject(body)
    expect((clean.tags as string[])[0]).not.toContain('<script>')
    expect((clean.tags as string[])[1]).toBe('normal')
  })
})

// ─────────────────────────────────────────────────────────────
// 2. Injection (SQL / NoSQL) Protection
// ─────────────────────────────────────────────────────────────
describe('Security: Injection Protection', () => {
  it('SEC-INJ-01: escapes classic SQL OR 1=1 payload', () => {
    const payload = "' OR '1'='1"
    const clean = sanitizeInput(payload)
    expect(clean).not.toContain("'")
    expect(clean).toContain('&#x27;')
  })

  it('SEC-INJ-02: escapes DROP TABLE attempt', () => {
    const payload = "'; DROP TABLE users; --"
    const clean = sanitizeInput(payload)
    expect(clean).not.toContain("'")
  })

  it('SEC-INJ-03: escapes NoSQL operator injection characters', () => {
    // Prisma is parameterised; sanitisation is defense-in-depth for echoed input
    const payload = '{"$gt": ""}'
    const clean = sanitizeInput(payload)
    expect(clean).toContain('&quot;')
  })

  it('SEC-INJ-04: preserves legitimate input unchanged', () => {
    const normal = 'Study calculus chapter 5'
    expect(sanitizeInput(normal)).toBe('Study calculus chapter 5')
  })
})

// ─────────────────────────────────────────────────────────────
// 3. Authentication & Authorization
// ─────────────────────────────────────────────────────────────
describe('Security: Authentication', () => {
  it('SEC-AUTH-01: rejects weak passwords (too short)', () => {
    expect(isValidPassword('Ab1')).toBe(false)
  })

  it('SEC-AUTH-02: rejects passwords without uppercase', () => {
    expect(isValidPassword('password123')).toBe(false)
  })

  it('SEC-AUTH-03: rejects passwords without a number', () => {
    expect(isValidPassword('Password')).toBe(false)
  })

  it('SEC-AUTH-04: accepts strong passwords', () => {
    expect(isValidPassword('SecurePass123')).toBe(true)
  })

  it('SEC-AUTH-05: issues a verifiable JWT for valid claims', () => {
    const token = signAccessToken({ sub: 'user-123', email: 'a@b.com', role: 'STUDENT' })
    const decoded = verifyToken(token)
    expect(decoded.sub).toBe('user-123')
    expect(decoded.role).toBe('STUDENT')
  })

  it('SEC-AUTH-06: rejects a tampered/invalid JWT', () => {
    expect(() => verifyToken('not.a.valid.token')).toThrow()
  })
})

describe('Security: Authorization (role-based)', () => {
  it('SEC-AUTHZ-01: token preserves STUDENT role claim', () => {
    const token = signAccessToken({ sub: 'u1', email: 's@b.com', role: 'STUDENT' })
    expect(verifyToken(token).role).toBe('STUDENT')
  })

  it('SEC-AUTHZ-02: token preserves ADMIN role claim', () => {
    const token = signAccessToken({ sub: 'u2', email: 'admin@b.com', role: 'ADMIN' })
    expect(verifyToken(token).role).toBe('ADMIN')
  })

  it('SEC-AUTHZ-03: a STUDENT token never carries ADMIN role', () => {
    const token = signAccessToken({ sub: 'u3', email: 's@b.com', role: 'STUDENT' })
    expect(verifyToken(token).role).not.toBe('ADMIN')
  })
})

// ─────────────────────────────────────────────────────────────
// 4. Rate Limiting (brute-force protection)
// ─────────────────────────────────────────────────────────────
describe('Security: Rate Limiting', () => {
  it('SEC-RATE-01: allows requests within the limit', () => {
    const key = `test-allow-${Date.now()}`
    expect(checkRateLimit(key, 3, 60000)).toBe(true)
    expect(checkRateLimit(key, 3, 60000)).toBe(true)
    expect(checkRateLimit(key, 3, 60000)).toBe(true)
  })

  it('SEC-RATE-02: blocks requests once the limit is exceeded', () => {
    const key = `test-block-${Date.now()}`
    checkRateLimit(key, 2, 60000)
    checkRateLimit(key, 2, 60000)
    expect(checkRateLimit(key, 2, 60000)).toBe(false)
  })
})
