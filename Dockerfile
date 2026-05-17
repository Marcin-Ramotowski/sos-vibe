# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Development
# ============================================
FROM node:22-alpine AS development
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ============================================
# Stage 4: Runner (production draft — finalized in Phase 5)
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
