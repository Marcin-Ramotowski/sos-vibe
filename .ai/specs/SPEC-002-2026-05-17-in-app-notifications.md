# SPEC-002: System powiadomień in-app

## Overview

Wprowadzamy powiadomienia wewnątrz aplikacji: student otrzymuje powiadomienie gdy zostanie oceniony,
wykładowca gdy ktoś zapisze się na jego kurs. Zalogowany użytkownik widzi liczbę nieprzeczytanych
w navbarze; może oznaczać powiadomienia jako przeczytane przez API.

**Problem:** Studenci i wykładowcy nie wiedzą o zdarzeniach bez ręcznego odświeżania widoków.
Powiadomienia in-app eliminują tę potrzebę bez złożoności real-time.

**Cel:** Minimalny system powiadomień oparty na pull (HTTP fetch on mount), bez WebSocket, bez e-mail.

**Powiązany feature:** FEAT-011 w `FEATURES.md` (AC-011-1 … AC-011-5).

**Poza scope:** powiadomienia push/e-mail, real-time (WebSocket/SSE), preferencje użytkownika,
powiadomienia dla admina.

---

## User Stories

### Story 1 — Student widzi badge po wystawieniu oceny

**Persona:** Marta, studentka II roku. Loguje się rano by sprawdzić wyniki.

**Krok 1 — Marta otwiera dowolną stronę studenta:**
```
┌──────────────────────────────────────────────────────────────────┐
│  SOS  [Kursy] [Moje kursy] [Oceny]                 🔔 3  Marta K.│
│                                                    ↑             │
│                                              badge z liczbą      │
│                                              nieprzeczytanych     │
└──────────────────────────────────────────────────────────────────┘
```
**Zmiana vs. stan obecny:** `NavBar` nie ma dziś żadnego wskaźnika aktywności. Po zmianie: ikona
dzwonka z czerwonym badge `{count}` gdy `count > 0`. NavBar robi `GET /api/notifications` przy
montowaniu (useEffect), wyświetla `data.length`.

**Za kulisami:**
- `GET /api/notifications` → middleware weryfikuje JWT cookie → injectuje `x-user-id` do headers
- Route Handler odczytuje `x-user-id` → `GetNotificationsUseCase.execute(userId)` →
  `notificationRepo.findUnreadByUserId(userId)` → tablica `Notification[]` z `readAt: null`
- NavBar ustawia `setUnreadCount(data.length)`

---

### Story 2 — Wykładowca widzi badge po zapisaniu studenta i oznacza powiadomienie

**Persona:** Tomasz, wykładowca. Student Bartek zapisał się 5 minut temu.

**Krok 1 — Tomasz widzi badge:**
```
┌────────────────────────────────────────────────────────────────────┐
│  SOS  [Moje kursy]                                   🔔 1  Tomasz W│
└────────────────────────────────────────────────────────────────────┘
```

**Krok 2 — Tomasz wywołuje PUT /api/notifications/{id}/read:**
```json
// Response 200
{ "id": "uuid", "userId": "uuid", "type": "STUDENT_ENROLLED",
  "payload": { "courseId": "uuid", "studentId": "uuid" },
  "readAt": "2026-05-17T10:00:00.000Z", "createdAt": "..." }
```
Badge znika — NavBar dekrementuje `unreadCount` lokalnie (bez re-fetch).

**Zmiana vs. stan obecny:** Nowy endpoint. Brak strony listy powiadomień (out of scope).

**Za kulisami (STUDENT_ENROLLED tworzone):**
Gdy Bartek wywołuje `POST /api/enrollments`, `EnrollStudentUseCase.execute()`:
1. `courseRepo.findById()` → `course` z `lecturerId`
2. `enrollmentRepo.enrollAtomic(studentId, courseId)` → enrollment
3. `if (course.lecturerId)` → `notificationRepo.create({ userId: course.lecturerId, ... })`
   opakowane w `try/catch` — błąd połykany (non-critical)

---

### Story 3 — Kurs bez wykładowcy (brak powiadomienia)

**Persona:** Student zapisuje się na kurs testowy bez przypisanego `lecturerId`.

`EnrollStudentUseCase`: `course.lecturerId === null` → blok `if (course.lecturerId)` pominięty.
Enrollment succeeds, brak powiadomienia, brak błędu.

---

## Architecture

