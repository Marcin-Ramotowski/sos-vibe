# Launch Checklist

Project: SOS — System Obsługi Studiów
Date: 2026-05-02
Verified by: ProdReady

## Specification

- [x] All user stories implemented (13/13)
- [x] All API endpoints match OpenAPI spec (15/15)
- [x] Data model matches schema (5 entities)
- [x] Test coverage > 80% (98.71% on domain + application layers)

## Security

- [x] No critical/high vulnerabilities in dependencies
- [x] No secrets in codebase (`.env` in `.gitignore`)
- [x] OWASP Top 10 addressed
- [x] Authentication working correctly (JWT HttpOnly cookies)
- [x] Authorization checks in place (RBAC middleware + layout guards)
- [x] Input validation on all endpoints (Zod)

## Performance

- [x] Core Web Vitals meet targets (LCP 2.0s, CLS 0, score 92/100)
- [x] API response times within acceptable range (dev mode ~240ms with DB roundtrip)
- [x] Database queries optimized (indexes on all FKs, atomic enrollment)
- [x] No N+1 queries (Prisma `include` for relations)

## Testing

- [x] Unit tests passing (98.71% coverage)
- [x] Integration tests passing (auth, courses, enrollment, grades, users)
- [x] E2E tests passing (18/18 Playwright tests)
- [x] All acceptance criteria verified

## Infrastructure

- [x] Docker builds successfully (multi-stage, non-root user, health check)
- [x] docker-compose.prod.yml configured
- [x] Health checks working (`GET /api/health` → `{"status":"ok","db":"connected"}`)
- [x] Environment variables documented (.env.example)
- [x] CI/CD pipeline working (lint → test → build → e2e)

## Documentation

- [x] README.md complete (setup, test accounts, API summary, architecture)
- [x] DEPLOYMENT.md complete (VPS guide, SSL with Caddy, backup/restore)
- [x] API documentation complete (OpenAPI spec + README summary)
- [x] .env.example has all variables

## Pre-Deployment

- [ ] Production environment variables set
- [ ] Database credentials secured (strong passwords)
- [ ] Domain configured
- [ ] SSL certificate ready (Caddy handles automatically via Let's Encrypt)
- [ ] Backup strategy defined (pg_dump to S3 or local)
- [ ] Monitoring configured (optional: Uptime Robot, Sentry)

---

## Deployment Command

```bash
# On production server:
git clone <repo-url> sos && cd sos
cp .env.example .env
# Edit .env with production values
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations and seed:
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

---

## Result

🎉 **PRODUCTION READY**

All automated checks passed. Complete the pre-deployment checklist items before deploying.
