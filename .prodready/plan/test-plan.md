# Test Plan

## Testing Strategy

### Test Pyramid

```
          /\
         /  \      E2E: 4 pliki, ~20 scenariuszy (Playwright)
        /----\
       /      \    Integration: ~40 test cases (Vitest + real DB)
      /--------\
     /          \  Unit: domain + use cases, coverage >= 80% (Vitest)
    /------------\
```

**Zasada**: Logika domenowa testowana w izolacji (bez DB, bez HTTP). Reguły biznesowe nie uciekają do integration testów.

---

## Unit Tests

**Framework**: Vitest
**Lokalizacja**: `tests/unit/`
**Cel**: >= 80% coverage na `src/domain/` i `src/application/`

### Co testujemy

| Moduł | Scenariusze |
|-------|-------------|
| `EnrollStudentUseCase` | Poprawny zapis; CourseFullError gdy enrolled_count = capacity; AlreadyEnrolledError gdy UNIQUE conflict |
| `UnenrollStudentUseCase` | Poprawne wypisanie; GradeExistsError gdy ocena istnieje |
| `UpsertGradeUseCase` | Wystawienie nowej oceny (audit log oldValue=null); Aktualizacja (audit log oldValue=poprzednia); InvalidGradeError dla wartości spoza skali; AuthorizationError dla wykładowcy nieprzypisanego do kursu |
| `Course entity` | Walidacja: capacity > 0; enrolled_count <= capacity |
| `Grade entity` | Walidacja: value ∈ {2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5} |
| `ListCoursesUseCase` | enrollmentStatus: AVAILABLE / ENROLLED / FULL na podstawie stanu |

### In-Memory Repositories

Dla unit testów: `InMemoryCourseRepository`, `InMemoryEnrollmentRepository`, `InMemoryGradeRepository` — implementują interfejsy domenowe bez Prisma.

---

## Integration Tests

**Framework**: Vitest
**Lokalizacja**: `tests/integration/`
**Baza**: Osobna test DB (`DATABASE_URL_TEST`)
**Setup**: `beforeEach` truncate tabel + seed minimal fixture

### Auth

| Test | Oczekiwany wynik |
|------|-----------------|
| `POST /api/auth/login` — poprawne dane | 200, cookie ustawione |
| `POST /api/auth/login` — złe hasło | 401, generic message |
| `POST /api/auth/login` — nieistniejący email | 401, generic message |
| `POST /api/auth/logout` | 200, cookie usunięte |
| `GET /api/auth/me` — z ważnym tokenem | 200, dane usera |
| Dowolny chroniony endpoint bez tokena | 401 |

### Courses

| Test | Rola | Oczekiwany wynik |
|------|------|-----------------|
| `GET /api/courses` | STUDENT | 200, paginacja, enrollmentStatus |
| `POST /api/courses` — valid | ADMIN | 201, kurs w DB |
| `POST /api/courses` — capacity = 0 | ADMIN | 400 VALIDATION_ERROR |
| `POST /api/courses` | STUDENT | 403 FORBIDDEN |
| `PATCH /api/courses/:id/lecturer` — LECTURER user | ADMIN | 200 |
| `PATCH /api/courses/:id/lecturer` — STUDENT user jako lecturer | ADMIN | 400 |
| `GET /api/courses/:id/students` | LECTURER (własny kurs) | 200, lista studentów |
| `GET /api/courses/:id/students` | LECTURER (cudzy kurs) | 403 |

### Enrollments

| Test | Oczekiwany wynik |
|------|-----------------|
| `POST /api/enrollments` — wolne miejsce | 201, enrolled_count rośnie o 1 |
| `POST /api/enrollments` — kurs pełny | 409 COURSE_FULL |
| `POST /api/enrollments` — duplikat | 409 ALREADY_ENROLLED |
| `POST /api/enrollments` — 50 concurrent na 1 miejsce | Dokładnie 1 sukces, 49 × 409 COURSE_FULL |
| `DELETE /api/enrollments/:courseId` | 200, enrolled_count maleje o 1 |
| `DELETE /api/enrollments/:courseId` — ocena istnieje | 409 GRADE_EXISTS |
| `GET /api/enrollments` | 200, tylko kursy zalogowanego studenta |
| `POST /api/enrollments` | LECTURER | 403 |

