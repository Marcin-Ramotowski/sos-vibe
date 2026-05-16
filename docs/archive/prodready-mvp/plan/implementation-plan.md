# Implementation Plan

## Overview

**Project**: SOS — System Obsługi Studiów
**Pattern**: Modular Monolith z Clean Architecture (domain → application → infrastructure → presentation)
**Stack**: Next.js 15 · TypeScript 5 · PostgreSQL 16 · Prisma 6 · shadcn/ui · Tailwind CSS 4 · Vitest · Playwright

## Phases

### Sprint 1: Foundation
**Cel**: Działające środowisko deweloperskie + uwierzytelnianie end-to-end

Obejmuje:
- Szkielet projektu Next.js 15 z Clean Architecture folder structure
- Docker Compose (app + postgres)
- Prisma schema + migracja (wszystkie 5 tabel)
- JWT auth: login/logout + middleware RBAC
- Strona logowania (UI)

Po tym sprincie: można się zalogować jako student/wykładowca/admin i trafić na właściwy dashboard.

---

### Sprint 2: Kursy (Admin + widok ogólny)
**Cel**: Admin może tworzyć kursy i przypisywać wykładowców; wszyscy widzą listę kursów

Obejmuje:
- Course domain layer (encja, interfejs repozytorium, use cases)
- API: GET /courses, POST /courses, PATCH /courses/:id/lecturer
- UI Admin: formularz tworzenia kursu, lista kursów z zarządzaniem
- UI Student/Lecturer: lista kursów ze statusem (AVAILABLE/ENROLLED/FULL)

---

### Sprint 3: Zapisy studentów
**Cel**: Student może się zapisywać i wypisywać z kursów — race condition safe

Obejmuje:
- Enrollment domain layer + EnrollmentService (atomowy UPDATE z WHERE)
- API: POST /enrollments, DELETE /enrollments/:courseId, GET /enrollments
- UI: EnrollButton z loading state, strona "Moje kursy"

Po tym sprincie: core value systemu działa — zapis jest transakcyjny, odporny na race conditions.

---

### Sprint 4: Oceny
**Cel**: Wykładowca wystawia oceny; student je widzi; audit log działa

Obejmuje:
- Grade domain layer + GradeAuditLog
- API: PUT /courses/:courseId/students/:studentId/grade, GET /grades/mine, GET /courses/:courseId/students
- UI Lecturer: tabela studentów z inline grade input
- UI Student: strona "Moje oceny"

---

### Sprint 5: Panel Admina
**Cel**: Admin zarządza użytkownikami i rolami

Obejmuje:
- API: GET /users, PATCH /users/:id/role
- UI: lista użytkowników z możliwością zmiany roli

---

### Sprint 6: Jakość i wykończenie
**Cel**: Testy, walidacja, error handling, performance check

Obejmuje:
- Globalny error handler + toast notifications
- Zod validation schemas dla wszystkich endpointów
- Health check endpoint
- Przegląd N+1 queries i pagination
- Unit tests (domain layer)
- Integration tests (API endpoints)
- E2E tests (Playwright — krytyczne flow)

---

## Ryzyka i mitigacje

| Ryzyko | Wpływ | Mitigacja |
|--------|-------|-----------|
| Race condition przy zapisach | Wysoki | Atomowy UPDATE z WHERE + CHECK constraint w DB (ADR-004) |
| N+1 queries przy liście kursów | Średni | Prisma `include` z jednoczesnym `select` pól — przegląd w Sprint 6 |
| JWT secret w środowisku dev | Średni | `.env.example` bez sekretu; `.env.local` w `.gitignore` |
| Prisma migrations w Docker | Niski | `prisma migrate deploy` jako entrypoint container command |
| shadcn/ui wersja niezgodna z Next.js 15 | Niski | Zablokuj wersje w `package.json`; przetestuj w Sprint 1 |

## Zewnętrzne zależności

- [x] PostgreSQL 16 (Docker image — brak konta, brak kosztu)
- [x] Node.js 22 LTS (Docker image)
- [x] GitHub Actions (darmowe dla publicznych repozytoriów)
- [ ] VPS do deploymentu (decyzja przy fazie Finalize)
