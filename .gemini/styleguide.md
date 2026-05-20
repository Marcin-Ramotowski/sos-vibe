# Gemini Code Assist style guide — SOS (Student Online System)

Read by Gemini Code Assist on every PR opened in this repository. Content is a projection from
`.ai/standards/` (stack conventions) plus prohibitions from `.ai/GUARDRAILS.md` (inviolable).

## What the review must flag as priority

The five classes of AI errors that the test pipeline cannot catch because no assertion is written for them:

**Architecture layer violation [HIGH].** Any `import` of `@prisma/client` or `next`/`next/server`
anywhere under `src/domain/` or `src/application/` = HIGH. Domain and application layers are
framework-agnostic by design. Check import paths carefully.

**Route Handler contains business logic [HIGH].** A Route Handler in `src/app/api/` is allowed to:
read headers, validate input with Zod, call a use case, return a response. Any `if`, domain check,
DB call, or Prisma query beyond that = HIGH. Business logic belongs in a use case or domain service.

**Missing or misplaced role check [HIGH].** Every handler (except the whitelist: `/api/auth/login`,
`/api/auth/logout`, `/api/health`) must read `x-user-role` from headers and throw `ForbiddenError`
for unauthorized roles. The role check must be the **first statement** after reading headers — before
body parsing. A handler that parses the body or calls a use case before verifying the role = HIGH.

**Enrollment without atomic UPDATE [HIGH].** Any code that implements enrollment or unenrollment
using a plain Prisma `update` or a "check then insert" pattern = HIGH. The only safe pattern is
`$executeRaw` inside `prisma.$transaction` with `WHERE enrolledCount < capacity`. Two concurrent
requests can both pass an application-level check; only the DB-level atomic increment prevents
double-enrollment.

**Hallucinated third-party methods [HIGH].** A method call on a `node_modules` object that does not
exist in the installed library version (e.g. a Prisma method the current schema/version does not
expose, or a `jose` function that does not exist) = HIGH. Request a docs link in the comment.

## GUARDRAILS prohibitions — enforced as HIGH, no exceptions

These rules are inviolable. Violation blocks merge regardless of PR context.
Full source: `.ai/GUARDRAILS.md`; this section is the condensed version for review.

### STOP — immediate revert

- **PII as plaintext in DB or logs [HIGH].** Email, IP, phone, full name, payment data stored or
  logged in plaintext = STOP. Use a hash (for lookup) + encrypted ciphertext (for retrieval), or
  column-level encryption.
- **SQL built by string concatenation with user input [HIGH].** Always use parameterized queries
  (`$1`, `?`, `:name`). Raw SQL is only allowed in `PrismaEnrollmentRepository.enrollAtomic()` and
  `unenroll()` — even there, it must use tagged template literals (`$executeRaw\`...\``), never string
  concatenation.
- **Secrets committed to the repo [HIGH].** JWT signing keys, encryption keys, API keys, DB
  passwords, OAuth client secrets must live in `.env` / a secrets manager, not in tracked files.
- **PII in logs [HIGH].** Strip query strings from logged URLs; hash or mask emails, IPs, and tokens
  before they hit any log sink.

### BLOCK — do not merge without fix

- **`@prisma/client` import under `src/domain/` [HIGH].** The domain layer has zero knowledge of
  Prisma. This breaks Clean Architecture.
- **`next` or `next/server` import under `src/domain/` or `src/application/` [HIGH].** These layers
  are framework-agnostic by design.
- **Business logic in a Route Handler [HIGH].** `src/app/api/` handlers are thin: parse → role
  check → use case call → response. No `if`-branches with domain semantics, no Prisma calls.
- **Direct Prisma access from a Route Handler [HIGH].** Always go through use case → repository
  interface.
- **New endpoint without role check [HIGH].** Read `x-user-role` header and throw `ForbiddenError`
  for unauthorized roles. The middleware sets the header; the route enforces the role.
- **"Check then insert" pattern for enrollment [HIGH].** Must use the atomic
  `UPDATE ... WHERE enrolledCount < capacity RETURNING id` inside `prisma.$transaction`.
- **`console.log` or `console.warn` [HIGH].** Use structured `pino` logging. `console.error` is
  permitted only in `src/presentation/api/error-handler.ts` for unexpected errors.
- **Raw error message in API response [HIGH].** Stack traces, SQL errors, and Prisma error messages
  must never reach the client. All errors flow through `handleApiError` in
  `src/presentation/api/error-handler.ts`.
