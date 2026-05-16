# ADR-002: Database Choice

## Status
Accepted

## Date
2026-05-02

## Context
System SOS wymaga: ACID transactions (atomowe zapisy na kursy), Foreign Key constraints (integralność danych), SELECT FOR UPDATE lub atomowy UPDATE (race condition safety), CHECK constraints (enrolled_count ≤ capacity, skala ocen). Budżet: free tier / open source.

## Decision
Używamy **PostgreSQL 16**.

Kluczowe funkcje wymagane przez SOS:
- `SELECT ... FOR UPDATE` — pesymistyczna blokada przy zapisach (alternatywa: atomowy UPDATE z WHERE)
- `CHECK (enrolled_count <= capacity)` — constraint w bazie jako ostatnia linia obrony
- `UNIQUE (student_id, course_id)` — gwarancja braku duplikatów na poziomie DB
- `NUMERIC(3,1) CHECK (value IN (2.0, 3.0, ...))` — walidacja skali ocen w bazie
- Pełna transakcyjność — `BEGIN ... COMMIT` z rollbackiem przy błędzie

## Consequences

### Positive
- ACID out of the box — krytyczny wymóg systemu spełniony na poziomie infrastruktury
- Dojrzały, sprawdzony w produkcji przez dekady
- Doskonała integracja z Prisma (migracje, type-safe queries)
- Free tier: Railway, Supabase, Render (dla dev); na VPS — własna instancja bez kosztu licencji

### Negative
- Wymaga osobnego kontenera w Docker Compose (więcej zasobów na VPS)
- Schema migrations wymagają planowania przy zmianie constraintów

### Risks
- **Ryzyko**: Connection exhaustion przy setkach req/s na tanim VPS. **Mitigacja**: PgBouncer w transaction pooling mode — obowiązkowy w deployment.

## Alternatives Considered
1. **MySQL/MariaDB**: Odrzucone — słabsze wsparcie dla zaawansowanych constraintów i window functions; `SELECT FOR UPDATE` działa inaczej
2. **SQLite**: Odrzucone — brak concurrent writes bez WAL mode; nie nadaje się do race condition safety przy wielu połączeniach
3. **MongoDB**: Odrzucone — brak JOIN, brak FK, ACID tylko w obrębie dokumentu; relacyjny model SOS wymaga relacyjnej bazy
