import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import { comparePassword } from '@/lib/auth'

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email / Password ──────────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where:  { email: credentials.email.toLowerCase() },
          select: { id: true, name: true, email: true, role: true, passwordHash: true },
        })

        if (!user) return null

        const valid = await comparePassword(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    // Upsert Google users into our PostgreSQL database on first sign-in
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email! } })
          if (!existing) {
            await prisma.user.create({
              data: {
                email:        user.email!,
                name:         user.name  || 'Google User',
                // Placeholder hash — Google users never use password login
                passwordHash: `google_oauth_${user.id}`,
                role:         'STUDENT',
                avatar:       user.image || null,
                preferences:  { create: {} },
              },
            })
          }
        } catch (err) {
          console.error('[NextAuth] Google signIn upsert error:', err)
          return false
        }
      }
      return true
    },

    // Attach id and role to the JWT token
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where:  { email: token.email! },
          select: { id: true, role: true },
        })
        token.id   = dbUser?.id   ?? user.id
        token.role = dbUser?.role ?? 'STUDENT'
      }
      return token
    },

    // Expose id and role on the session object (accessible client-side)
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id   as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  // ── Custom pages ──────────────────────────────────────────────────────────
  pages: {
    signIn: '/login',
    error:  '/login',
  },

  // ── Session config ────────────────────────────────────────────────────────
  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}
