# Features

A feature moves to `implemented` only when every Acceptance Criteria test listed in its table passes.  
Acceptance Criteria map 1-to-1 onto tests — the test title must begin with the AC ID (e.g. `[AC-001-1]`).

**Status legend:** backlog | in-progress | implemented  
**Size legend:** S (< 3 steps, no arch decisions) · M (multiple layers, planned) · L (new module, full spec)

---

## [FEAT-001] Historia ocen — podgląd audytu
**Status:** backlog  
**Size:** M  
**Added:** 2026-05-17

### Description
Wykładowca i administrator mogą przeglądać pełną historię zmian danej oceny: kto zmienił, kiedy, z jakiej wartości na jaką.

### Scope
**In scope:**
- Endpoint `GET /api/grades/[id]/history` zwracający listę wpisów `GradeAuditLog` dla danej oceny
- Widok w panelu wykładowcy prezentujący historię zmian wybranej oceny

**Out of scope:**
- Eksport historii do pliku
- Możliwość cofania zmian (rollback)

### Motivation
Model `GradeAuditLog` istnieje w schemacie Prisma, ale nie ma żadnego UI ani API do jego odczytu. Transparentność zmian ocen jest wymagana — wykładowca i admin muszą widzieć pełną historię bez bezpośredniego dostępu do bazy.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-001-1 | `GET /api/grades/[id]/history` zwraca listę wpisów audytu dla istniejącej oceny | `tests/integration/grade-history.test.ts > "[AC-001-1] …"` |
| AC-001-2 | Każdy wpis zawiera: id autora zmiany, datę zmiany, poprzednią wartość, nową wartość | `tests/integration/grade-history.test.ts > "[AC-001-2] …"` |
| AC-001-3 | Endpoint zwraca 404, gdy ocena o podanym id nie istnieje | `tests/integration/grade-history.test.ts > "[AC-001-3] …"` |
| AC-001-4 | Endpoint wymaga roli `lecturer` lub `admin`; zwraca 401 dla niezalogowanych | `tests/integration/grade-history.test.ts > "[AC-001-4] …"` |
| AC-001-5 | Widok wykładowcy wyświetla historię zmian dla wybranej oceny | `tests/e2e/grade-history.spec.ts > "[AC-001-5] …"` |

---

## [FEAT-002] Statystyki kursu dla wykładowcy
**Status:** backlog  
**Size:** M  
**Added:** 2026-05-17

### Description
Wykładowca widzi zagregowane statystyki kursu: średnią, medianę, rozkład ocen (histogram) oraz procent zaliczonych — wszystko na dedykowanej stronie.

### Scope
**In scope:**
- Nowa strona `/lecturer/courses/[id]/stats`
- Use case obliczający: średnią, medianę, rozkład ocen (liczba per wartość oceny), procent zaliczonych
- Dostęp tylko dla wykładowcy kursu i administratora

**Out of scope:**
- Porównanie między kursami
- Eksport statystyk
- Zmiany w warstwie domenowej (czysta warstwa aplikacji)

### Motivation
Wykładowca widzi listę studentów i ocen, ale brak agregatów utrudnia szybką ocenę kondycji kursu. Statystyki eliminują konieczność ręcznego liczenia.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-002-1 | Use case oblicza poprawną średnią dla zestawu ocen | `tests/unit/course-stats.test.ts > "[AC-002-1] …"` |
| AC-002-2 | Use case oblicza poprawną medianę dla zestawu ocen | `tests/unit/course-stats.test.ts > "[AC-002-2] …"` |
| AC-002-3 | Use case zwraca poprawny rozkład ocen (liczba wystąpień per wartość) | `tests/unit/course-stats.test.ts > "[AC-002-3] …"` |
| AC-002-4 | Use case oblicza poprawny procent zaliczonych | `tests/unit/course-stats.test.ts > "[AC-002-4] …"` |
| AC-002-5 | Strona `/lecturer/courses/[id]/stats` jest dostępna tylko dla wykładowcy kursu i admina | `tests/e2e/course-stats.spec.ts > "[AC-002-5] …"` |
| AC-002-6 | Strona wyświetla średnią, medianę, rozkład ocen i procent zaliczonych | `tests/e2e/course-stats.spec.ts > "[AC-002-6] …"` |

---

<!-- Template — copy for each new feature:

## [FEAT-NNN] Title
**Status:** backlog
**Size:** S | M | L
**Added:** YYYY-MM-DD

### Description


### Scope
**In scope:**
-

**Out of scope:**
-

### Motivation


### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-NNN-1 | | |

-->
