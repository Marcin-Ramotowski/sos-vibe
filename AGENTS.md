# Agents Guidelines

This project uses the **t-shirt size workflow** for AI-assisted coding. Agents should leverage strict phase progression and the standards system to keep the codebase consistent and safe to extend.

## ⚠️ Before you start — HARD STOP gate

**This is a blocking rule. No `/` command in this framework may execute while the sections below contain `_(fill in)_` or empty placeholders.**

The user must fill in (themselves, by hand) the following sections of this file:

- [ ] **Project Layout** (below) — high-level folder map
- [ ] **Tech Stack** (below) — runtime, framework, DB, linter
- [ ] **Commands** table (below) — dev, build, test, lint/format
- [ ] **Where to Look** table (bottom of this file) — delete rows that don't apply to your stack

And in `.ai/GUARDRAILS.md`:

- [ ] At least one project-specific BLOCK rule
- [ ] Your architectural decisions section

### Rule for agents

When any `/` command is invoked, your FIRST action is to read this file and check the four sections above.

- If ANY section still contains `_(fill in)_` or an equivalent empty placeholder → **STOP immediately**. Do not proceed with the command. Do not read other files. Do not offer alternative plans.
- Tell the user exactly which sections are empty and that you cannot continue until they fill them in.
- **Do NOT offer to fill them yourself.** Do NOT suggest values. Do NOT proceed even if the user insists — these values must come from the user because they encode project-specific knowledge the agent cannot infer.
- The only exception: reading this file to perform the gate check itself.

Once the sections are filled, the user can re-run the original command and it will proceed normally.

### Why

The framework is stack-agnostic (Node, .NET, Rails, Go, Python, Rust — all work identically). But every command downstream assumes these values are correct. If the agent auto-fills them, it will guess (e.g. "probably PostgreSQL") and the rest of the workflow will propagate those guesses. The gate forces the human to commit to a stack once, explicitly.

Then run `/discover-standards` on your codebase to generate your first standards. Do not copy standards from other projects — they must emerge from your own code.

## Archived Material

`docs/archive/**` contains historical material only. Agents must not read or rely on files in this directory for current product, architecture, API, test, or implementation decisions unless the user explicitly asks for historical context.

## Workflow

See **`.ai/WORKFLOW.md`** for the complete guide: phase progression (spec → tasks → inject → implement → verify → build), subagent strategy, spec/task rules, analogy discovery, user stories, code pattern finder, and the S/M/L feedback loop.

## Feature Tracking

See **`.ai/FEATURE-TRACKING.md`** for the feature lifecycle, `FEATURES.md` format, and AC→test mapping convention.

**`FEATURES.md`** (project root) is the backlog and source of truth. A feature may only be marked `implemented` when all its AC tests pass.

## Verify Gate

See **`.ai/VERIFY-GATE.md`** for the four binary PR-blocking commands (`verify.build` · `verify.lint` · `verify.test` · `verify.diff`) and agent execution rules.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Project Layout

Modular Monolith with Clean Architecture — single Next.js 15 (App Router) project.

```
src/
├── domain/              # Pure domain logic — ZERO framework dependencies
│   ├── entities/        # User, Course, Enrollment, Grade, GradeAuditLog
│   ├── repositories/    # Interfaces (ports) — ICourseRepository etc.
│   ├── services/        # Domain services — EnrollmentService (race condition logic)
│   └── errors/          # Domain errors — CourseFullError, AlreadyEnrolledError
├── application/         # Use cases — domain orchestration
│   ├── use-cases/       # EnrollStudentUseCase, AssignGradeUseCase etc.
│   └── dtos/            # Input/Output DTOs
├── infrastructure/      # Adapters — Prisma, auth
│   ├── auth/            # JWT via jose (HttpOnly cookies)
│   ├── database/        # Prisma client
│   └── repositories/    # Implementations of ICourseRepository etc.
└── presentation/        # Next.js — thin HTTP layer
    ├── api/             # Validation schemas (Zod)
    ├── components/      # React UI components (shadcn/ui)
    └── hooks/           # React hooks

src/app/                 # Next.js App Router (pages, layouts, Route Handlers)
├── api/                 # Route Handlers — auth, courses, enrollments, grades, users
├── admin/               # Admin panel pages (courses, users)
├── lecturer/            # Lecturer pages (courses, students, grades)
├── student/             # Student pages (courses, my-courses, grades)
└── login/               # Login page

prisma/
├── schema.prisma        # Database schema
└── migrations/          # PostgreSQL migration history

tests/
├── unit/                # Domain and use case tests (no DB, no HTTP)
├── integration/         # Tests against a real database
└── e2e/                 # Playwright — full user flow through browser
```

