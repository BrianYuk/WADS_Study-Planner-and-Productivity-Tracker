/// <reference types="node" />
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Test environment defaults — ensure auth/JWT code has required secrets in tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-jest-min-32-characters'
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-nextauth-secret'
process.env.APP_SECRET = process.env.APP_SECRET || 'test-app-secret'

// TextEncoder/Decoder polyfill
if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore polyfill
  global.TextEncoder = TextEncoder
  // @ts-ignore polyfill
  global.TextDecoder = TextDecoder
}

// Minimal Request/Response/Headers polyfill so next/server can be imported in jsdom.
// These are only stubs — enough for module load; real request logic is mocked in tests.
if (typeof global.Request === 'undefined') {
  // @ts-ignore minimal polyfill
  global.Request = class Request {
    url: string
    method: string
    headers: Map<string, string>
    private _body: unknown
    constructor(input: string, init?: { method?: string; headers?: Record<string, string>; body?: unknown }) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this._body = init?.body
    }
    async json() { return typeof this._body === 'string' ? JSON.parse(this._body) : this._body }
  }
}

if (typeof global.Response === 'undefined') {
  // @ts-ignore minimal polyfill
  global.Response = class Response {
    body: unknown
    status: number
    constructor(body?: unknown, init?: { status?: number }) {
      this.body = body
      this.status = init?.status || 200
    }
    async json() { return typeof this.body === 'string' ? JSON.parse(this.body) : this.body }
  }
}

if (typeof global.Headers === 'undefined') {
  // @ts-ignore minimal polyfill
  global.Headers = class Headers extends Map {}
}