### Auth: skąd pochodzi `x-user-id` w Route Handlers

**Plik middleware:** `src/presentation/middleware.ts` (re-eksportowany przez `src/middleware.ts`)

Middleware chroni wszystkie ścieżki `/api/*` (poza `PUBLIC_PATHS`). Weryfikuje JWT z HttpOnly cookie
(`COOKIE_NAME`), a następnie injectuje payload do nagłówków requesta:
```typescript
headers.set('x-user-id', payload.sub)      // UUID użytkownika
headers.set('x-user-role', payload.role)   // 'STUDENT' | 'LECTURER' | 'ADMIN'
headers.set('x-user-email', payload.email)
// ...
```
Brak tokena lub nieprawidłowy token → `401 UNAUTHORIZED` zwrócony przez middleware (nie dociera
do Route Handlera). Dlatego `request.headers.get('x-user-id')!` (non-null assertion) jest bezpieczne
w każdym chronionym Route Handlerze — middleware gwarantuje obecność tego nagłówka.

Nowe endpointy `/api/notifications` i `/api/notifications/[id]/read` są automatycznie chronione
— matchują pattern `/api/:path*`.

### Przepływ tworzenia powiadomienia GRADE_ASSIGNED

```
PUT /api/courses/[courseId]/students/[studentId]/grade
  → Route Handler (wires PrismaNotificationRepository jako 4. param)
    → UpsertGradeUseCase.execute(input)
        1. isValidGrade(value) — walidacja
        2. courseRepo.findById(courseId) — kurs + lecturerId
        3. lecturerId check — autoryzacja
        4. enrollmentRepo.findByStudentAndCourse() — enrollment
        5. gradeRepo.upsertWithAudit(...)
           ↳ [wewnątrz $transaction: grade upsert + auditLog create]
        6. try { await notificationRepo.create({    ← NOWE
             userId: input.studentId,
             type: 'GRADE_ASSIGNED',
             payload: { courseId: input.courseId, gradeValue: input.value }
           }) } catch { /* silently ignored — non-critical */ }
    → zwraca Grade
```

### Przepływ tworzenia powiadomienia STUDENT_ENROLLED

```
POST /api/enrollments
  → Route Handler (wires PrismaNotificationRepository jako 3. param)
    → EnrollStudentUseCase.execute(input)
        1. courseRepo.findById(courseId) → course (z lecturerId)
        2. enrollmentRepo.enrollAtomic(studentId, courseId)
           ↳ [wewnątrz $transaction: capacity guard + enrollment create]
        3. if (course.lecturerId) {                ← NOWE
             try {
               await notificationRepo.create({ userId: course.lecturerId, ... })
             } catch { /* silently ignored */ }
           }
    → zwraca Enrollment
```

### Kluczowe decyzje architektoniczne

1. **Notification tworzy USE CASE, nie repo:**
   `GradeAuditLog` (analogia) tworzy repo — potrzebuje `existing.value` sprzed upsert w tej
   samej transakcji. `Notification` tworzy use case — potrzebuje `course.lecturerId` i `studentId`
   zebranych przez use case, których repo samoistnie nie ma.

2. **Eventual consistency + try/catch w use case:**
   `notificationRepo.create()` to osobne wywołanie Prisma poza `$transaction` operacji głównej.
   Opakowane w `try/catch` — błąd tworzenia powiadomienia jest połykany. Operacja główna
   (upsert oceny, zapis studenta) już się udała i jej wynik jest zwracany do klienta.
   Powiadomienia są non-critical → akceptowalna utrata przy błędach DB.

3. **`INotificationRepository` wstrzykiwany przez konstruktor:**
   `UpsertGradeUseCase` — 4. parametr. `EnrollStudentUseCase` — 3. parametr.
   Route Handlery tworzą `new PrismaNotificationRepository()` i przekazują dalej.

4. **Fetch on mount w NavBar, decrement lokalny:**
   NavBar pobiera `GET /api/notifications` raz przy montowaniu (useEffect + `[user]` dependency).
   Po `markAsRead` — `setUnreadCount(c => c - 1)` lub re-fetch. Brak pollingu.
   Błąd fetcha jest połykany cicho (`.catch(() => {})`) — badge non-critical.

5. **NotFoundError dla nieistniejącego/cudzego powiadomienia:**
   `markAsRead(id, userId)` sprawdza `findFirst({ where: { id, userId } })`. Brak rekordu → 404.
   Nie ujawniamy 403 — 404 nie zdradza istnienia cudzego zasobu.

