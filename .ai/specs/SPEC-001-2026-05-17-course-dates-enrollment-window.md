# SPEC-001: Terminy kursów i okno zapisów

## Overview

Dodajemy do modelu `Course` trzy opcjonalne pola dat: `startDate`, `endDate` i `enrollmentDeadline`.
Po upłynięciu `enrollmentDeadline` zapisy na kurs są blokowane na poziomie use case.

**Problem:** Brak terminów powoduje, że student może zapisać się na kurs dowolnie późno — nawet po jego
zakończeniu. Uczelnie wymagają konkretnych okien zapisów.

**Cel:** Wprowadzić minimalną, addytywną zmianę (pola opcjonalne → kompatybilność wsteczna) z jawnym
guardem domenowym. Pola są opcjonalne — istniejące kursy bez dat działają bez żadnych modyfikacji.

**Powiązany feature:** FEAT-010 w `FEATURES.md` (AC-010-1 … AC-010-5).

---

## User Stories

### Story 1 — Próba zapisu po terminie (student, happy-path błędu)

**Persona:** Karol, student IV roku. Chce zapisać się na kurs „Systemy wbudowane", ale zapomniał
o terminie. Ma konto w systemie i zna adres strony.

**Krok 1 — Student przegląda listę kursów (`src/app/student/courses/page.tsx`):**
```
┌─────────────────────────────────────────────────────┐
│  Systemy wbudowane                                   │
│  Prowadzący: dr Kowalski                             │
│  Miejsca: 3/30                                       │
│  Zapisy do: 30 maja 2026  ← nowe pole (minęło)      │
│  ⚠ Zapisy zamknięte       ← nowy badge              │
│  [Zapisz się — disabled]  ← przycisk wyłączony      │
└─────────────────────────────────────────────────────┘
```
**Zmiana vs. stan obecny:** Dotychczas widok nie pokazywał żadnych dat. Po zmianie: pole
„Zapisy do:" pojawia się gdy `enrollmentDeadline != null`; jeśli minęło — badge i przycisk disabled.

**Krok 2 — Karol wywołuje API bezpośrednio (omijając UI):**

`POST /api/enrollments`
```json
{ "courseId": "uuid-kursu" }
```
→ `409 Conflict`
```json
{
  "code": "ENROLLMENT_CLOSED",
  "message": "Zapisy na ten kurs zostały zamknięte"
}
```
**Za kulisami:** `EnrollStudentUseCase.execute()` pobiera kurs (`courseRepo.findById`), sprawdza
`course.enrollmentDeadline` — jeśli `!= null && new Date() > enrollmentDeadline` rzuca
`EnrollmentClosedError`. `handleApiError` mapuje na 409. Atomowy update enrollment **nie jest wywoływany**.

---

### Story 2 — Admin tworzy i edytuje kurs z datami

**Persona:** Dorota, administrator uczelni. Planuje nowy kurs na semestr letni z oknem zapisów,
a następnie koryguje daty po konsultacji z dziekanem.

**Krok 1 — Tworzenie kursu z datami (`src/presentation/components/courses/CreateCourseDialog.tsx`):**
```
┌──────────────────────────────────────────────┐
│  Nazwa kursu: [Algorytmy i struktury danych] │
│  Opis:        [___________________________]  │
│  Limit miejsc:[25]                           │
│  Data startu: [2026-03-01]  ← nowe pole     │
│  Data końca:  [2026-06-15]  ← nowe pole     │
│  Zapisy do:   [2026-02-28]  ← nowe pole     │
│                          [Utwórz kurs]       │
└──────────────────────────────────────────────┘
```
**Zmiana vs. stan obecny:** `CreateCourseDialog` aktualnie ma pola: nazwa, opis, limit. Po zmianie
dodajemy 3 opcjonalne date inputy. Walidacja cross-field: jeśli `enrollmentDeadline` i `startDate`
oba podane, `enrollmentDeadline` musi być ≤ `startDate` (można zapisać przed startem kursu, nie po).

`POST /api/courses`
```json
{
  "name": "Algorytmy i struktury danych",
  "capacity": 25,
  "startDate": "2026-03-01",
  "endDate": "2026-06-15",
  "enrollmentDeadline": "2026-02-28"
}
```
→ `201 Created` z obiektem kursu zawierającym daty jako ISO strings.

