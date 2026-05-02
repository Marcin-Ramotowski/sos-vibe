# Implementation Backlog

---

## Sprint 1: Foundation

### TASK-001: Project Scaffolding
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Inicjalizacja projektu Next.js 15 z App Router, TypeScript strict mode, ESLint, Prettier oraz Clean Architecture folder structure.

**Acceptance Criteria**:
- [ ] `npx create-next-app` z TypeScript + App Router + Tailwind
- [ ] `tsconfig.json` z `"strict": true` i path aliases (`@/domain`, `@/application`, `@/infrastructure`, `@/presentation`)
- [ ] ESLint z `@typescript-eslint` + reguły dla Clean Architecture (zakaz importu `next` w `domain/`)
- [ ] Prettier skonfigurowany, zintegrowany z ESLint
- [ ] Folder structure: `src/domain/`, `src/application/`, `src/infrastructure/`, `src/presentation/`
- [ ] Husky + lint-staged: lint + typecheck przed commitem
- [ ] `.gitignore` zawiera `.env.local`, `node_modules/`, `.next/`

**Blocked by**: None
**Blocks**: TASK-002, TASK-003, TASK-004, TASK-005

---

### TASK-002: Docker Development Setup
**Priority**: P0 | **Estimate**: 1h | **Status**: Done

**Description**:
Docker Compose dla środowiska deweloperskiego: aplikacja + PostgreSQL.

