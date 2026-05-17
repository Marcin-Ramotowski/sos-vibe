# GUARDRAILS

> Inviolable project rules. Every developer and AI agent MUST follow these.
>
> This file does NOT describe project structure (see `AGENTS.md`)
> or code patterns (see `.ai/standards/`).
> This file defines **boundaries that must never be crossed**.

## Absolute prohibitions

### STOP — immediate revert

Violation = revert NOW, no discussion.

1. **NEVER** store PII (email, IP, phone, full name, payment data) as plaintext in the database — use a hash (for lookup) + encrypted ciphertext (for retrieval), or column-level encryption provided by your DB/ORM.
2. **NEVER** build SQL queries via string concatenation or template literal interpolation of user input — always use parameterized queries (`$1`, `?`, `:name`, etc.) of your DB driver / ORM.
3. **NEVER** commit secrets (JWT signing keys, encryption keys, API keys, DB passwords, OAuth client secrets) to the repository — environment variables only, via `.env` / your secrets manager.
4. **NEVER** log PII in plaintext — strip query strings from logged URLs; hash or mask emails, IPs, tokens before they hit any log sink.

### BLOCK — do not merge without fix

Violation = fix before merge, PR blocked.

1. **NEVER** import `@prisma/client` anywhere under `src/domain/` — the domain layer has zero knowledge of Prisma. Violation breaks Clean Architecture.
2. **NEVER** import from `next` or `next/server` anywhere under `src/domain/` or `src/application/` — those layers are framework-agnostic by design.
3. **NEVER** put business logic in a Route Handler (`src/app/api/`) — Route Handlers are allowed to: parse the request, call a use case, return a response. Any `if`, domain check, or DB call beyond that belongs in a use case or domain service.
4. **NEVER** access the database (Prisma) directly from a Route Handler — always go through a use case → repository interface.
5. **NEVER** add a new `/api/*` endpoint without role verification — read `x-user-role` from headers and throw `ForbiddenError` for unauthorized roles. The middleware sets the header; the route enforces the role.
6. **NEVER** use the "check then insert" pattern for enrollment or any capacity-guarded write — always use the atomic `UPDATE ... WHERE enrolledCount < capacity RETURNING id` pattern inside `prisma.$transaction`.
7. **NEVER** use `console.log` or `console.warn` — use `console.error` only in `handleApiError` for unexpected (non-domain) errors; everything else must be structured `pino` logging.
8. **NEVER** return a raw stack trace, SQL error, or Prisma error message in an API response — all errors flow through `handleApiError` in `src/presentation/api/error-handler.ts`.
9. **NEVER** expose a list endpoint without pagination — every `GET` returning multiple records must accept `page` / `limit` and return a `pagination` object.
10. **NEVER** change a grade without creating a `GradeAuditLog` entry — every `upsert` on a grade must record who changed it, what changed, and when.
11. **NEVER** allow a student to unenroll from a course that already has a grade — check `hasGrade(enrollmentId)` and throw `GradeExistsError` before deletion.

## Decision priorities

When values conflict, this hierarchy resolves:

1. **PII and user-data security** — breaches have legal, reputational, and often existential consequences.
2. **Data integrity** — corrupted data with no rollback is worse than downtime.
3. **Public / customer-facing surface stability** — public endpoints and integrations that third parties depend on.
4. **API contract compatibility** — breaking changes cascade to every client.
5. **Code readability and consistency** — predictable patterns make multi-developer + AI development sustainable.

## Architectural boundaries

1. `src/domain/` → NEVER imports anything outside `src/domain/` (no Prisma, no Next.js, no jose)
2. `src/application/` → NEVER imports Prisma or Next.js; only interfaces from `src/domain/repositories/`
3. `src/app/api/` Route Handlers → NEVER call Prisma directly; NEVER instantiate domain entities directly; only instantiate concrete repos + use cases
4. `src/infrastructure/repositories/` → NEVER imports from `src/application/` or `src/app/`
5. Middleware (`src/middleware.ts`) → NEVER calls use cases or repos; only verifies JWT and forwards headers

## Consistency rules

1. When adding a **new API endpoint** → ALWAYS add role check (`x-user-role` header), Zod validation schema in `src/presentation/api/schemas/`, and wire errors through `handleApiError`.
2. When adding a **new use case** → ALWAYS inject repositories via constructor (not instantiate them internally), accept a typed input DTO, return a typed output.
3. When adding a **new domain error** → ALWAYS add it to `src/domain/errors/index.ts` AND add a corresponding case in `src/presentation/api/error-handler.ts` with the correct HTTP status.
4. When adding a **new repository method** → ALWAYS declare it on the `I*Repository` interface in `src/domain/repositories/` first, then implement it in `src/infrastructure/repositories/`.
5. When adding a **new entity** → ALWAYS create its interface in `src/domain/entities/`, its Prisma model in `prisma/schema.prisma`, and generate + apply a migration.
6. When writing a **test for domain logic or a use case** → ALWAYS place it in `tests/unit/` using in-memory repository stubs — never import Prisma in a unit test.
7. When writing a **test that requires a database** → ALWAYS place it in `tests/integration/`, never in `tests/unit/`.

## Allowed exceptions

1. **`/api/auth/login` and `/api/health` are public** — the middleware explicitly whitelists `PUBLIC_PATHS`. Adding a new path to that whitelist requires an explicit reason documented here or in the PR.
2. **`/api/auth/logout` is public** — must be reachable by clients with an expired/invalid token so they can clear their cookie.
3. **Raw SQL via `prisma.$executeRaw`** is permitted ONLY in `PrismaEnrollmentRepository.enrollAtomic()` and `unenroll()` — these two operations require atomicity that Prisma's ORM API cannot provide. Everywhere else, use Prisma query methods.
4. **`console.error`** is permitted in `src/presentation/api/error-handler.ts` for unexpected (non-domain) errors — this is the single approved location for raw console output. Nowhere else.
5. **Instantiating concrete repositories directly in Route Handlers** is acceptable for now — there is no DI container; constructors are the injection mechanism. Do not introduce a DI framework without a team decision.

