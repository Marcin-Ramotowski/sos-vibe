# SOS — System Obsługi Studiów

Akademicki system obsługi studiów: zapisy na kursy, oceny, zarządzanie użytkownikami.
Zaprojektowany jako nowoczesna alternatywa dla przestarzałych systemów uczelniaich — prosty, szybki, transakcyjnie bezpieczny.

## Funkcjonalności

| Rola | Możliwości |
|------|-----------|
| **Student** | Przeglądanie kursów, zapisy/wypisania (race-condition safe), podgląd ocen |
| **Wykładowca** | Przeglądanie swoich kursów, lista studentów, wpisywanie ocen z audit logiem |
| **Admin** | Tworzenie kursów, przypisywanie wykładowców, zarządzanie rolami użytkowników |

## Quick Start

### Wymagania

- Docker & Docker Compose
- Node.js 22+ (opcjonalnie, dla lokalnego development poza Dockerem)

### Development

```bash
# Sklonuj repozytorium
git clone <repo-url>
cd sos

# Skopiuj plik środowiskowy
cp .env.example .env

# Uruchom środowisko deweloperskie
make dev

# Aplikacja dostępna pod http://localhost:3000
```

**Konta testowe** (po seedzie):

| Email | Hasło | Rola |
|-------|-------|------|
| `admin@uni.pl` | `admin123` | Admin |
| `lecturer@uni.pl` | `lecturer123` | Wykładowca |
| `student@uni.pl` | `student123` | Student |

### Uruchamianie testów

```bash
make test              # Wszystkie testy
make test-unit         # Testy jednostkowe
make test-integration  # Testy integracyjne (wymaga działającej aplikacji)
make test-e2e          # Testy E2E (wymaga działającej aplikacji)
make test-coverage     # Raporty pokrycia
```

## Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `DATABASE_URL` | Tak | Connection string do PostgreSQL |
| `JWT_SECRET` | Tak | Sekret do podpisywania tokenów JWT |
| `NODE_ENV` | Nie | `development` / `production` (domyślnie: `development`) |

Pełna lista w `.env.example`.

## Architektura

Projekt oparty na **Clean Architecture**:

```
src/
├── domain/           # Encje, interfejsy repozytoriów, błędy domenowe
├── application/      # Use cases (logika biznesowa)
├── infrastructure/   # Implementacje repozytoriów (Prisma), JWT, bcrypt
└── presentation/     # Route Handlers, middleware, komponenty React
```

**Stack**: Next.js 15 (App Router) · TypeScript 5 · PostgreSQL 16 · Prisma · Tailwind CSS 4

Szczegóły: [`.prodready/design/architecture/`](.prodready/design/architecture/)

## API

Dokumentacja OpenAPI: [`.prodready/design/api/openapi.yaml`](.prodready/design/api/openapi.yaml)

Główne endpointy:

| Method | Path | Opis |
|--------|------|------|
| `POST` | `/api/auth/login` | Logowanie |
| `POST` | `/api/auth/logout` | Wylogowanie |
| `GET` | `/api/courses` | Lista kursów |
| `POST` | `/api/courses` | Utwórz kurs (ADMIN) |
| `POST` | `/api/enrollments` | Zapisz się na kurs (STUDENT) |
| `PUT` | `/api/courses/:id/students/:id/grade` | Wystaw ocenę (LECTURER) |
| `GET` | `/api/health` | Health check |

## Deployment

Przewodnik wdrożenia produkcyjnego: [DEPLOYMENT.md](./DEPLOYMENT.md)

```bash
# Szybki start produkcji
cp .env.example .env.production
# Uzupełnij .env.production silnymi hasłami
make prod-up
make prod-migrate
```

## Makefile — wszystkie komendy

```bash
make help
```
