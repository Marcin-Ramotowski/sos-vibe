# Constraints

## Deployment
- Target: VPS (Docker)
- Region: dowolny tani provider (np. Hetzner, DigitalOcean)
- Containerized: tak (Docker + Docker Compose)

## Scale
- Launch: projekt edukacyjny / dev environment (< 10 userów)
- Produkcyjny target: setki użytkowników jednocześnie bez degradacji
- Wymagania wydajnościowe:
  - Brak N+1 queries — wszystkie relacje ładowane explicite
  - Indeksy na kolumnach używanych w WHERE, JOIN, ORDER BY
  - Pagination na wszystkich listach (brak "SELECT *" bez limitu)
  - Connection pooling (baza danych)
  - Endpoint nie może "ledwo dyszać" przy kilkuset równoległych userach
- Load testing: planowany — architektura musi go wytrzymać

## Budget
- Infrastructure: free tier lub najtańsze opcje VPS
- Tooling: free tier (GitHub, darmowe registry, etc.)
- Zero license cost — tylko open source

## Compliance & Security
- Aplikacyjna poprawność bezpieczeństwa (nie enterprise security):
  - RBAC na backendzie (student / wykładowca / admin)
  - Brak dostępu anonimowego do chronionych zasobów
  - Brak ekspozycji danych poza zakresem roli
  - Brak wycieków błędów technicznych do UI
  - Least privilege — każda rola ma minimalny wymagany zakres uprawnień
- Audit log ocen: obowiązkowy (kto zmienił, co zmienił, kiedy) — MVP
- Nie jest wymagane: TLS (kwestia infrastruktury), szyfrowanie at-rest, enterprise IAM

## Tech Stack Preferences
- Language: do decyzji w fazie Design (bez preferencji — wybieramy najlepsze do wymagań)
- Framework: do decyzji w fazie Design
- Database: do decyzji w fazie Design (relacyjna — wymagania ACID + FK)
- ORM: do decyzji w fazie Design
- Kryterium wyboru: najlepsze dopasowanie do Clean Architecture + transakcyjność + wydajność