6. **`payload` jako JSON:** Różne typy powiadomień mają różne kształty; jedna kolumna `Json`
   upraszcza migrację i repozytorium.

### Zmienione/nowe pliki

| Warstwa | Plik | Zmiana |
|---|---|---|
| DB | `prisma/schema.prisma` + nowa migracja | +model `Notification`, +`notifications` w `User` |
| Domain/Entity | `src/domain/entities/notification.entity.ts` | NOWY |
| Domain/Repo port | `src/domain/repositories/INotificationRepository.ts` | NOWY |
| Infrastructure | `src/infrastructure/repositories/PrismaNotificationRepository.ts` | NOWY |
| Application | `src/application/use-cases/grades/UpsertGradeUseCase.ts` | +4. param + try/catch create |
| Application | `src/application/use-cases/enrollments/EnrollStudentUseCase.ts` | +3. param + try/catch create |
| Application | `src/application/use-cases/notifications/GetNotificationsUseCase.ts` | NOWY |
| Application | `src/application/use-cases/notifications/MarkNotificationReadUseCase.ts` | NOWY |
| Presentation/Route | `src/app/api/notifications/route.ts` | NOWY (GET) |
| Presentation/Route | `src/app/api/notifications/[id]/read/route.ts` | NOWY (PUT) |
| Presentation/Route | `src/app/api/grades/[courseId]/students/[studentId]/grade/route.ts` | +wire NotificationRepo |
| Presentation/Route | `src/app/api/enrollments/route.ts` | +wire NotificationRepo w POST |
| Presentation/UI | `src/presentation/components/ui/NavBar.tsx` | +badge (fetch on mount) |

### Standards do wstrzyknięcia (faza Inject)

`domain/entities`, `domain/use-cases`, `database/repository-pattern`,
`api/route-structure`, `api/authorization`, `api/response-format`,
`testing/unit-stubs`, `testing/integration-helpers`

---

## Data Models

### Prisma schema — nowy model `Notification`

```prisma
model Notification {
  id        String    @id @default(uuid())
  userId    String
  type      String    // 'GRADE_ASSIGNED' | 'STUDENT_ENROLLED'
  payload   Json      @default("{}")
  readAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, readAt])
  @@map("notifications")
}
```

Relacja zwrotna — dodać do `User`:
```prisma
model User {
  // ...existing fields i relacje...
  notifications Notification[] @relation("UserNotifications")  // nowe
}
```

Migrację generuje `npx prisma migrate dev` — nie pisać SQL ręcznie. Prisma wygeneruje
`CREATE TABLE notifications (...)` z `uuid()` obsługiwanym przez Prisma na poziomie aplikacji.

### Domain entity — `Notification`

```typescript
// src/domain/entities/notification.entity.ts
export type NotificationType = 'GRADE_ASSIGNED' | 'STUDENT_ENROLLED'

export interface NotificationPayload {
  courseId?: string
  gradeValue?: number
  studentId?: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  payload: NotificationPayload
  readAt: Date | null
  createdAt: Date
}
```

### `INotificationRepository`

```typescript
// src/domain/repositories/INotificationRepository.ts
import type { Notification, NotificationType, NotificationPayload } from '@/domain/entities/notification.entity'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  payload: NotificationPayload
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>
  findUnreadByUserId(userId: string): Promise<Notification[]>
  markAsRead(id: string, userId: string): Promise<Notification>
}
```

`markAsRead` rzuca `NotFoundError('Powiadomienie')` gdy rekord nie istnieje lub `userId` nie pasuje.

### `PrismaNotificationRepository`

```typescript
// src/infrastructure/repositories/PrismaNotificationRepository.ts
import { prisma } from '@/infrastructure/database/prisma'
import type { Notification as PrismaNotification } from '@prisma/client'
import type { INotificationRepository, CreateNotificationData } from '@/domain/repositories/INotificationRepository'
import type { Notification } from '@/domain/entities/notification.entity'
import type { NotificationType, NotificationPayload } from '@/domain/entities/notification.entity'
import { NotFoundError } from '@/domain/errors'

export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationData): Promise<Notification> {
    const n = await prisma.notification.create({ data })
    return this.mapNotification(n)
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((n) => this.mapNotification(n))
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const existing = await prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) throw new NotFoundError('Powiadomienie')
    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })
    return this.mapNotification(updated)
  }

  private mapNotification(n: PrismaNotification): Notification {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type as NotificationType,
      payload: n.payload as NotificationPayload,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }
  }
}
```

