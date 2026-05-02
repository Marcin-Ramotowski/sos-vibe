# Performance Report

Generated: 2026-05-02

## Core Web Vitals (Lighthouse on login page — http://localhost:3000)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP (Largest Contentful Paint) | 2.0s | < 2.5s | ✓ Pass |
| TBT (Total Blocking Time) | 330ms | < 600ms | ✓ Pass |
| CLS (Cumulative Layout Shift) | 0 | < 0.1 | ✓ Pass |
| Performance Score | 92/100 | > 90 | ✓ Pass |

> Measured with Lighthouse on the development server. Production build (Next.js standalone)
> will have lower TBT due to tree-shaking and minification.

## API Response Times (development server, after warm-up)

| Endpoint | Avg | Target p95 | Status |
|----------|-----|------------|--------|
| GET /api/health | ~240ms | < 500ms | ✓ Pass |
| GET /api/auth/me | ~10ms | < 200ms | ✓ Pass |
| GET /api/courses | ~240ms | < 500ms | ✓ Pass |

> Note: `/api/health` executes `SELECT 1` against PostgreSQL to verify connectivity,
> accounting for most of the ~240ms. In production with connection pooling (PgBouncer) the
> round-trip will be significantly lower. `/api/auth/me` is purely in-memory JWT validation.

## Database

| Check | Status |
|-------|--------|
| Indexes on foreign keys (studentId, courseId, lecturerId) | ✓ |
| Unique composite index on Enrollment(studentId, courseId) | ✓ |
| Atomic enrollment uses `$executeRaw` inside `$transaction` | ✓ |
| No N+1 queries (courses include lecturer via Prisma `include`) | ✓ |

## Bundle Analysis

| Metric | Notes |
|--------|-------|
| Output mode | `standalone` (Next.js optimized) |
| Server components | Pages use client components; layout auth guards add minimal JS |
| Code splitting | Next.js App Router provides automatic route-level splitting |

## Optimization Recommendations

1. Add `Cache-Control` headers to `GET /api/courses` for non-authenticated views (currently uncached)
2. Consider React Query or SWR for client-side data caching to reduce redundant API calls
3. The `/api/health` endpoint could skip the DB check for lightweight liveness probes

## Result

**Status: PASSED** — All primary targets met
