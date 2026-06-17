# ============================================================
# ShowroomHub — Production Dockerfile
# Multi-stage build using Next.js standalone output.
# Works with SQLite (default) or Postgres (set DATABASE_URL).
# ============================================================

# ---- Stage 1: Install deps ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy lockfile + package.json
COPY package.json bun.lock* ./
COPY prisma ./prisma

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Generate Prisma client
RUN bun run db:generate

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g bun

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry — disable it
ENV NEXT_TELEMETRY_DISABLED=1

# Build the standalone output
# Note: ignoreBuildErrors is set in next.config.ts so this won't fail on TS warnings
RUN bun run build

# ---- Stage 3: Runtime ----
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone output (Next.js produces a self-contained server.js)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files so we can run db:push at startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json

# Create data directory for SQLite (writable by nextjs user)
RUN mkdir -p /app/db && chown -R nextjs:nodejs /app

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Default to SQLite inside the container; override with DATABASE_URL for Postgres
ENV DATABASE_URL=file:/app/db/custom.db

USER nextjs

EXPOSE 3000

# Startup script: push schema (creates tables if missing) then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