`prisma` client: importowany z `@/infrastructure/database/prisma` (singleton — wzorzec spójny
z innymi repozytoriami w projekcie).

### Rozszerzenie istniejących use casów

Ważne: konstruktory poniżej pokazują TARGET stan dla FEAT-011. Przy implementacji sprawdź aktualny
plik — jeśli FEAT-010 jest już scalony, `EnrollStudentUseCase` może mieć już guard deadline.
Dodaj tylko nowy parametr i `try/catch` notify, nie nadpisuj istniejących zmian.

**`UpsertGradeUseCase` — minimalna edycja:**
```typescript
export class UpsertGradeUseCase {
  constructor(
    private readonly gradeRepo: IGradeRepository,
    private readonly courseRepo: ICourseRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly notificationRepo: INotificationRepository,  // NOWY 4. param
  ) {}

  async execute(input: UpsertGradeInput): Promise<Grade> {
    // ...istniejąca logika bez zmian...
    const grade = await this.gradeRepo.upsertWithAudit({ enrollmentId, value, gradedById })
    // Nowe 3 linie — try/catch:
    try {
      await this.notificationRepo.create({
        userId: input.studentId,
        type: 'GRADE_ASSIGNED',
        payload: { courseId: input.courseId, gradeValue: input.value },
      })
    } catch { /* silently ignored — notification is non-critical */ }
    return grade
  }
}
```

**`EnrollStudentUseCase` — minimalna edycja:**
```typescript
export class EnrollStudentUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly courseRepo: ICourseRepository,
    private readonly notificationRepo: INotificationRepository,  // NOWY 3. param
  ) {}

  async execute(input: EnrollStudentInput): Promise<Enrollment> {
    const course = await this.courseRepo.findById(input.courseId)
    if (!course) throw new NotFoundError('Kurs')
    // [tu może być guard deadline z FEAT-010 — nie usuwać]
    const enrollment = await this.enrollmentRepo.enrollAtomic(input.studentId, input.courseId)
    // Nowe 7 linii:
    if (course.lecturerId) {
      try {
        await this.notificationRepo.create({
          userId: course.lecturerId,
          type: 'STUDENT_ENROLLED',
          payload: { courseId: input.courseId, studentId: input.studentId },
        })
      } catch { /* silently ignored */ }
    }
    return enrollment
  }
}
```

---

## API Contracts

### `GET /api/notifications`

**Plik:** `src/app/api/notifications/route.ts` (nowy)

**Auth:** automatyczna przez middleware (dowolna rola). Brak dodatkowego role check.

**Response `200`:** `Notification[]` — tylko nieprzeczytane (`readAt: null`) dla zalogowanego.

```typescript
// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaNotificationRepository } from '@/infrastructure/repositories/PrismaNotificationRepository'
import { GetNotificationsUseCase } from '@/application/use-cases/notifications/GetNotificationsUseCase'
import { handleApiError } from '@/presentation/api/error-handler'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!  // middleware gwarantuje obecność
    const notificationRepo = new PrismaNotificationRepository()
    const useCase = new GetNotificationsUseCase(notificationRepo)
    const notifications = await useCase.execute(userId)
    return NextResponse.json(notifications)
  } catch (error) {
    return handleApiError(error)
  }
}
```

`handleApiError` importowany z `@/presentation/api/error-handler`.

### `PUT /api/notifications/[id]/read`

**Plik:** `src/app/api/notifications/[id]/read/route.ts` (nowy)

**Auth:** automatyczna przez middleware. Brak dodatkowego role check.

**Response `200`:** zaktualizowany obiekt `Notification` z ustawionym `readAt`.

**Response `404`:** `{ code: 'NOT_FOUND', message: '...' }` gdy nie istnieje lub cudze.

