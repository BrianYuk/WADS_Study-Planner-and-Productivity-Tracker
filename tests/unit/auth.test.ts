/**
 * Tests: Authentication API
 * Week 4 – Frontend & API Testing
 */
import { sanitizeInput, checkRateLimit } from '@/middleware/apiMiddleware'
import { isValidPassword, hashPassword, comparePassword } from '@/lib/auth'

describe('Auth Utilities', () => {
  describe('isValidPassword', () => {
    it('accepts strong passwords', () => {
      expect(isValidPassword('SecurePass123')).toBe(true)
      expect(isValidPassword('MyStr0ngPwd!')).toBe(true)
    })
    it('rejects short passwords', () => {
      expect(isValidPassword('Abc1')).toBe(false)
    })
    it('rejects no uppercase', () => {
      expect(isValidPassword('lowercase123')).toBe(false)
    })
    it('rejects no number', () => {
      expect(isValidPassword('NoNumbers!')).toBe(false)
    })
  })

  describe('hashPassword / comparePassword', () => {
    it('hashes and verifies correctly', async () => {
      const hash = await hashPassword('TestPass123')
      expect(await comparePassword('TestPass123', hash)).toBe(true)
      expect(await comparePassword('WrongPass', hash)).toBe(false)
    })
  })
})

describe('Input Sanitization', () => {
  it('strips XSS script tags', () => {
    const malicious = '<script>alert("xss")</script>'
    const sanitized = sanitizeInput(malicious)
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).not.toContain('</script>')
  })

  it('escapes HTML entities', () => {
    expect(sanitizeInput('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;')
  })

  it('handles normal strings without modification', () => {
    expect(sanitizeInput('  Hello World  ')).toBe('Hello World')
  })

  it('handles SQL injection attempts', () => {
    const sqlInjection = "'; DROP TABLE users; --"
    const sanitized = sanitizeInput(sqlInjection)
    expect(sanitized).not.toContain("'")
  })
})

describe('Rate Limiting', () => {
  it('allows requests within limit', () => {
    const key = `test-${Date.now()}`
    expect(checkRateLimit(key, 3, 60000)).toBe(true)
    expect(checkRateLimit(key, 3, 60000)).toBe(true)
    expect(checkRateLimit(key, 3, 60000)).toBe(true)
  })

  it('blocks requests over limit', () => {
    const key = `test-over-${Date.now()}`
    checkRateLimit(key, 2, 60000)
    checkRateLimit(key, 2, 60000)
    expect(checkRateLimit(key, 2, 60000)).toBe(false)
  })

  it('different keys are independent', () => {
    const key1 = `test-k1-${Date.now()}`
    const key2 = `test-k2-${Date.now()}`
    checkRateLimit(key1, 1, 60000)
    expect(checkRateLimit(key1, 1, 60000)).toBe(false)
    expect(checkRateLimit(key2, 1, 60000)).toBe(true)
  })
})
