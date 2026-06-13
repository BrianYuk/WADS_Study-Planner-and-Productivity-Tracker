# ════════════════════════════════════════════════════════════════════════════
# Kira Flow — Multi-stage Dockerfile
# ════════════════════════════════════════════════════════════════════════════
# Stage 1 (base)   — shared Node.js 20 Alpine base image
# Stage 2 (deps)   — install all npm dependencies
# Stage 3 (builder)— build the Next.js production bundle
# Stage 4 (runner) — minimal production image (~200MB vs ~1GB full)
# ════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
# libc6-compat needed for some native Node.js modules on Alpine
RUN apk add --no-cache libc6-compat

# ── Stage 2: Install Dependencies ────────────────────────────────────────────
FROM base AS deps
# Copy only package files first — Docker layer caching means this layer
# only rebuilds when package.json or package-lock.json changes
COPY package*.json ./
COPY prisma ./prisma/
# npm ci is faster and more reliable than npm install in CI/CD
RUN npm ci

# ── Stage 3: Build Application ───────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (creates TypeScript types from schema.prisma)
RUN npx prisma generate

# Build Next.js with standalone output — produces a minimal self-contained bundle
# Requires output: "standalone" in next.config.js
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder DATABASE_URL so the PrismaClient constructor is satisfied during the
# build's "Collecting page data" step. No real DB connection is made at build time;
# the real DATABASE_URL is injected at runtime via the container environment.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN npm run build

# ── Stage 4: Production Runner ────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security — never run containers as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copy only the built output — not source code or dev dependencies
COPY --from=builder /app/public                          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder /app/prisma                          ./prisma
COPY --from=builder /app/node_modules/.prisma            ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check — Docker will restart the container if this fails 3 times
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