**Dependency rule:** `Presentation → Application → Domain ← Infrastructure`
Domain has no knowledge of Prisma. Application has no knowledge of Next.js. Route Handlers call only use cases.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.x |
| Runtime | Node.js 22 LTS |
| Framework | Next.js 15 (App Router) — full-stack monolith (SSR + API Route Handlers) |
| Database | PostgreSQL 16 — ACID, FK, SELECT FOR UPDATE |
| ORM | Prisma 6 — type-safe queries, migrations, `$transaction` |
| UI | shadcn/ui + Tailwind CSS 4 |
| Auth | `jose` — JWT in HttpOnly + Secure + SameSite=Lax cookie; RBAC via role in JWT payload |
| Validation | Zod |
| Forms | react-hook-form + @hookform/resolvers |
| Logging | pino (structured JSON) |
| Linting | ESLint 9 + eslint-config-next |
| Unit / Integration tests | Vitest 4 |
| E2E tests | Playwright 1 |
| Containerization | Docker + Docker Compose (compose.yaml / compose.prod.yaml) |

## Commands

| Action | Command |
|---|---|
| Dev | `docker compose up` (full environment) or `npm run dev` (local Node, no Docker) |
| Build | `npm run build` |
| Test | `npm test` (all) · `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` |
| Lint / Format | `npm run lint` · `npx prettier --write .` · `npx tsc --noEmit` (typecheck) |
| DB | `npx prisma migrate dev` (migrations) · `npx prisma db seed` (seed) · `npx prisma studio` (GUI) |

## Coding Standards

Detailed standards: `.ai/standards/`
Index: `.ai/standards/index.yml`

**Before any non-trivial change** — read the relevant standard. Areas are discovered and populated per project via `/discover-standards`.

See `.ai/standards/examples/` for what a finished standard looks like.

Available skills:
- `/inject-standards` — inject standards into context
- `/discover-standards` — discover new patterns in the code
- `/verify-standards` — verify code vs standards (after implementation)
- `/sync-standards` — synchronize standards with new code (after implementation)

## Gotchas

- **NEVER invent URLs.** If a spec or code needs an external URL — ask the user for the real link or verify it exists via WebFetch.
- **Use Context7 for library documentation**, not training-data memory — library APIs drift and your recall can be stale.
- **Route Handlers must be thin** — HTTP validation + use case call + response mapping only. Zero business logic in `src/app/api/`.
- **Enrollment uses an atomic SQL update** (`UPDATE ... WHERE enrolled_count < capacity RETURNING id`) — do not use a plain Prisma `update`; always wrap in `$transaction`.
- **Auth is an HttpOnly cookie** — the browser JS cannot access the token; verification happens server-side only (middleware / Route Handler).
- **Domain must not import Prisma** — an `@prisma/client` import anywhere under `src/domain/` is an architecture violation.
- **Unit tests must run without DB and without HTTP** — if a test in `tests/unit/` requires Prisma, it belongs in `tests/integration/`.

## Where to Look

| What | Where |
|------|-------|
| API routes / HTTP handlers | `src/app/api/` (Route Handlers Next.js) |
| Domain logic (entities, services, errors) | `src/domain/` |
| Use cases (application layer) | `src/application/use-cases/` |
| DB schema / migrations | `prisma/schema.prisma`, `prisma/migrations/` |
| DB repository implementations | `src/infrastructure/repositories/` |
| Frontend pages / layouts | `src/app/` (admin/, lecturer/, student/, login/) |
| UI components | `src/presentation/components/` |
| Zod validation schemas | `src/presentation/api/schemas/` |
| Auth infrastructure | `src/infrastructure/auth/` |
| Tests | `tests/unit/`, `tests/integration/`, `tests/e2e/` |