- **List endpoint without pagination [HIGH].** Every `GET` returning multiple records must accept
  `page`/`limit` and return a `pagination` object: `{ page, limit, total, totalPages }`.
- **Grade change without `GradeAuditLog` [HIGH].** Every `upsert` on a grade must create a
  `GradeAuditLog` entry recording who changed it, what changed, and when.
- **Student unenrolling from a graded course [HIGH].** `hasGrade(enrollmentId)` must be checked
  and `GradeExistsError` thrown before any enrollment deletion.

## What the review must NOT do

**Do not comment on code style.** ESLint, Prettier, and TypeScript strict run in CI. Comments like
"use const instead of let", "missing semicolon", or "prefer arrow function" are noise.

**Do not suggest changes in autogenerated files.** `prisma/migrations/`, `src/generated/`,
`**/*.generated.ts` are tool output. Manual edits get overwritten on the next regeneration.

**Do not rewrite working logic "better".** If the code works and is readable, suggestions like
"rewrite to functional style" or "extract to a separate file" are noise. Comment only on a concrete
bug, security issue, or architecture violation.

**Do not repeat comments.** If the same issue appears in five places, leave one comment listing all
locations, not five separate ones.

## Repository conventions

Stack: Next.js 15 (App Router), TypeScript strict, Prisma 6 (PostgreSQL 16), Vitest 4 (`unit` and
`integration` projects), Playwright 1 (e2e), Tailwind CSS 4 + shadcn/ui, `jose` JWT in HttpOnly
cookie (auth), `pino` (structured logging), Zod (validation), `react-hook-form` (forms).

Architecture: Clean Architecture with four layers — `src/domain/` (pure, no deps), `src/application/`
(use cases, no framework), `src/infrastructure/` (Prisma, jose), `src/presentation/` (Next.js,
Zod, React). Dependency rule: `Presentation → Application → Domain ← Infrastructure`.

Path alias `@/*` maps to `src/*`.

The sections below are regenerated 1:1 from `.ai/standards/index.yml` — one paragraph per standard.

### API Route Handlers (`api/route-structure.md`)

Every handler under `src/app/api/` follows a fixed skeleton: (1) read `x-user-id` and `x-user-role`
from headers; (2) role check — `throw new ForbiddenError()` for an unauthorized role (first check,
before body parsing); (3) parse body / dynamic params; (4) Zod `.safeParse()` — return 422 with the
full `errors` array on failure; (5) `new ConcreteRepo()`, `new UseCase(repo)`; (6) `await
useCase.execute(...)`; (7) `return NextResponse.json(result)`. Every catch block ends with `return
handleApiError(error)` — no exceptions. No `return` lives outside the try/catch. `UserRole` is
imported from `@/domain/entities/user.entity`, never from Prisma. Missing or reordered steps [MEDIUM].

### Authorization (`api/authorization.md`)

Role comes from the `x-user-role` header set by middleware — never from a DB query. Role check is
the first statement after reading headers (`if (userRole !== 'ADMIN') throw new ForbiddenError()`).
Unauthorized role = `throw new ForbiddenError()`, not `return NextResponse` (the error reaches
`handleApiError` via catch). Resource ownership ("is this my course?") is verified by the use case,
not the handler. Public endpoints (middleware whitelist): `/api/auth/login`, `/api/auth/logout`,
`/api/health` — no role check. A role check after body parsing, or a role check that returns a
response instead of throwing [MEDIUM].

### Validation (`api/validation.md`)

Zod schemas live in `src/presentation/api/schemas/`, one file per domain (e.g. `course.schema.ts`).
Validation uses `.safeParse()`, not `.parse()`. On failure, return 422 (not 400) with
`{ code: 'VALIDATION_ERROR', message: '...', errors: [...issues] }` — the full issue list, not just
`issues[0]`. Schema exports its inferred type via `z.infer<typeof Schema>`. Validation errors are
returned inline before the try block — they do NOT go through `handleApiError`. A schema defined
inline inside a handler [MEDIUM]. Status 400 used for validation errors instead of 422 [MEDIUM].

### Response format (`api/response-format.md`)