```typescript
// src/app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaNotificationRepository } from '@/infrastructure/repositories/PrismaNotificationRepository'
import { MarkNotificationReadUseCase } from '@/application/use-cases/notifications/MarkNotificationReadUseCase'
import { handleApiError } from '@/presentation/api/error-handler'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')!
    const { id } = await params
    const notificationRepo = new PrismaNotificationRepository()
    const useCase = new MarkNotificationReadUseCase(notificationRepo)
    const notification = await useCase.execute(id, userId)
    return NextResponse.json(notification)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Route Handlers do modyfikacji (wire NotificationRepo)

**`src/app/api/grades/[courseId]/students/[studentId]/grade/route.ts`** — `PUT` handler:
```typescript
// Przed:
const useCase = new UpsertGradeUseCase(gradeRepo, courseRepo, enrollmentRepo)
// Po:
const notificationRepo = new PrismaNotificationRepository()
const useCase = new UpsertGradeUseCase(gradeRepo, courseRepo, enrollmentRepo, notificationRepo)
```

**`src/app/api/enrollments/route.ts`** — `POST` handler:
```typescript
// Przed:
const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo)
// Po:
const notificationRepo = new PrismaNotificationRepository()
const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo, notificationRepo)
```

### Nowe use casy

```typescript
// GetNotificationsUseCase.ts
export class GetNotificationsUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}
  async execute(userId: string): Promise<Notification[]> {
    return this.notificationRepo.findUnreadByUserId(userId)
  }
}

// MarkNotificationReadUseCase.ts
export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}
  async execute(id: string, userId: string): Promise<Notification> {
    return this.notificationRepo.markAsRead(id, userId)
    // markAsRead rzuca NotFoundError → handleApiError mapuje na 404
  }
}
```

---

## UI/UX

### `NavBar.tsx` — badge z liczbą nieprzeczytanych

Istniejące typy w pliku (nie zmieniamy):
```typescript
interface NavLink { href: string; label: string }
interface NavBarProps { links: NavLink[] }
```

`useAuth` hook (`src/presentation/hooks/use-auth.ts`) zwraca:
```typescript
{ user: AuthUser | null, loading: boolean, logout: () => void }
// AuthUser = { id, email, role, firstName, lastName }
```

**Zaktualizowany komponent — dodajemy tylko badge:**
```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/presentation/hooks/use-auth'

interface NavLink { href: string; label: string }
interface NavBarProps { links: NavLink[] }

