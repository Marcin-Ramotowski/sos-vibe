# Architecture Pattern

## Selected Pattern: Modular Monolith (Clean Architecture)

## Rationale

Based on:
- **Deployment**: VPS (Docker) — jeden kontener, jeden deploy
- **Scale**: Setki użytkowników, brak wymagań rozproszonych
- **Team**: 1 osoba (solo dev)
- **Requirement**: Clean Architecture — logika domenowa niezależna od frameworka

Modular Monolith został wybrany, ponieważ:
- Jeden codebase = jeden deploy, zero overhead DevOps dla solo deva
- Moduły domenowe wymuszają separację odpowiedzialności bez kosztów mikroserwisów
- Clean Architecture wewnątrz monolitu daje testowalność domeny bez uruchamiania HTTP ani bazy
- Możliwa przyszła ekstrakcja do osobnych serwisów jeśli skala tego wymagnie

## Structure

```
sos/
├── src/
│   ├── domain/              # Czysta logika domenowa — ZERO zależności od frameworka
│   │   ├── entities/        # User, Course, Enrollment, Grade, GradeAuditLog
│   │   ├── repositories/    # Interfejsy (porty) — np. ICourseRepository
│   │   ├── services/        # Domain services — EnrollmentService (race condition logic)
│   │   └── errors/          # Domain errors — CourseFullError, AlreadyEnrolledError
│   │
│   ├── application/         # Use cases — orkiestracja domeny
│   │   ├── use-cases/       # EnrollStudentUseCase, AssignGradeUseCase, etc.
│   │   └── dtos/            # Input/Output DTOs dla use cases
│   │
│   ├── infrastructure/      # Adaptery — Prisma, zewnętrzne serwisy
│   │   ├── database/        # Prisma client, migrations
│   │   └── repositories/    # Implementacje ICourseRepository, etc.
│   │
│   └── presentation/        # Next.js — cienka warstwa HTTP
│       ├── app/             # Next.js App Router (pages, layouts)
│       ├── components/      # React komponenty UI
│       └── api/             # Route Handlers (wywołują use cases, nic więcej)
│
├── tests/
│   ├── unit/                # Testy domeny i use cases (bez DB, bez HTTP)
│   ├── integration/         # Testy z prawdziwą bazą danych
│   └── e2e/                 # Playwright — pełny user flow
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

## Reguła Zależności (Dependency Rule)

```
Presentation → Application → Domain
Infrastructure → Domain (implementuje interfejsy)

Kierunek zależności: zawsze do wewnątrz.
Domain nie zna Prisma. Application nie zna Next.js.
```

## Key Decisions

- **Route Handlers są cienkie** — walidacja HTTP, wywołanie use case, mapowanie odpowiedzi. Zero logiki biznesowej.
- **Domain Services** obsługują krytyczne operacje wielokrokowe (enrollment z blokadą)
- **Dependency Injection** przez konstruktory — testowalność bez frameworka DI
- **Interfejsy repozytoriów** w domenie — w testach podmieniane in-memory implementacjami

## Future Considerations

- Przy wzroście zespołu: podział na osobne pakiety (monorepo) zachowując te same granice
- Przy wzroście skali: wydzielenie EnrollmentService do osobnego serwisu bez zmiany logiki domenowej
- Jeśli potrzebna kolejka (np. powiadomienia): dodanie portu `INotificationService` w domenie bez zmiany use cases
