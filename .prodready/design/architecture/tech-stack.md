# Tech Stack

## Core

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Language | TypeScript 5.x | Typy wymuszają kontrakty domenowe; błędy w kompilacji, nie w runtime |
| Runtime | Node.js 22 LTS | Stabilny, aktywny support; natywne fetch API |
| Framework | Next.js 15 (App Router) | Full-stack monolith: SSR + API Route Handlers w jednym projekcie; nowoczesny UX (RSC, streaming) |
| Database | PostgreSQL 16 | ACID, FK constraints, SELECT FOR UPDATE — wymagane dla race condition safety; darmowy, open source |
| ORM | Prisma 6 | Type-safe queries z generowanymi typami; migracje; `$transaction` + raw SQL dla krytycznych operacji |
| UI Library | shadcn/ui + Tailwind CSS 4 | Komponenty dostępne (a11y), kopiowane do projektu (brak vendor lock), nowoczesny wygląd bez pisania CSS od zera |

## Infrastructure

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Container | Docker + Docker Compose | Jeden `docker-compose up` uruchamia całość |
| Reverse Proxy | Caddy | Automatyczny HTTPS, prosta konfiguracja, darmowy; alternatywa: Nginx |
| CI/CD | GitHub Actions | Darmowy dla projektów publicznych; integracja z GitHub |
| Database Pooling | PgBouncer lub Prisma Accelerate | Connection pooling — wymagany przy setkach req/s na VPS |

## Development

| Tool | Purpose |
|------|---------|
| ESLint + @typescript-eslint | Linting — wymusza clean code patterns |
| Prettier | Formatowanie — zero dyskusji o stylach |
| Vitest | Unit + integration testy — szybszy od Jest, natywny ESM |
| Playwright | E2E testy — pełny user flow przez browser |
| Husky + lint-staged | Git hooks — lint + testy przed commitem |
| tsx | Uruchamianie skryptów TS bez kompilacji (seedy, migracje) |

## Versions

```json
{
  "node": "22.x",
  "typescript": "5.x",
  "next": "15.x",
  "react": "19.x",
  "prisma": "6.x",
  "tailwindcss": "4.x",
  "vitest": "2.x",
  "playwright": "1.x",
  "@types/node": "22.x"
}
```

## Authentication

- **Strategy**: JWT w HTTP-only cookie
- **Library**: `jose` (Web Crypto API, zero zależności)
- **Storage**: HttpOnly + Secure + SameSite=Lax cookie — odporność na XSS
- **Token lifetime**: 24h access token; brak refresh tokena w MVP (wylogowanie = usunięcie cookie)
- **RBAC**: Rola zakodowana w JWT payload; weryfikacja na każdym Route Handler przez middleware

## Race Condition Strategy (Enrollment)

Krytyczna operacja zapisu na kurs używa atomowej aktualizacji:

```sql
UPDATE courses
SET enrolled_count = enrolled_count + 1
WHERE id = $courseId
  AND enrolled_count < capacity
RETURNING id
```

Jeśli `RETURNING` nie zwróci wiersza → kurs pełny. Cała operacja w `$transaction` razem z `INSERT INTO enrollments`.

## Monitoring

- **Logging**: `pino` (structured JSON logs) — wydajniejszy od console.log, gotowy na przyszły log aggregator
- **Error tracking**: Brak w MVP (projekt hobbystyczny)
- **Health check**: `GET /api/health` — sprawdza połączenie z DB