export function NavBar({ links }: NavBarProps) {
  const { user, loading, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)  // NOWE

  // NOWE — fetch on mount, re-runs gdy user zmienia się (login/logout)
  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    fetch('/api/notifications')
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => {
        setUnreadCount(Array.isArray(data) ? (data as unknown[]).length : 0)
      })
      .catch(() => {}) // badge silently fails — non-critical
  }, [user])

  if (loading) return null

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-6">
        <span className="font-bold text-xl">SOS</span>
        <div className="flex gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              className="hover:text-blue-200 transition-colors text-sm font-medium">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* NOWE — notification badge */}
        {unreadCount > 0 && (
          <div className="relative">
            <span className="text-xl" aria-label="Powiadomienia">🔔</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                             rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
        {user && (
          <span className="text-sm text-blue-100">{user.firstName} {user.lastName}</span>
        )}
        <button onClick={logout}
          className="text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded transition-colors">
          Wyloguj
        </button>
      </div>
    </nav>
  )
}
```

**Zmiana vs. stan obecny:**
- `useState(unreadCount)` + `useEffect` z fetchem — oba są nowe
- Badge renderuje się warunkowo gdy `unreadCount > 0`
- `[user]` dependency: fetch re-runs przy logowaniu/wylogowaniu
- Kliknięcie badge nic nie robi (strona listy powiadomień out of scope)
- Badge failure połykany cicho — nie wpływa na resztę NavBar

---

## Test Scenarios

### `tests/unit/notifications.test.ts` (NOWY)

Używa `makeINotificationRepository(overrides)` — factory z `vi.fn()` per metodę (wzorzec
z `testing/unit-stubs`). Zero DB, zero HTTP.

**[unit] `GetNotificationsUseCase` — deleguje do findUnreadByUserId:**
```typescript
const notifications = [{ id: 'n1', ... }]
const notifRepo = makeINotificationRepository({ findUnreadByUserId: vi.fn().mockResolvedValue(notifications) })
const result = await new GetNotificationsUseCase(notifRepo).execute('user-id')
expect(result).toBe(notifications)
expect(notifRepo.findUnreadByUserId).toHaveBeenCalledWith('user-id')
```

**[unit] `MarkNotificationReadUseCase` — deleguje do markAsRead:**
```typescript
const updated = { id: 'n1', readAt: new Date(), ... }
const notifRepo = makeINotificationRepository({ markAsRead: vi.fn().mockResolvedValue(updated) })
const result = await new MarkNotificationReadUseCase(notifRepo).execute('n1', 'user-id')
expect(result).toBe(updated)
expect(notifRepo.markAsRead).toHaveBeenCalledWith('n1', 'user-id')
```

**[unit] `UpsertGradeUseCase` — tworzy GRADE_ASSIGNED po udanym upsert:**
```typescript
const notifRepo = makeINotificationRepository({ create: vi.fn().mockResolvedValue({}) })
// gradeRepo.upsertWithAudit resolves normally
await useCase.execute({ studentId: 's1', courseId: 'c1', value: 4.5, lecturerId: 'l1' })
expect(notifRepo.create).toHaveBeenCalledWith({
  userId: 's1', type: 'GRADE_ASSIGNED', payload: { courseId: 'c1', gradeValue: 4.5 }
})
```

**[unit] `EnrollStudentUseCase` — tworzy STUDENT_ENROLLED gdy kurs ma wykładowcę:**
```typescript
const notifRepo = makeINotificationRepository({ create: vi.fn().mockResolvedValue({}) })
// courseRepo.findById returns course with lecturerId: 'l1'
// enrollmentRepo.enrollAtomic resolves
await useCase.execute({ studentId: 's1', courseId: 'c1' })
expect(notifRepo.create).toHaveBeenCalledWith({
  userId: 'l1', type: 'STUDENT_ENROLLED', payload: { courseId: 'c1', studentId: 's1' }
})
```

**[unit] `EnrollStudentUseCase` — NIE tworzy powiadomienia gdy brak wykładowcy:**
```typescript
// courseRepo.findById returns course with lecturerId: null
await useCase.execute({ ... })
expect(notifRepo.create).not.toHaveBeenCalled()
```

**[unit] `UpsertGradeUseCase` — błąd notifRepo.create NIE propaguje:**
```typescript
const notifRepo = makeINotificationRepository({ create: vi.fn().mockRejectedValue(new Error('DB error')) })
// gradeRepo.upsertWithAudit resolves normally
await expect(useCase.execute({...})).resolves.toBeDefined() // nie rzuca
```

### `tests/integration/notifications.test.ts` (NOWY)

`BASE_URL = http://localhost:3000` (lub adres dev servera).
Dane przez API (`authFetch`), nie bezpośrednio przez Prisma.

**Fixture setup (dla każdego testu):**
```
1. POST /api/auth/login (admin) → adminToken
2. POST /api/auth/login (lecturer) → lecturerToken
3. POST /api/auth/login (student) → studentToken
4. POST /api/courses { name, capacity: 10 } → courseId (admin)
5. PATCH /api/courses/{courseId}/lecturer { lecturerId } (admin) → przypisuje wykładowcę
6. POST /api/enrollments { courseId } (student) → zapisuje studenta
```

**[AC-011-1]** `student otrzymuje GRADE_ASSIGNED po wystawieniu oceny`:
- Akcja: `PUT /api/courses/{courseId}/students/{studentId}/grade { value: 4.5 }` (lecturer)
- Assert: `GET /api/notifications` (student) → `[{ type: 'GRADE_ASSIGNED', readAt: null, payload: { courseId, gradeValue: 4.5 } }]`

**[AC-011-2]** `wykładowca otrzymuje STUDENT_ENROLLED po zapisaniu studenta`:
- Fixture do kroku 5 wystarczy (enrollment w kroku 6 tworzy powiadomienie)
- Assert: `GET /api/notifications` (lecturer) → `[{ type: 'STUDENT_ENROLLED', readAt: null }]`

**[AC-011-3]** `GET /api/notifications zwraca tylko nieprzeczytane bieżącego użytkownika`:
- Setup: student ma 2 powiadomienia; jedno oznaczono `PUT .../read`
- Assert: `GET /api/notifications` (student) → tablica z 1 elementem
- Assert: `GET /api/notifications` (lecturer) → NIE zawiera powiadomień studenta

**[AC-011-4]** `PUT .../read oznacza jako przeczytane`:
- Setup: student ma 1 powiadomienie GRADE_ASSIGNED
- Akcja: `PUT /api/notifications/{id}/read` (student) → `200`
- Assert: response `readAt !== null`
- Assert: `GET /api/notifications` (student) → pusta tablica

