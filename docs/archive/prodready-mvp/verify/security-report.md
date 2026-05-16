# Security Audit Report

Generated: 2026-05-02

## Dependency Scan

```
npm audit results:
found 5 vulnerabilities (5 moderate)
```

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Moderate | 5 |
| Low | 0 |

**Moderate issues**: All require `npm audit fix --force` which would install breaking version changes
(Prisma 6→7 or Next.js 15→9 downgrades). These are transitive dependencies in dev tooling
(`@hono/node-server` via Prisma toolchain, `postcss` via Next.js). They do not affect production runtime behavior.

## Secrets Detection

No secrets found in codebase. `.env` is in `.gitignore`. `.env.example` contains only placeholder values.

## OWASP Top 10 Checklist

| # | Vulnerability | Status | Notes |
|---|---------------|--------|-------|
| A01 | Broken Access Control | ✓ Pass | RBAC middleware on all `/api/*` routes; layout-level role guards for frontend pages |
| A02 | Cryptographic Failures | ✓ Pass | bcrypt (cost 10) for password hashing; JWT signed with `jose` HS256 |
| A03 | Injection | ✓ Pass | Prisma ORM with parameterized queries; raw SQL uses tagged template literals with parameterization |
| A04 | Insecure Design | ✓ Pass | Atomic enrollment with database-level counter prevents race conditions |
| A05 | Security Misconfiguration | ✓ Pass | No dev dependencies in production Docker image; non-root user in container |
| A06 | Vulnerable Components | ✓ Pass | No critical/high severity vulnerabilities |
| A07 | Auth Failures | ✓ Pass | Secure HttpOnly cookies; neutral error messages on login failure |
| A08 | Data Integrity Failures | ✓ Pass | Zod validation on all API inputs |
| A09 | Logging Failures | ✓ Pass | Audit log for grade changes; no sensitive data (passwords, tokens) in logs |
| A10 | SSRF | ✓ Pass | No external URL fetching |

## Code Review

- [x] No hardcoded secrets (JWT_SECRET, DATABASE_URL from environment)
- [x] Passwords hashed with bcrypt (cost factor 10)
- [x] JWT signed with environment-provided secret via `jose`
- [x] All API inputs validated with Zod schemas
- [x] Error messages don't reveal which field is wrong on login failure
- [x] Role-based access enforced at both middleware and use-case layers
- [x] Atomic enrollment prevents concurrent over-enrollment

## Issues Found

None critical or high. The 5 moderate vulnerabilities are in transitive dev toolchain dependencies and cannot be fixed without breaking changes to major dependencies (Prisma, Next.js).

## Result

**Status: PASSED**

- Critical: 0
- High: 0
- Moderate: 5 (transitive, dev toolchain only)
- Low: 0
