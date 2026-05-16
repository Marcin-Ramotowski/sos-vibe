# Backlog

Zadania zidentyfikowane, ale jeszcze nierozpoczęte.

## Historia ocen — podgląd audytu (rozmiar S/M)

Model `GradeAuditLog` istnieje w schemacie Prisma, ale nie ma żadnego UI ani API do jego odczytu.

**Zakres:**
- Endpoint `GET /api/grades/[id]/history` zwracający listę wpisów audytu dla danej oceny
- Widok w panelu wykładowcy pokazujący kto i kiedy zmienił ocenę oraz z jakiej wartości na jaką

**Dlaczego warto:** Transparentność zmian ocen — wykładowca i admin widzą pełną historię bez sięgania do bazy.

---

## Statystyki kursu dla wykładowcy (rozmiar M)

Wykładowca widzi listę studentów i oceny, ale brak agregatów.

**Zakres:**
- Nowa strona `/lecturer/courses/[id]/stats`
- Statystyki wyliczane w use case: średnia, mediana, rozkład ocen (histogram), procent zaliczonych
- Bez zmian w domenie — czysta warstwa aplikacji

**Dlaczego warto:** Szybki wgląd w kondycję kursu bez ręcznego liczenia w głowie.