**Krok 2 — Edycja kursu (nowy `EditCourseDialog.tsx`, nowy przycisk „Edytuj" w tabeli kursów):**
```
┌──────────────────────────────────────────────┐
│  Edytuj kurs: Algorytmy i struktury danych   │
│  Zapisy do:   [2026-03-07]  ← koryguje datę │
│                            [Zapisz zmiany]   │
└──────────────────────────────────────────────┘
```
`PATCH /api/courses/[courseId]`
```json
{ "enrollmentDeadline": "2026-03-07" }
```
→ `200 OK` z zaktualizowanym obiektem kursu.

**Za kulisami (create):** `createCourseSchema` przyjmuje pola dat via `z.coerce.date().optional()`. HTML
`<input type="date">` zwraca string `"YYYY-MM-DD"` — przekazywany as-is w JSON body. Serwer koercuje go
do `Date` przez `z.coerce.date()`. `CreateCourseUseCase` przekazuje do `courseRepo.create(data)`.

**Za kulisami (update):** Nowy `UpdateCourseUseCase` i `PATCH /api/courses/[courseId]`. Partial update —
pola nie podane w body nie są nadpisywane (Prisma `update` z pominięciem nieobecnych kluczy).

---

### Story 3 — Kurs bez deadline (edge case: pola null)

**Persona:** Bartek, student. Kurs „Seminarium dyplomowe" nigdy nie dostał deadline.

**Krok 1 — Kurs bez dat w liście studenta:**
```
┌─────────────────────────────────────────────────────┐
│  Seminarium dyplomowe                    [Zapisz się]│
│  Prowadzący: brak                                    │
│  Miejsca: 0/5                                        │
│  (sekcja dat nie renderuje się — wszystkie null)     │
└─────────────────────────────────────────────────────┘
```
**Zmiana vs. stan obecny:** Brak zmian w wyglądzie dla kursów z wszystkimi polami dat = null.

**Krok 2 — Bartek zapisuje się:**
`EnrollStudentUseCase.execute()`: `course.enrollmentDeadline === null` → warunek `null && ...`
jest `false` → guard **nie rzuca błędu** → zapis przebiega przez `enrollAtomic`.

**Krok 3 — Wyjaśnienie: startDate/endDate vs enrollmentDeadline:**
Guard sprawdza **wyłącznie** `enrollmentDeadline`. `startDate` i `endDate` są informacyjne
(wyświetlane, nie egzekwowane). Decyzja celowa — poza scope: auto-wypisywanie po `endDate`,
blokowanie zapisu przed `startDate`.

---

## Architecture

### Przepływ guard deadline

```
POST /api/enrollments
  → Route Handler (src/app/api/enrollments/route.ts)
    → EnrollStudentUseCase.execute()
        1. courseRepo.findById(courseId)
           ↳ null → throw NotFoundError (istniejący)
        2. if (course.enrollmentDeadline && new Date() > course.enrollmentDeadline)
           ↳ throw EnrollmentClosedError              ← NOWY GUARD
        3. enrollmentRepo.enrollAtomic(studentId, courseId)
           ↳ CourseFullError / AlreadyEnrolledError (istniejące)
    → handleApiError:
        EnrollmentClosedError → 409 ENROLLMENT_CLOSED  ← NOWY BRANCH
```

**Ważne:** `EnrollmentClosedError extends DomainError` — jest podklasą. W `handleApiError`
branch `instanceof EnrollmentClosedError` musi stać **przed** catch-all `instanceof DomainError → 400`,
inaczej zostanie złapany przez ogólniejszy warunek i zwróci błędny status 400 zamiast 409.

**"Teraz" w guard:** guard używa `new Date()` inline (nie wstrzykiwanego zegara). Testy jednostkowe
mockują czas przez `vi.useFakeTimers()` + `vi.setSystemTime(pastDate)` (wbudowane w Vitest).

### Zmienione/nowe pliki per warstwa

| Warstwa | Plik | Zmiana |
|---|---|---|
| Domain/Entity | `src/domain/entities/course.entity.ts` | +3 pola `Date \| null` |
| Domain/Errors | `src/domain/errors/index.ts` | +`EnrollmentClosedError` |
| Domain/Repo port | `src/domain/repositories/ICourseRepository.ts` | +pola dat w `CreateCourseData`; +nowy `UpdateCourseData`; +`update()` w interfejsie |
| Application | `src/application/use-cases/enrollments/EnrollStudentUseCase.ts` | +guard po `findById` |
| Application | `src/application/use-cases/courses/UpdateCourseUseCase.ts` | NOWY plik |
| Infrastructure | `src/infrastructure/repositories/PrismaCourseRepository.ts` | +pola dat w `create()` + `mapCourse()`; +`update()` |
| Presentation/Error | `src/presentation/api/error-handler.ts` | +`instanceof EnrollmentClosedError → 409` (przed `DomainError`) |
| Presentation/Schema | `src/presentation/api/schemas/course.schema.ts` | +3 pola daty w `createCourseSchema`; +nowy `updateCourseSchema` |
| Presentation/Route | `src/app/api/courses/[courseId]/route.ts` | +`PATCH` handler |
| Presentation/UI | `src/presentation/components/courses/CreateCourseDialog.tsx` | +3 date inputy + cross-field refine |
| Presentation/UI | `src/presentation/components/courses/EditCourseDialog.tsx` | NOWY plik |
| App/Admin | `src/app/admin/courses/page.tsx` | +przycisk „Edytuj" + `<EditCourseDialog>` |
| App/Student | `src/app/student/courses/page.tsx` | +wyświetlanie dat + badge |
| App/Lecturer | `src/app/lecturer/courses/page.tsx` | +wyświetlanie dat w liście kursów wykładowcy |
| DB | `prisma/schema.prisma` + nowa migracja | +3 nullable kolumny w `courses` |
| Tests | `tests/unit/`, `tests/integration/`, `tests/e2e/` | nowe pliki per AC |

### Kluczowe decyzje architektoniczne

1. **Guard w use case, nie w repo:** Deadline nie wymaga operacji atomowej (wartość deadline nie
   zmienia się w trakcie zapisu), więc guard to prosty `if` po `findById` — analogicznie do
   `NotFoundError`. Capacity guard jest w repo, bo wymaga warunkowego `UPDATE` w transakcji.

2. **Pola opcjonalne (nullable):** Wszystkie trzy pola są `null` domyślnie → pełna kompatybilność
   wsteczna. Stare rekordy i istniejące testy nie wymagają żadnych modyfikacji.

3. **`startDate`/`endDate` informacyjne:** Wyświetlane, ale nie egzekwowane. Guard dotyczy
   wyłącznie `enrollmentDeadline`.

4. **`EnrollmentClosedError` → HTTP 409:** Spójne z `CourseFullError` i `AlreadyEnrolledError`
   (też 409 — konflikty zapisów). Nie 400 (błąd walidacji) ani 403 (brak uprawnień).

5. **Czas jako `new Date()` inline:** Upraszcza implementację; Vitest obsługuje mockowanie czasu
   przez `vi.useFakeTimers()` bez potrzeby wstrzykiwania zegara.

6. **Partial update (PATCH):** `updateCourseSchema` używa `.optional()` dla wszystkich pól —
   implementacja wysyła tylko zmienione pola. Repo używa Prisma `update()` z pominięciem
   `undefined` kluczy (Prisma ignoruje `undefined` w `data`).

### Standards do wstrzyknięcia (faza Inject)

Z `.ai/standards/index.yml`:
- `domain/errors` — wzorzec `DomainError`, `code` SCREAMING_SNAKE_CASE
- `domain/entities` — interface bez frameworka
- `domain/use-cases` — klasa z `execute(input)`, constructor injection
- `database/repository-pattern` — `I{Entity}Repository` + `Prisma{Entity}Repository` + `mapXxx()`
- `api/route-structure` — Route Handler: headers → role check → Zod → use case → JSON + `handleApiError`
- `api/authorization` — role check pattern
- `api/response-format` — sukces = surowe dane, błąd = `{ code, message }`
- `testing/unit-stubs` — `makeXxxRepo(overrides)` factory z `vi.fn()`
- `testing/integration-helpers` — `login()` + `authFetch()`, dane przez API nie Prisma bezpośrednio

---

## Data Models

### Prisma schema — rozszerzenie `Course`

```prisma
model Course {
  id                 String    @id @default(uuid())
  name               String
  description        String?
  capacity           Int
  enrolledCount      Int       @default(0)
  lecturerId         String?
  startDate          DateTime? @map("start_date")           // nowe
  endDate            DateTime? @map("end_date")             // nowe
  enrollmentDeadline DateTime? @map("enrollment_deadline")  // nowe
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  lecturer    User?        @relation("LecturerCourses", fields: [lecturerId], references: [id], onDelete: SetNull)
  enrollments Enrollment[]

  @@map("courses")
}
```

Generowana migracja DDL:
```sql
ALTER TABLE "courses"
  ADD COLUMN "start_date" TIMESTAMPTZ,
  ADD COLUMN "end_date" TIMESTAMPTZ,
  ADD COLUMN "enrollment_deadline" TIMESTAMPTZ;
```

### Domain entity — rozszerzenie `Course` interface

```typescript
// src/domain/entities/course.entity.ts
export interface Course {
  id: string
  name: string
  description: string | null
  capacity: number
  enrolledCount: number
  lecturerId: string | null
  startDate: Date | null           // nowe
  endDate: Date | null             // nowe
  enrollmentDeadline: Date | null  // nowe
  createdAt: Date
  updatedAt: Date
}
// CourseWithLecturer i CourseWithStatus dziedziczą przez extends — pola nowe pojawiają się automatycznie
```

### `ICourseRepository` — nowe interfejsy

```typescript
// src/domain/repositories/ICourseRepository.ts

export interface CreateCourseData {
  name: string
  description?: string
  capacity: number
  startDate?: Date            // nowe
  endDate?: Date              // nowe
  enrollmentDeadline?: Date   // nowe
}

export interface UpdateCourseData {  // NOWY
  name?: string
  description?: string
  capacity?: number
  startDate?: Date | null
  endDate?: Date | null
  enrollmentDeadline?: Date | null
}

export interface ICourseRepository {
  // ...istniejące metody...
  update(courseId: string, data: UpdateCourseData): Promise<CourseWithLecturer>  // NOWA
}
```

### Nowy błąd domenowy

```typescript
// src/domain/errors/index.ts
// DomainError (istniejący) — dla referencji:
// export class DomainError extends Error {
//   constructor(public readonly code: string, message: string) {
//     super(message); this.name = this.constructor.name
//   }
// }

export class EnrollmentClosedError extends DomainError {
  constructor() {
    super('ENROLLMENT_CLOSED', 'Zapisy na ten kurs zostały zamknięte')
  }
}
```

---

## API Contracts

### `POST /api/courses` — rozszerzony request body

```typescript
// src/presentation/api/schemas/course.schema.ts
export const createCourseSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(255),
  description: z.string().max(1000).optional(),
  capacity: z.number().int().min(1, 'Pojemność musi być większa niż 0').max(1000),
  startDate: z.coerce.date().optional(),            // nowe
  endDate: z.coerce.date().optional(),              // nowe
  enrollmentDeadline: z.coerce.date().optional(),   // nowe
})
```

`z.coerce.date()` przyjmuje string `"YYYY-MM-DD"` (zwracany przez `<input type="date">`) i konwertuje
go do `Date`. Formularz wysyła string as-is w JSON body — bez dodatkowej transformacji po stronie klienta.

**Response `201`:** obiekt `Course` z nowymi polami jako ISO string lub `null`.

### `PATCH /api/courses/[courseId]` — nowy endpoint

**Plik:** `src/app/api/courses/[courseId]/route.ts` (dodać export `PATCH` obok istniejącego `GET`)

**Auth:** wymagana rola `ADMIN`.

**Request body:**
```typescript
// src/presentation/api/schemas/course.schema.ts
export const updateCourseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  capacity: z.number().int().min(1).max(1000).optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  enrollmentDeadline: z.coerce.date().nullable().optional(),
})
```

Przykład — update tylko deadline:
```json
{ "enrollmentDeadline": "2026-03-07" }
```

**Response `200`:** zaktualizowany obiekt `CourseWithLecturer`.

**Błędy:**
- `404 NOT_FOUND` — kurs nie istnieje
- `403 FORBIDDEN` — rola inna niż ADMIN
- `422 VALIDATION_ERROR` — błąd Zod

### `POST /api/enrollments` — nowy scenariusz błędu

Gdy `enrollmentDeadline != null && new Date() > enrollmentDeadline`:
```
HTTP 409 Conflict
{ "code": "ENROLLMENT_CLOSED", "message": "Zapisy na ten kurs zostały zamknięte" }
```

### `handleApiError` — nowy branch (kolejność ma znaczenie!)

```typescript
// src/presentation/api/error-handler.ts
// Dodać PRZED istniejącym catch-all: if (error instanceof DomainError) → 400
if (error instanceof EnrollmentClosedError)
  return NextResponse.json({ code: error.code, message: error.message }, { status: 409 })
```

`EnrollmentClosedError` jest podklasą `DomainError` — jeśli `instanceof DomainError` stoi wyżej,
pochłonie `EnrollmentClosedError` i zwróci 400 zamiast 409. Kolejność jest load-bearing.

---

## UI/UX

### `CreateCourseDialog.tsx` — 3 nowe date inputy

**Lokalny schemat Zod z cross-field refine:**
```typescript
const schema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  description: z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Min. 1 miejsce'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  enrollmentDeadline: z.string().optional(),
}).refine(
  (data) => {
    if (data.enrollmentDeadline && data.startDate) {
      return new Date(data.enrollmentDeadline) <= new Date(data.startDate)
    }
    return true
  },
  { message: 'Termin zapisów musi być przed datą rozpoczęcia kursu', path: ['enrollmentDeadline'] }
)
```

**Pola formularza (w kolejności):**
```tsx
{/* Data startu */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Data rozpoczęcia (opcjonalnie)
  </label>
  <input
    type="date"
    {...register('startDate')}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

{/* Data końca */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Data zakończenia (opcjonalnie)
  </label>
  <input
    type="date"
    {...register('endDate')}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

{/* Deadline zapisów */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Termin zapisów (opcjonalnie)
  </label>
  <input
    type="date"
    {...register('enrollmentDeadline')}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  {errors.enrollmentDeadline && (
    <p className="mt-1 text-sm text-red-600">{errors.enrollmentDeadline.message}</p>
  )}
</div>
```

**`onSubmit` — mapowanie string → undefined dla pustych pól:**
```typescript
const onSubmit = async (data: FormData) => {
  await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      enrollmentDeadline: data.enrollmentDeadline || undefined,
    }),
  })
}
```

### `EditCourseDialog.tsx` — nowy komponent (analogia do `CreateCourseDialog`)

Nowy plik `src/presentation/components/courses/EditCourseDialog.tsx`. Wzorzec identyczny z Create:
`react-hook-form` + `zodResolver`, lokalny schemat (`updateCourseSchema` — wszystkie pola optional),
`fetch('/api/courses/[courseId]', { method: 'PATCH' })`. Pre-populate inputy wartościami istniejącego
kursu.

W `src/app/admin/courses/page.tsx`: dodać przycisk „Edytuj" w każdym wierszu tabeli →
otwiera `<EditCourseDialog courseId={...} course={...} onUpdated={fetchCourses} />`.

### `src/app/student/courses/page.tsx` — wyświetlanie dat i badge

Przy `course.enrollmentDeadline != null`:
```tsx
<p className="text-sm text-gray-600">
  Zapisy do: {new Date(course.enrollmentDeadline).toLocaleDateString('pl-PL')}
</p>
{new Date() > new Date(course.enrollmentDeadline) && (
  <span className="text-sm text-red-600 font-medium">⚠ Zapisy zamknięte</span>
)}
```

Komponent `EnrollButton` (istniejący w `src/presentation/components/enrollments/EnrollButton.tsx`)
— dodać prop `disabled` gdy deadline minął. Istniejąca logika `EnrollButton` blokuje zapis gdy
`enrollmentStatus === 'FULL'` — rozszerzyć o `isDeadlinePassed`.

### `src/app/lecturer/courses/page.tsx` — wyświetlanie dat

Dodać do wiersza/karty kursu datę zapisów gdy `enrollmentDeadline != null`:
```tsx
{course.enrollmentDeadline && (
  <p className="text-xs text-gray-500">
    Zapisy do: {new Date(course.enrollmentDeadline).toLocaleDateString('pl-PL')}
  </p>
)}
```

---

## Test Scenarios

### `tests/unit/enrollment-deadline.test.ts`

**[AC-010-1]** `EnrollStudentUseCase rzuca EnrollmentClosedError gdy deadline minął`:
```typescript
vi.useFakeTimers()
vi.setSystemTime(new Date('2026-06-01')) // po deadline
const course = { ..., enrollmentDeadline: new Date('2026-05-31') }
// makeICourseRepository stub zwraca course
// expect(useCase.execute(...)).rejects.toThrow(EnrollmentClosedError)
vi.useRealTimers()
```

**[AC-010-2]** `EnrollStudentUseCase pozwala na zapis gdy enrollmentDeadline jest null`:
```typescript
const course = { ..., enrollmentDeadline: null }
// stub zwraca course, enrollmentRepo.enrollAtomic zwraca enrollment
// expect(useCase.execute(...)).resolves.toEqual(enrollment)
```

Oba testy używają `makeICourseRepository(overrides)` i `makeIEnrollmentRepository(overrides)`
(pattern z `testing/unit-stubs`). Zero DB, zero HTTP.

### `tests/integration/enrollment-deadline.test.ts`

**[AC-010-3]** `POST /api/enrollments zwraca 409 ENROLLMENT_CLOSED gdy deadline minął`:
- Fixture: admin tworzy kurs z `enrollmentDeadline` w przeszłości przez `POST /api/courses`
- Akcja: student loguje się i wywołuje `POST /api/enrollments` z tym courseId
- Assert: `res.status === 409` i `body.code === 'ENROLLMENT_CLOSED'`
- Dane przez API (`authFetch`), nie Prisma bezpośrednio.

### `tests/e2e/course-dates.spec.ts`

**[AC-010-4]** Admin tworzy kurs z datami:
- Playwright: zaloguj jako admin, otwórz `/admin/courses`, kliknij „Nowy kurs"
- Wypełnij formularz z `enrollmentDeadline` w przeszłości, zatwierdź
- Assert: kurs pojawia się w tabeli z widoczną datą zapisu

**[AC-010-5]** Student widzi badge „Zapisy zamknięte":
- Playwright: zaloguj jako student, przejdź do `/student/courses`
- Assert: kurs z minięłym deadline pokazuje badge „⚠ Zapisy zamknięte" i disabled button

---

## Acceptance Criteria (z FEATURES.md)

| ID | Kryterium | Plik testu |
|----|-----------|-----------|
| AC-010-1 | `EnrollStudentUseCase` rzuca `EnrollmentClosedError`, gdy `now > enrollmentDeadline` | `tests/unit/enrollment-deadline.test.ts` |
| AC-010-2 | `EnrollStudentUseCase` pozwala na zapis, gdy `enrollmentDeadline` jest null | `tests/unit/enrollment-deadline.test.ts` |
| AC-010-3 | `POST /api/enrollments` zwraca 409 z kodem `ENROLLMENT_CLOSED` gdy deadline minął | `tests/integration/enrollment-deadline.test.ts` |
| AC-010-4 | Admin może ustawić `startDate`, `endDate`, `enrollmentDeadline` przy tworzeniu i edycji kursu | `tests/e2e/course-dates.spec.ts` |
| AC-010-5 | Widok studenta wyświetla termin zapisu i informację o zamkniętych zapisach | `tests/e2e/course-dates.spec.ts` |

---

## Implementation Checklist

Standards do wstrzyknięcia (faza Inject, przez `/inject-standards`):
`domain/errors`, `domain/entities`, `domain/use-cases`, `database/repository-pattern`,
`api/route-structure`, `api/authorization`, `api/response-format`, `testing/unit-stubs`,
`testing/integration-helpers`

- [ ] Inject standards (powyższe)
- [ ] Migracja Prisma (3 nullable kolumny `start_date`, `end_date`, `enrollment_deadline`)
- [ ] `EnrollmentClosedError` w `src/domain/errors/index.ts`
- [ ] Rozszerzenie `Course` entity (`src/domain/entities/course.entity.ts`)
- [ ] `CreateCourseData` + nowy `UpdateCourseData` + `update()` w `ICourseRepository`
- [ ] `PrismaCourseRepository`: `mapCourse()` + `create()` + nowy `update()`
- [ ] Guard w `EnrollStudentUseCase.execute()` (minimalna edycja, bez reformatowania)
- [ ] Nowy `UpdateCourseUseCase` (`src/application/use-cases/courses/UpdateCourseUseCase.ts`)
- [ ] Nowy branch `EnrollmentClosedError → 409` w `handleApiError` (przed `DomainError`)
- [ ] `createCourseSchema` + nowy `updateCourseSchema` w `course.schema.ts`
- [ ] `PATCH` handler w `src/app/api/courses/[courseId]/route.ts`
- [ ] `CreateCourseDialog.tsx` — 3 date inputy + cross-field refine
- [ ] Nowy `EditCourseDialog.tsx`
- [ ] `src/app/admin/courses/page.tsx` — przycisk „Edytuj" + `<EditCourseDialog>`
- [ ] `src/app/student/courses/page.tsx` — daty + badge + disabled button
- [ ] `src/app/lecturer/courses/page.tsx` — daty
- [ ] Testy jednostkowe AC-010-1, AC-010-2
- [ ] Testy integracyjne AC-010-3
- [ ] Testy e2e AC-010-4, AC-010-5

---

## Changelog

### 2026-05-17
- Initial specification
- v2: Uzupełnienie po spec-reviewer — dodano UpdateCourseData, PATCH endpoint, EditCourseDialog,
  precyzyjne ścieżki plików, konwersja string→Date, cross-field refine, scenariusze testów,
  DomainError reference, kolejność instanceof w handleApiError
