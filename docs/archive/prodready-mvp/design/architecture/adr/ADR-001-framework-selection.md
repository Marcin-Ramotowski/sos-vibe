# ADR-001: Framework Selection

## Status
Accepted

## Date
2026-05-02

## Context
Projekt SOS wymaga full-stack monolitu: nowoczesne UI (student-friendly, nie USOS) + REST API + Clean Architecture. Solo dev, VPS, Docker. Brak preferencji technologicznych — wybieramy najlepsze dopasowanie.

## Decision
Używamy **Next.js 15 z App Router** jako full-stack framework.

- Route Handlers (`app/api/`) realizują REST API — cienka warstwa HTTP wywołująca use cases
- React Server Components obsługują renderowanie stron — szybki initial load, brak dodatkowego API call dla SSR
- Logika domenowa żyje w `src/domain/` i `src/application/` — zero importów z `next`
- Deployment: `next build` + Docker + VPS

## Consequences

### Positive
- Jeden projekt, jeden deploy — zero overhead dla solo deva
- Nowoczesny stack (RSC, streaming, Server Actions) daje student-friendly UX out of the box
- Silna TypeScript integracja z Prisma — typy encji domenowych przepływają przez cały stack
- Ogromny ekosystem — shadcn/ui, NextAuth, Prisma adaptery

### Negative
- Next.js App Router wymaga dyscypliny żeby nie "przeciekać" logiki do komponentów — Clean Architecture musi być świadomie egzekwowane
- Blokujący rendering dla Server Components może wymagać Suspense boundary w złożonych widokach

### Risks
- **Ryzyko**: Logika biznesowa w Server Components (naruszenie Clean Architecture). **Mitigacja**: Code review checklist — Server Components mogą tylko wywoływać use cases, nigdy Prisma bezpośrednio.

## Alternatives Considered
1. **NestJS (backend) + React SPA (frontend)**: Odrzucone — dwa projekty + CORS + dwa deploy'e = zbyt duży overhead dla solo deva; NestJS excellent dla CA ale overkill bez zespołu
2. **Fastify + React SPA**: Odrzucone — wymaga ręcznej konfiguracji bundlera, SSR, routingu; więcej setup niż wartości
3. **Remix**: Odrzucone — mniejszy ekosystem, mniej zasobów do nauki; Next.js lepiej znany
