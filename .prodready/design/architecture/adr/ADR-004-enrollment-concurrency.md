# ADR-004: Enrollment Concurrency Strategy

## Status
Accepted

## Date
2026-05-02

## Context
Core value systemu SOS: "0 przypadków przekroczenia limitu miejsc, 0 duplikatów zapisów". Przy równoległych requestach N studentów zapisujących się na ostatnie M miejsc, system musi zagwarantować poprawność bez race conditions. Pattern "check then insert" (SELECT count, if ok then INSERT) jest unsafe przy concurrent access.

## Decision
Używamy **atomowego UPDATE z warunkiem + INSERT w jednej transakcji**.

```sql
-- Krok 1: Atomowy increment z warunkiem (jeden SQL statement)
UPDATE courses
SET enrolled_count = enrolled_count + 1
WHERE id = $courseId
  AND enrolled_count < capacity
RETURNING id;

-- Krok 2: Jeśli RETURNING zwróciło wiersz → miejsce zarezerwowane, INSERT enrollment
INSERT INTO enrollments (id, student_id, course_id, enrolled_at)
VALUES ($id, $studentId, $courseId, now());

-- Jeśli RETURNING nie zwróciło wiersza → 409 CourseFullError, rollback
```

Cała operacja w `prisma.$transaction([...])` z isolation level `READ COMMITTED` (default PostgreSQL).

Dodatkowe zabezpieczenie: `CHECK (enrolled_count <= capacity)` na tabeli `courses` jako ostatnia linia obrony w bazie.

`UNIQUE (student_id, course_id)` na tabeli `enrollments` — blokada duplikatów na poziomie DB.

## Consequences

### Positive
- Atomowy UPDATE eliminuje race condition — PostgreSQL gwarantuje że dokładnie jeden UPDATE "wygra" przy concurrent requests na ostatnie miejsce
- Brak zewnętrznych locków — działa przy dowolnej liczbie połączeń i instancji
- Prosty w implementacji — dwa SQL statements w transakcji
- DB constraint jako safety net — nawet przy błędzie w aplikacji baza nie pozwoli na niespójność

### Negative
- Raw SQL w `prisma.$transaction` dla atomowego UPDATE — nie można użyć Prisma ORM API dla tej operacji; wymaga `prisma.$executeRaw`
- Wymaga testu concurrency (np. 50 równoległych requestów na 1 miejsce)

### Risks
- **Ryzyko**: Prisma connection pool wyczerpany przy spike'u zapisów. **Mitigacja**: PgBouncer transaction pooling mode + rozsądny `pool_size`; transakcja jest krótka (2 statements)

## Alternatives Considered
1. **SELECT FOR UPDATE (pessimistic locking)**: Odrzucone — blokuje cały wiersz kursu na czas transakcji; przy wielu równoległych zapisach tworzy kolejkę; atomowy UPDATE jest elegantszy
2. **Application-level mutex / Redis lock**: Odrzucone — dodatkowa zależność (Redis), złożoność; baza danych już gwarantuje atomowość
3. **Optimistic locking (version field)**: Odrzucone — wymaga retry logiki w aplikacji; przy wysokiej contention wiele requestów failuje i musi być ponowione