Success: raw data, no `{ success: true }` envelope. Single entity → `NextResponse.json(entity)`.
Create → status 201. Lists → `{ data: [...], pagination: { page, limit, total, totalPages } }`.
Error: `{ code, message }` where `code` is SCREAMING_SNAKE_CASE (e.g. `FORBIDDEN`, `NOT_FOUND`,
`COURSE_FULL`, `ALREADY_ENROLLED`). Pagination parsed via `parsePagination(request.nextUrl.searchParams)`
(default: `page=1`, `limit=20`, max `limit=100`). A list response missing the `pagination` object
[HIGH, GUARDRAILS BLOCK #9]. An `{ success: true }` envelope or a non-standard error shape [MEDIUM].

### Domain errors (`domain/errors.md`)

All domain errors live in `src/domain/errors/index.ts` as classes extending `DomainError`. Every new
error class requires: (a) a new entry in `errors/index.ts`; (b) a corresponding case in
`handleApiError` (`src/presentation/api/error-handler.ts`) with the correct HTTP status. Known codes
and statuses: `UNAUTHORIZED`→401, `FORBIDDEN`→403, `NOT_FOUND`→404, `COURSE_FULL`→409,
`ALREADY_ENROLLED`→409, `GRADE_EXISTS`→409, `VALIDATION_ERROR`→422. Domain errors are thrown from
use cases, not from Route Handlers or repositories. A new error class with no entry in `handleApiError`
[HIGH, GUARDRAILS Consistency #3]. A `code` that differs from the one used in `handleApiError` [MEDIUM].

### Use cases (`domain/use-cases.md`)

Each use case is a class with a typed constructor and a single `execute(input)` method. The constructor
accepts **only repository interfaces** (e.g. `ICourseRepository`) — never concrete Prisma classes.
The use case is unaware of Prisma, Next.js, or HTTP. Resource ownership authorization ("is this my
course?") lives here, not in the Route Handler. File: `src/application/use-cases/{domain}/{Name}UseCase.ts`.
Input and output interfaces are defined in the same file. A use case that imports Prisma or Next.js
[HIGH, GUARDRAILS BLOCK #1/#2]. Business logic moved to a Route Handler [HIGH, GUARDRAILS BLOCK #3].

### Repository pattern (`database/repository-pattern.md`)

Two files per entity: `src/domain/repositories/I{Entity}Repository.ts` (interface, domain types only)
and `src/infrastructure/repositories/Prisma{Entity}Repository.ts` (Prisma implementation). The
interface uses only types from `../entities/` — zero Prisma types. The implementation contains a
`mapXxx()` function that converts raw Prisma results to domain types; Prisma types never escape the
implementation file. New repository methods must be declared on the interface first, then implemented.
An interface method that accepts or returns a Prisma type [HIGH]. A new method implemented without
adding it to the interface [MEDIUM].

### Transactions (`database/transactions.md`)

Two allowed patterns: (1) multi-step atomic operation — `prisma.$transaction(async (tx) => { ... })`
for upsert+audit, delete+decrement, or any set of related writes; (2) atomic conditional UPDATE via
`$executeRaw` — **only** for the enrollment/unenrollment operations that cannot be expressed through
the Prisma ORM API. `$executeRaw` outside of `PrismaEnrollmentRepository.enrollAtomic()` and
`unenroll()` [HIGH, GUARDRAILS BLOCK #6]. `prisma.$transaction([op1, op2])` batch array syntax (use
the async callback form instead) [MEDIUM]. A plain `prisma.course.update` for enrollment that skips
the atomic pattern [HIGH].

### Tests (`testing/test-structure.md`, `testing/unit-stubs.md`, `testing/integration-helpers.md`)

Three test tiers: `tests/unit/` — use cases and domain entities, zero Prisma, zero HTTP, stubs via
factory functions (`makeEnrollmentRepo(overrides)`); `tests/integration/` — API over HTTP on
`localhost:3000`, requires running app + seed, helpers defined locally per file (not a shared module);
`tests/e2e/` — Playwright full user flows. A test in `tests/unit/` that imports Prisma [HIGH,
GUARDRAILS Consistency #6]. A test in `tests/unit/` that makes HTTP calls [HIGH]. A PR that modifies
`PrismaEnrollmentRepository`, `EnrollmentService`, or any enrollment Route Handler without an
integration test against a real PostgreSQL connection [HIGH, GUARDRAILS verify gate #5]. Stub factory
functions must implement the **full repository interface** (not just the methods under test) — a stub
missing interface methods [MEDIUM].

## T-Shirt Size context

A PR labeled `size:S` (single-file fix or typo) → at most one comment, or none.
A PR labeled `size:M` (typical change within one domain) → 0–3 comments on priority error classes.
A PR labeled `size:L` (DB migration, new API contract, or multi-layer change) → full review including
cross-layer consequences; `max_review_comments: 10` is still the ceiling.
No label → treat as `size:M`.