### Grades

| Test | Oczekiwany wynik |
|------|-----------------|
| `PUT /api/courses/:id/students/:id/grade` — nowa ocena | 200, GradeAuditLog created (oldValue=null) |
| `PUT` — aktualizacja oceny | 200, GradeAuditLog created (oldValue=poprzednia) |
| `PUT` — wartość 3.7 | 400 VALIDATION_ERROR |
| `PUT` | LECTURER nieprzypisany do kursu | 403 |
| `PUT` | STUDENT | 403 |
| `GET /api/grades/mine` | 200, tylko własne oceny |
| `GET /api/grades/mine` innych userów (przez curl) | 403 |

### Users

| Test | Oczekiwany wynik |
|------|-----------------|
| `GET /api/users` | ADMIN | 200, paginacja |
| `GET /api/users` | STUDENT | 403 |
| `PATCH /api/users/:id/role` | ADMIN | 200 |
| `PATCH /api/users/:id/role` — nieistniejący user | 404 |

---

## E2E Tests

**Framework**: Playwright
**Lokalizacja**: `tests/e2e/`
**Środowisko**: `next dev` + seeded test DB

### `auth.spec.ts`
- Login z poprawnymi danymi → redirect na właściwy dashboard per rola
- Login z błędnymi danymi → komunikat błędu, brak redirect
- Wylogowanie → redirect na `/login`, chronione strony niedostępne

### `enrollment.spec.ts`
- Student przechodzi do listy kursów → widzi kursy z wolnymi miejscami
- Klika "Zapisz się" → status zmienia się na ENROLLED, toast sukces
- Klika ponownie "Zapisz się" → toast "już zapisany"
- Klika "Wypisz się" → status wraca na AVAILABLE
- Kurs bez miejsc → przycisk disabled z "Brak miejsc"

### `grades.spec.ts`
- Wykładowca otwiera kurs → widzi tabelę studentów
- Wybiera ocenę 4.5 dla studenta → toast "Ocena zapisana"
- Student loguje się → widzi ocenę 4.5 z kursu
- Wykładowca próbuje otworzyć cudzy kurs → przekierowany (403 lub redirect)

### `admin.spec.ts`
- Admin tworzy kurs → pojawia się na liście
- Admin przypisuje wykładowcę → kurs pokazuje wykładowcę
- Admin zmienia rolę studenta na LECTURER → po przelogowaniu user ma dostęp do widoku wykładowcy

---

## Traceability: User Stories → Testy

| User Story | Feature File | Unit | Integration | E2E |
|------------|--------------|------|-------------|-----|
| US-001 Login | authentication.feature | — | auth suite | auth.spec.ts |
| US-002 Logout | authentication.feature | — | auth suite | auth.spec.ts |
| US-003 Utwórz kurs | course-management.feature | — | courses suite | admin.spec.ts |
| US-004 Przypisz wykładowcę | course-management.feature | — | courses suite | admin.spec.ts |
| US-007 Zapis na kurs | enrollment.feature | EnrollStudentUseCase | enrollments suite | enrollment.spec.ts |
| US-007 Race condition | enrollment.feature | — | 50 concurrent test | — |
| US-008 Wypisanie | enrollment.feature | UnenrollStudentUseCase | enrollments suite | enrollment.spec.ts |
| US-011 Wystaw ocenę | grades.feature | UpsertGradeUseCase | grades suite | grades.spec.ts |
| US-012 Moje oceny | grades.feature | — | grades suite | grades.spec.ts |

---

## CI Integration

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - Lint (ESLint)
      - TypeScript check (tsc --noEmit)
      - Unit tests (vitest run tests/unit)
      - Integration tests (vitest run tests/integration) + test DB
      - E2E tests (playwright test) + full stack
```