**Acceptance Criteria**:
- [ ] `docker-compose.yml` z serwisami: `app` (Next.js dev) + `db` (postgres:16-alpine)
- [ ] `.env.example` z: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`
- [ ] `.dockerignore` wykluczający `node_modules/`, `.next/`, `.git/`
- [ ] `docker-compose up` startuje oba serwisy
- [ ] Hot reload działa w kontenerze (`volumes` dla src/)
- [ ] `Makefile` z targetami: `dev`, `db-up`, `db-down`, `logs`

**Blocked by**: TASK-001
**Blocks**: TASK-003

---

### TASK-003: Database Schema & Migrations
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Prisma schema z wszystkimi 5 encjami, migracja inicjalna, seed z danymi testowymi.

**Acceptance Criteria**:
- [ ] `prisma/schema.prisma` z modelami: User, Course, Enrollment, Grade, GradeAuditLog
- [ ] Enum `UserRole` (STUDENT, LECTURER, ADMIN)
- [ ] Wszystkie FK, UNIQUE constraints i CHECK constraints z `schema.sql`
- [ ] `enrolled_count` na Course z CHECK `enrolled_count <= capacity`
- [ ] Migracja inicjalna wygenerowana i zastosowana (`prisma migrate dev`)
- [ ] `prisma/seed.ts`: admin@uni.pl (ADMIN), lecturer@uni.pl (LECTURER), student@uni.pl (STUDENT) + 3 kursy
- [ ] `prisma.$executeRaw` działa (potrzebne dla atomowego UPDATE w enrollment)

**Blocked by**: TASK-002
**Blocks**: TASK-005, TASK-006, TASK-010, TASK-013

---

### TASK-004: Authentication — Backend
**Priority**: P0 | **Estimate**: 3h | **Status**: Done

**Description**:
JWT auth w HTTP-only cookie: login, logout, middleware RBAC dla wszystkich `/api/*` routes.

**Acceptance Criteria**:
- [ ] `src/infrastructure/auth/jwt.ts`: `signToken(payload)`, `verifyToken(token)` używając `jose`
- [ ] `src/domain/entities/user.ts`: User entity z rolą
- [ ] `POST /api/auth/login`: bcrypt verify → JWT w HttpOnly cookie (Max-Age=86400, SameSite=Lax)
- [ ] `POST /api/auth/logout`: usuwa cookie
- [ ] `GET /api/auth/me`: zwraca dane zalogowanego usera
- [ ] `src/presentation/middleware.ts`: weryfikuje JWT na wszystkich `/api/*` oprócz `/api/auth/login`; dodaje `x-user-id` i `x-user-role` do headers
- [ ] Zwraca 401 dla brakującego/nieważnego tokena, 403 dla nieautoryzowanej roli
- [ ] Helper `requireRole(role)` dla Route Handlers

**Blocked by**: TASK-003
**Blocks**: TASK-005, TASK-007, TASK-011, TASK-014, TASK-017

---

### TASK-005: Authentication — UI
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Strona logowania i client-side auth state.

**Acceptance Criteria**:
- [ ] `app/(auth)/login/page.tsx`: formularz email + hasło z react-hook-form + zod
- [ ] Loading state i komunikat błędu przy złych danych (bez ujawniania który field jest błędny)
- [ ] Po zalogowaniu redirect na dashboard właściwy dla roli (`/student`, `/lecturer`, `/admin`)
- [ ] `src/presentation/hooks/useAuth.ts`: dostęp do danych usera z `/api/auth/me`
- [ ] Layout sprawdzający auth — redirect na `/login` jeśli brak sesji
- [ ] Niezalogowany user nie widzi żadnych chronionych stron

**Blocked by**: TASK-004
**Blocks**: TASK-008, TASK-009, TASK-012, TASK-015, TASK-016, TASK-018

---

## Sprint 2: Kursy

### TASK-006: Course — Domain & Application Layer
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Encja Course, interfejs ICourseRepository, use cases dla operacji na kursach.

**Acceptance Criteria**:
- [ ] `src/domain/entities/course.ts`: Course entity z walidacją (capacity > 0)
- [ ] `src/domain/repositories/ICourseRepository.ts`: interfejs z metodami findAll, findById, create, assignLecturer
- [ ] `src/application/use-cases/courses/ListCoursesUseCase.ts`: paginacja + status z perspektywy studenta
- [ ] `src/application/use-cases/courses/CreateCourseUseCase.ts`: walidacja biznesowa
- [ ] `src/application/use-cases/courses/AssignLecturerUseCase.ts`: sprawdza czy user ma rolę LECTURER
- [ ] `src/infrastructure/repositories/PrismaCourseRepository.ts`: implementacja interfejsu
- [ ] Unit testy use cases z in-memory repository

**Blocked by**: TASK-003
**Blocks**: TASK-007, TASK-010

---

### TASK-007: Course — API Endpoints
**Priority**: P0 | **Estimate**: 3h | **Status**: Done

**Description**:
Route Handlers dla kursów — cienka warstwa wywołująca use cases.

**Acceptance Criteria**:
- [ ] `GET /api/courses`: paginacja, dla STUDENTa dołącza enrollmentStatus (AVAILABLE/ENROLLED/FULL)
- [ ] `POST /api/courses`: tylko ADMIN; walidacja Zod CreateCourseRequest; zwraca 201
- [ ] `GET /api/courses/:id`: dostępny dla wszystkich zalogowanych
- [ ] `PATCH /api/courses/:id/lecturer`: tylko ADMIN; walidacja że lecturerId ma rolę LECTURER
- [ ] `GET /api/courses/:id/students`: tylko LECTURER przypisany do kursu lub ADMIN; paginacja z ocenami
- [ ] Każdy endpoint sprawdza rolę przez `requireRole()` — 403 jeśli nieautoryzowany
- [ ] Zod validation na wszystkich body — 400 przy błędnych danych
- [ ] Integration testy dla każdego endpointu (happy path + błędy autoryzacji)

**Blocked by**: TASK-006, TASK-004
**Blocks**: TASK-008, TASK-009

---

### TASK-008: Course — Admin UI
**Priority**: P0 | **Estimate**: 3h | **Status**: Done

**Description**:
Panel admina: tworzenie kursów i przypisywanie wykładowców.

**Acceptance Criteria**:
- [ ] `app/admin/courses/page.tsx`: tabela wszystkich kursów z kolumnami: nazwa, wykładowca, enrolled/capacity, akcje
- [ ] Dialog "Utwórz kurs": formularz (nazwa, opis, capacity) z walidacją klient + toast sukces/błąd
- [ ] Dialog "Przypisz wykładowcę": select z listą userów roli LECTURER
- [ ] Paginacja na liście kursów
- [ ] Pusty stan (brak kursów) z CTA "Utwórz pierwszy kurs"
- [ ] Skeleton loading podczas ładowania danych

**Blocked by**: TASK-007, TASK-005
**Blocks**: None

---

### TASK-009: Course — Student & Lecturer UI
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Lista kursów dla studenta (z statusem zapisu) i wykładowcy (jego kursy).

**Acceptance Criteria**:
- [ ] `app/student/courses/page.tsx`: siatka/lista kursów z CourseCard
- [ ] CourseCard: nazwa, prowadzący, wolne miejsca, status badge (AVAILABLE/ENROLLED/FULL)
- [ ] `app/lecturer/courses/page.tsx`: lista kursów wykładowcy z linkiem do studentów
- [ ] Paginacja na obu widokach
- [ ] Pusty stan z odpowiednim komunikatem per rola

**Blocked by**: TASK-007, TASK-005
**Blocks**: TASK-012

---

## Sprint 3: Zapisy

### TASK-010: Enrollment — Domain & Application Layer
**Priority**: P0 | **Estimate**: 3h | **Status**: Done

**Description**:
Serce systemu: EnrollmentService z atomowym zapisem odpornym na race conditions.

**Acceptance Criteria**:
- [ ] `src/domain/entities/enrollment.ts`: Enrollment entity
- [ ] `src/domain/errors/enrollment.ts`: CourseFullError, AlreadyEnrolledError, GradeExistsError
- [ ] `src/domain/repositories/IEnrollmentRepository.ts`
- [ ] `src/application/use-cases/enrollments/EnrollStudentUseCase.ts`: wywołuje atomowy UPDATE przez `$executeRaw`
- [ ] `src/application/use-cases/enrollments/UnenrollStudentUseCase.ts`: sprawdza brak oceny (GradeExistsError jeśli ocena istnieje)
- [ ] `src/application/use-cases/enrollments/GetMyEnrollmentsUseCase.ts`
- [ ] `src/infrastructure/repositories/PrismaEnrollmentRepository.ts`: atomowy UPDATE:
  ```sql
  UPDATE courses SET enrolled_count = enrolled_count + 1
  WHERE id = $courseId AND enrolled_count < capacity RETURNING id
  ```
- [ ] Unit testy: poprawny zapis, CourseFullError, AlreadyEnrolledError, GradeExistsError przy wypisaniu

**Blocked by**: TASK-006
**Blocks**: TASK-011

---

### TASK-011: Enrollment — API Endpoints
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Route Handlers dla zapisów — tylko STUDENT.

**Acceptance Criteria**:
- [ ] `POST /api/enrollments`: tylko STUDENT; Zod EnrollRequest; zwraca 201 lub 409 (COURSE_FULL / ALREADY_ENROLLED)
- [ ] `DELETE /api/enrollments/:courseId`: tylko STUDENT; zwraca 200 lub 409 (GRADE_EXISTS)
- [ ] `GET /api/enrollments`: tylko STUDENT; paginowana lista z kursami i ocenami
- [ ] Integration testy: happy path zapisu, kurs pełny, duplikat, wypisanie z oceną

**Blocked by**: TASK-010, TASK-004
**Blocks**: TASK-012

---

### TASK-012: Enrollment — Student UI
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
EnrollButton na liście kursów i strona "Moje kursy".

**Acceptance Criteria**:
- [ ] `EnrollButton`: przycisk "Zapisz się" / "Wypisz się" / "Brak miejsc" (disabled)
- [ ] Optimistic UI: natychmiastowa zmiana statusu po kliknięciu, rollback przy błędzie serwera
- [ ] Toast: "Zapisano na kurs [nazwa]" / "Wypisano z kursu" / "Brak wolnych miejsc" / "Masz ocenę — wypisanie niemożliwe"
- [ ] `app/student/my-courses/page.tsx`: lista zapisanych kursów z oceną lub "brak oceny"
- [ ] Pusty stan "Nie jesteś jeszcze zapisany na żaden kurs"

**Blocked by**: TASK-011, TASK-009
**Blocks**: TASK-016

---

## Sprint 4: Oceny

### TASK-013: Grade — Domain & Application Layer
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Grade entity, GradeAuditLog, use cases dla wystawiania i przeglądania ocen.

**Acceptance Criteria**:
- [ ] `src/domain/entities/grade.ts`: Grade entity z walidacją skali (2.0|3.0|3.5|4.0|4.5|5.0|5.5)
- [ ] `src/domain/entities/grade-audit-log.ts`: niemodyfikowalny log
- [ ] `src/domain/repositories/IGradeRepository.ts`
- [ ] `src/application/use-cases/grades/UpsertGradeUseCase.ts`: sprawdza że graded_by to LECTURER przypisany do kursu; zapisuje GradeAuditLog w tej samej transakcji
- [ ] `src/application/use-cases/grades/GetMyGradesUseCase.ts`: tylko własne oceny studenta
- [ ] `src/infrastructure/repositories/PrismaGradeRepository.ts`: upsert + audit log w `$transaction`
- [ ] Unit testy: wystawienie oceny, aktualizacja (audit log zawiera oldValue/newValue), błąd dla nieprawidłowej skali, 403 dla nieprzypisanego wykładowcy

**Blocked by**: TASK-010
**Blocks**: TASK-014

---

### TASK-014: Grade — API Endpoints
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Route Handlers dla ocen.

**Acceptance Criteria**:
- [ ] `PUT /api/courses/:courseId/students/:studentId/grade`: tylko LECTURER przypisany do kursu; Zod UpsertGradeRequest; zwraca 200
- [ ] `GET /api/grades/mine`: tylko STUDENT; paginowana lista ocen per kurs
- [ ] Integration testy: wystawienie oceny, aktualizacja, błąd dla złej skali, 403 dla nieprzypisanego wykładowcy, 403 dla studenta próbującego wystawić ocenę

**Blocked by**: TASK-013, TASK-004
**Blocks**: TASK-015, TASK-016

---

### TASK-015: Grade — Lecturer UI
**Priority**: P0 | **Estimate**: 3h | **Status**: Done

**Description**:
Tabela studentów kursu z inline wystawianiem ocen.

**Acceptance Criteria**:
- [ ] `app/lecturer/courses/[courseId]/students/page.tsx`: tabela: imię/nazwisko, email, data zapisu, ocena
- [ ] GradeInput: select z polską skalą (2.0–5.5) + "brak oceny"; inline w tabeli
- [ ] Auto-save po zmianie selecta (bez przycisku Zapisz) z loading state
- [ ] Toast: "Ocena [wartość] zapisana dla [student]"
- [ ] Paginacja tabeli
- [ ] Pusty stan "Brak studentów w tym kursie"

**Blocked by**: TASK-014, TASK-007
**Blocks**: None

---

### TASK-016: Grade — Student UI
**Priority**: P0 | **Estimate**: 2h | **Status**: Done

**Description**:
Widok "Moje oceny" dla studenta.

**Acceptance Criteria**:
- [ ] `app/student/grades/page.tsx`: lista kursów z ocenami (lub badge "brak oceny")
- [ ] Ocena kolorowana według wartości (zielona 5.x, niebieska 4.x, żółta 3.x, czerwona 2.0)
- [ ] Informacja o prowadzącym i dacie wystawienia oceny
- [ ] Pusty stan "Brak wystawionych ocen"

**Blocked by**: TASK-014, TASK-012
**Blocks**: None

---

## Sprint 5: Panel Admina

### TASK-017: User Management — API
**Priority**: P1 | **Estimate**: 2h | **Status**: Done

**Description**:
Endpointy zarządzania użytkownikami dla admina.

**Acceptance Criteria**:
- [ ] `GET /api/users`: tylko ADMIN; paginowana lista (id, email, firstName, lastName, role, createdAt)
- [ ] `PATCH /api/users/:id/role`: tylko ADMIN; Zod ChangeRoleRequest; zwraca zaktualizowanego usera
- [ ] Integration testy: lista, zmiana roli, 403 dla non-admin

**Blocked by**: TASK-004
**Blocks**: TASK-018

---

### TASK-018: User Management — Admin UI
**Priority**: P1 | **Estimate**: 2h | **Status**: Done

**Description**:
Panel admina: lista użytkowników z możliwością zmiany roli.

**Acceptance Criteria**:
- [ ] `app/admin/users/page.tsx`: tabela użytkowników z kolumnami: email, imię, rola, akcje
- [ ] DropdownMenu z opcją "Zmień rolę" → dialog z select roli + potwierdzenie
- [ ] Toast po zmianie roli
- [ ] Paginacja
- [ ] RoleBadge: kolorowy badge dla każdej roli

**Blocked by**: TASK-017, TASK-005
**Blocks**: None

---

## Sprint 6: Jakość i wykończenie

### TASK-019: Global Error Handling & Toast
**Priority**: P1 | **Estimate**: 2h | **Status**: Done

**Description**:
Globalny error handler na backendzie i system powiadomień na frontendzie.

**Acceptance Criteria**:
- [ ] `src/presentation/api/error-handler.ts`: mapuje domain errors → HTTP responses (CourseFullError → 409, etc.)
- [ ] Stack trace i SQL errors nigdy nie docierają do response body
- [ ] `pino` logger skonfigurowany — structured JSON logs
- [ ] `sonner` (Toast) skonfigurowany w root layout
- [ ] Wszystkie mutacje (enroll, grade, create course) mają toast sukces/błąd

**Blocked by**: TASK-007
**Blocks**: None

---

### TASK-020: Zod Validation Schemas
**Priority**: P1 | **Estimate**: 2h | **Status**: Done

**Description**:
Kompletne Zod schemas dla wszystkich API endpoints i formularzy.

**Acceptance Criteria**:
- [ ] `src/presentation/api/schemas/`: schemas per zasób (auth, courses, enrollments, grades, users)
- [ ] Server-side: każdy Route Handler waliduje body przez Zod przed wywołaniem use case
- [ ] Client-side: react-hook-form + zodResolver na wszystkich formularzach
- [ ] Error messages po polsku dla walidacji formularzy
- [ ] 400 z `code: VALIDATION_ERROR` i listą błędów dla invalid API calls

**Blocked by**: TASK-007
**Blocks**: None

---

### TASK-021: Health Check Endpoint
**Priority**: P1 | **Estimate**: 1h | **Status**: Done

**Description**:
`GET /api/health` sprawdzający połączenie z bazą danych.

**Acceptance Criteria**:
- [ ] `GET /api/health`: zwraca `{ status: "ok", db: "ok" }` jeśli DB dostępna
- [ ] `{ status: "error", db: "unreachable" }` z HTTP 503 jeśli DB niedostępna
- [ ] Używany przez Docker health check

**Blocked by**: TASK-003
**Blocks**: None

---

### TASK-022: Performance Review
**Priority**: P1 | **Estimate**: 2h | **Status**: Done

**Description**:
Przegląd i naprawa N+1 queries, weryfikacja indeksów, connection pooling.

**Acceptance Criteria**:
- [ ] Każdy endpoint z listą używa `include` zamiast N+1 (Prisma query log weryfikacja)
- [ ] `GET /api/courses` dla studenta: jeden query (courses + enrollments dla usera) — nie N queries
- [ ] `GET /api/courses/:id/students`: jeden query (enrollments + users + grades)
- [ ] PgBouncer lub `pgbouncer_url` w Prisma datasource skonfigurowany
- [ ] Wszystkie listy mają limit max 100 per page
- [ ] `EXPLAIN ANALYZE` na krytycznych queries — brak Seq Scan na dużych tabelach

**Blocked by**: TASK-014
**Blocks**: None

---

### TASK-023: Unit Tests — Domain & Application Layer
**Priority**: P1 | **Estimate**: 3h | **Status**: Done

**Description**:
Testy jednostkowe logiki domenowej i use cases (bez DB, bez HTTP).

**Acceptance Criteria**:
- [ ] EnrollStudentUseCase: poprawny zapis, CourseFullError, AlreadyEnrolledError
- [ ] UnenrollStudentUseCase: poprawne wypisanie, GradeExistsError
- [ ] UpsertGradeUseCase: wystawienie, aktualizacja z audit log, błąd nieprawidłowej skali
- [ ] Course entity: walidacja capacity > 0
- [ ] Grade entity: walidacja skali (2.0|3.0|3.5|4.0|4.5|5.0|5.5)
- [ ] In-memory repository implementations dla testów
- [ ] Coverage: domain/ + application/ >= 80%

**Blocked by**: TASK-013
**Blocks**: None

---

### TASK-024: Integration Tests — API Endpoints
**Priority**: P1 | **Estimate**: 4h | **Status**: Done

**Description**:
Testy integracyjne wszystkich API endpoints z prawdziwą bazą danych testową.

**Acceptance Criteria**:
- [ ] Test DB konfiguracja (`DATABASE_URL_TEST` w `.env.test`)
- [ ] `beforeEach`: truncate tabel + seed minimal data
- [ ] Auth: login success, login failure, logout, dostęp bez tokena
- [ ] Courses: CRUD + RBAC (student 403 na POST/PATCH)
- [ ] Enrollments: happy path, 409 COURSE_FULL (race condition test — 50 concurrent requests na 1 miejsce), 409 ALREADY_ENROLLED, 409 GRADE_EXISTS przy wypisaniu
- [ ] Grades: wystawienie, aktualizacja + audit log w DB, 403 dla nieprzypisanego wykładowcy
- [ ] Users: lista admin, zmiana roli, 403 dla non-admin
- [ ] Framework: Vitest + `node-fetch` lub Next.js test helpers

**Blocked by**: TASK-017
**Blocks**: None

---

### TASK-025: E2E Tests — Playwright
**Priority**: P1 | **Estimate**: 4h | **Status**: Done

**Description**:
Testy end-to-end krytycznych user flows przez przeglądarkę.

**Acceptance Criteria**:
- [ ] `tests/e2e/auth.spec.ts`: logowanie, wylogowanie, redirect po zalogowaniu
- [ ] `tests/e2e/enrollment.spec.ts`: student zapisuje się na kurs → status ENROLLED; drugi zapis → toast "już zapisany"; wypisanie
- [ ] `tests/e2e/grades.spec.ts`: wykładowca wystawia ocenę → student widzi ocenę; wykładowca próbuje ocenić w cudzym kursie → 403
- [ ] `tests/e2e/admin.spec.ts`: admin tworzy kurs, przypisuje wykładowcę; admin zmienia rolę usera
- [ ] Playwright config z baseURL dla środowiska testowego
- [ ] Screenshots przy failurach

**Blocked by**: TASK-018, TASK-016
**Blocks**: None

---

## Task Summary

| Sprint | Zadania | Estymacja |
|--------|---------|-----------|
| Sprint 1: Foundation | TASK-001 → TASK-005 | 10h |
| Sprint 2: Kursy | TASK-006 → TASK-009 | 10h |
| Sprint 3: Zapisy | TASK-010 → TASK-012 | 7h |
| Sprint 4: Oceny | TASK-013 → TASK-016 | 9h |
| Sprint 5: Admin | TASK-017 → TASK-018 | 4h |
| Sprint 6: Jakość | TASK-019 → TASK-025 | 18h |
| **Razem** | **25 zadań** | **58h** |