### `tests/e2e/notifications.spec.ts`

**Fixture setup (via API, przed page.goto):**
```typescript
// W beforeAll lub test hook — API calls via fetch z admin credentials
await fetch('/api/courses', { method: 'POST', body: JSON.stringify({ name: 'Test', capacity: 10 }) })
// + assign lecturer, enroll student
```

**[AC-011-5]** `NavBar wyświetla badge z liczbą nieprzeczytanych`:
- Playwright: zaloguj jako wykładowca (`page.goto('/login')`, fill, submit)
- Trigger: admin wykonuje enrollment studenta na kurs wykładowcy (via `page.request.post(...)`)
- Assert: po `page.reload()` (NavBar re-mounts → useEffect re-runs) — `page.locator('🔔 badge')` jest widoczny i `text ≥ '1'`
- Alternatywnie: nawiguj do innej strony i z powrotem (NavBar remounts)

---

## Acceptance Criteria (z FEATURES.md)

| ID | Kryterium | Plik testu |
|----|-----------|-----------|
| AC-011-1 | Po wystawieniu oceny student otrzymuje powiadomienie `GRADE_ASSIGNED` | `tests/integration/notifications.test.ts` |
| AC-011-2 | Po zapisaniu studenta wykładowca kursu otrzymuje powiadomienie `STUDENT_ENROLLED` | `tests/integration/notifications.test.ts` |
| AC-011-3 | `GET /api/notifications` zwraca tylko nieprzeczytane zalogowanego użytkownika | `tests/integration/notifications.test.ts` |
| AC-011-4 | `PUT /api/notifications/[id]/read` oznacza powiadomienie jako przeczytane | `tests/integration/notifications.test.ts` |
| AC-011-5 | Nawigacja wyświetla badge z liczbą nieprzeczytanych | `tests/e2e/notifications.spec.ts` |

---

## Implementation Checklist

- [ ] Inject standards (`domain/entities`, `domain/use-cases`, `database/repository-pattern`,
      `api/route-structure`, `api/authorization`, `api/response-format`,
      `testing/unit-stubs`, `testing/integration-helpers`)
- [ ] Migracja Prisma (model `Notification` + relacja `notifications` w `User`)
- [ ] `src/domain/entities/notification.entity.ts` (NOWY)
- [ ] `src/domain/repositories/INotificationRepository.ts` (NOWY)
- [ ] `src/infrastructure/repositories/PrismaNotificationRepository.ts` (NOWY)
- [ ] `src/application/use-cases/grades/UpsertGradeUseCase.ts` — +4. param + try/catch create (minimalna edycja)
- [ ] `src/application/use-cases/enrollments/EnrollStudentUseCase.ts` — +3. param + try/catch create (minimalna edycja, nie nadpisywać FEAT-010 guard)
- [ ] `src/application/use-cases/notifications/GetNotificationsUseCase.ts` (NOWY)
- [ ] `src/application/use-cases/notifications/MarkNotificationReadUseCase.ts` (NOWY)
- [ ] `src/app/api/notifications/route.ts` — GET handler (NOWY)
- [ ] `src/app/api/notifications/[id]/read/route.ts` — PUT handler (NOWY)
- [ ] `src/app/api/grades/[courseId]/students/[studentId]/grade/route.ts` — +wire NotificationRepo
- [ ] `src/app/api/enrollments/route.ts` — +wire NotificationRepo w POST
- [ ] `src/presentation/components/ui/NavBar.tsx` — +useEffect + badge
- [ ] `tests/unit/notifications.test.ts` (NOWY) — 6 scenariuszy
- [ ] `tests/integration/notifications.test.ts` (NOWY) — AC-011-1..4
- [ ] `tests/e2e/notifications.spec.ts` (NOWY) — AC-011-5

---

## Changelog

### 2026-05-17
- Initial specification
- v2: Uzupełnienie po spec-reviewer — middleware auth explanation, `handleApiError` import path,
  `NavBarProps`/`useAuth` types, try/catch dla notification create (eventual consistency),
  e2e fixture sequence, unit test scenarios, `PrismaNotification` import, clarification
  o Prisma-generated migration SQL, decrement lokalny zamiast "lub re-fetch"