## Definition of "done"

A change is complete ONLY when:

- [ ] The project's linter passes: `npm run lint`
- [ ] TypeScript compiles with no errors: `npx tsc --noEmit`
- [ ] Unit tests pass: `npm run test:unit`
- [ ] Integration tests pass (if DB schema or repository changed): `npm run test:integration`
- [ ] No secrets or plaintext PII in staged files
- [ ] Every new domain error is in `error-handler.ts` with the right HTTP status
- [ ] Every new endpoint has a Zod schema and role check
- [ ] Every new rule introduced during implementation has been captured via `/sync-standards` or an entry in this file
- [ ] The spec file (if any) has its `## Implementation Checklist` updated

## Verify gate rules

Binary PR gates — each is either **PASS** or **BLOCK**. No partial credit, no exceptions.

| # | Rule | Command / Check | Blocks when |
|---|------|-----------------|-------------|
| 1 | Build must pass | `npm run build` | Exit code ≠ 0 or any TypeScript / Next.js compilation error |
| 2 | Lint and types must be clean | `npm run lint && npx tsc --noEmit` | Any ESLint error or type error — warnings are not a pass |
| 3 | All tests must be green | `npm test` | Any failing test, including tests unrelated to the change |
| 4 | AC coverage for `implemented` features *(project-specific)* | `grep -r "AC-NNN-M" tests/` for each AC in FEATURES.md | A feature is marked `implemented` in `FEATURES.md` but any of its `AC-NNN-M` IDs is absent from `tests/` or the matching test is failing |
| 5 | Enrollment changes require real-DB integration test *(project-specific)* | Code review + `npm run test:integration` | A PR modifies `PrismaEnrollmentRepository`, `EnrollmentService`, or any enrollment Route Handler and does NOT include or update an integration test against a real PostgreSQL connection — mocked enrollment tests do not satisfy this rule (see ADR-004) |

> **Rule 4 explained:** open `FEATURES.md`, find every `AC-NNN-M` for the feature being marked `implemented`, run `grep -rn "AC-NNN-M" tests/` for each ID. If any grep returns zero results, or the matched test is failing, the PR is blocked. The feature status stays `in-progress`.

## Architectural decisions

### ADR-001 — Next.js 15 (App Router) as the full-stack framework

- **Choice**: Single Next.js 15 project with App Router for both UI (RSC) and REST API (Route Handlers).
- **Why**: Solo dev + VPS deployment → one project, one `docker build`, zero CORS overhead. RSC gives student-friendly SSR without a separate API call. TypeScript flows end-to-end from Prisma to React.
- **Consequence**: Route Handlers live in `src/app/api/` and are intentionally thin. Any logic more complex than "validate → call use case → return JSON" is a violation. Server Components may call use cases; they must never call Prisma directly.

---

### ADR-002 — PostgreSQL 16 as the database

- **Choice**: PostgreSQL 16 (not MySQL, SQLite, or MongoDB).
- **Why**: The enrollment race condition requires an atomic `UPDATE ... WHERE enrolledCount < capacity RETURNING id`. PostgreSQL's ACID guarantees, `CHECK` constraints (`enrolledCount <= capacity`), and `UNIQUE (studentId, courseId)` are the last line of defence against data corruption. No other free DB gives all of this together.
- **Consequence**: Do not replace `$executeRaw` in enrollment with a plain Prisma `update` — Prisma cannot express the conditional atomic increment in a single statement. DB-level constraints (`CHECK`, `UNIQUE`) must be preserved in every migration; do not drop them for convenience.

---

### ADR-003 — JWT in an HTTP-only cookie, verified by Next.js middleware

- **Choice**: `jose`-signed JWT stored in `HttpOnly; Secure; SameSite=Lax` cookie. Verified in `src/middleware.ts` before any Route Handler runs. User identity (`x-user-id`, `x-user-role`) injected as request headers.
- **Why**: HTTP-only cookie is invisible to JavaScript → XSS-safe. SameSite=Lax → CSRF-safe for standard form posts. Stateless backend → no session store. Role in JWT payload → zero extra DB query per request for RBAC.
- **Consequence**: Route Handlers read identity from `request.headers.get('x-user-id')` and `request.headers.get('x-user-role')` — they never query the DB just to check who the caller is. Changing a user's role takes effect only on their next login (new token). Do not add localStorage-based token storage — it defeats XSS protection.

---

### ADR-004 — Atomic UPDATE + INSERT in one transaction for enrollment concurrency

- **Choice**: `prisma.$transaction` containing `$executeRaw` (atomic conditional UPDATE) followed by `enrollment.create`. No application-level mutex, no `SELECT FOR UPDATE`, no optimistic locking with retry.
- **Why**: "Check then insert" is a race condition — two concurrent requests can both pass the capacity check and both insert. The atomic UPDATE either increments the counter (returning the row) or does nothing (returning 0 affected rows). PostgreSQL guarantees exactly one winner per slot. The `UNIQUE (studentId, courseId)` constraint plus P2002 error handling catches the residual race of two identical concurrent enrollments.
- **Consequence**: The enrollment atomic path lives exclusively in `PrismaEnrollmentRepository.enrollAtomic()`. Do not refactor this to a plain Prisma `update` — it will break race condition safety. The unenroll path uses a matching `$executeRaw` to decrement `enrolledCount` atomically. Any test for enrollment concurrency must use real concurrent DB connections, not mocks.
