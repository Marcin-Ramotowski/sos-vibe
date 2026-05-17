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
**Status:** implemented  
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

## [FEAT-003] Zmiana hasła przez użytkownika
**Status:** backlog
**Size:** S
**Added:** 2026-05-17

### Description
Zalogowany użytkownik (student, wykładowca, admin) może zmienić własne hasło z poziomu ustawień konta, podając stare hasło oraz nowe hasło dwukrotnie.

### Scope
**In scope:**
- Endpoint `PUT /api/users/me/password` przyjmujący `currentPassword`, `newPassword`, `confirmPassword`
- Walidacja: stare hasło musi być poprawne, nowe musi mieć min. 8 znaków, oba pola nowego hasła muszą być zgodne
- Prosta strona ustawień konta dostępna dla każdej roli

**Out of scope:**
- Resetowanie hasła przez e-mail (flow „zapomniałem hasła")
- Wymuszanie zmiany hasła przy pierwszym logowaniu

### Motivation
Brak możliwości zmiany hasła przez użytkownika to luka bezpieczeństwa — administratorzy musieliby ręcznie modyfikować bazę. Podstawowa funkcja każdego systemu z kontami.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-003-1 | `PUT /api/users/me/password` zwraca 200 po poprawnej zmianie hasła | `tests/integration/change-password.test.ts > "[AC-003-1] …"` |
| AC-003-2 | Endpoint zwraca 400, gdy stare hasło jest niepoprawne | `tests/integration/change-password.test.ts > "[AC-003-2] …"` |
| AC-003-3 | Endpoint zwraca 400, gdy `newPassword` i `confirmPassword` są różne | `tests/integration/change-password.test.ts > "[AC-003-3] …"` |
| AC-003-4 | Endpoint zwraca 400, gdy nowe hasło ma mniej niż 8 znaków | `tests/integration/change-password.test.ts > "[AC-003-4] …"` |
| AC-003-5 | Endpoint zwraca 401 dla niezalogowanego użytkownika | `tests/integration/change-password.test.ts > "[AC-003-5] …"` |
| AC-003-6 | Po zmianie hasła użytkownik może zalogować się nowym hasłem | `tests/e2e/change-password.spec.ts > "[AC-003-6] …"` |

---

## [FEAT-004] Eksport ocen do CSV
**Status:** backlog
**Size:** S
**Added:** 2026-05-17

### Description
Wykładowca może pobrać plik CSV z listą studentów i ich ocenami dla wybranego kursu.

### Scope
**In scope:**
- Endpoint `GET /api/courses/[id]/grades/export` zwracający plik CSV
- CSV zawiera kolumny: `firstName`, `lastName`, `email`, `grade` (lub `brak` gdy nie wystawiono)
- Dostęp tylko dla wykładowcy kursu i administratora
- Przycisk „Eksportuj CSV" w widoku wykładowcy

**Out of scope:**
- Eksport do formatu PDF lub XLSX
- Eksport wielu kursów naraz

### Motivation
Wykładowcy często potrzebują ocen poza systemem (arkusze uczelniane, sprawozdania). Ręczne przepisywanie jest podatne na błędy.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-004-1 | `GET /api/courses/[id]/grades/export` zwraca plik CSV z nagłówkiem i wierszami dla wszystkich zapisanych studentów | `tests/integration/grades-export.test.ts > "[AC-004-1] …"` |
| AC-004-2 | Student bez oceny ma wartość `brak` w kolumnie `grade` | `tests/integration/grades-export.test.ts > "[AC-004-2] …"` |
| AC-004-3 | Endpoint zwraca 403 dla studenta lub wykładowcy niebędącego prowadzącym kursu | `tests/integration/grades-export.test.ts > "[AC-004-3] …"` |
| AC-004-4 | Endpoint zwraca 404, gdy kurs nie istnieje | `tests/integration/grades-export.test.ts > "[AC-004-4] …"` |
| AC-004-5 | Widok wykładowcy zawiera przycisk pobierający plik CSV | `tests/e2e/grades-export.spec.ts > "[AC-004-5] …"` |

---

## [FEAT-006] Dashboard admina
**Status:** backlog
**Size:** M
**Added:** 2026-05-17

### Description
Administrator widzi stronę `/admin/dashboard` z kluczowymi agregatami systemu: liczba użytkowników per rola, liczba kursów, aktywne zapisy, procent kursów z przypisanym wykładowcą.

### Scope
**In scope:**
- Nowa strona `/admin/dashboard`
- Nowy use case `GetSystemStatsUseCase` obliczający: liczbę użytkowników per rola, łączną liczbę kursów, łączną liczbę aktywnych zapisów, procent kursów z lecturerId != null
- Endpoint `GET /api/admin/stats` dostępny tylko dla admina

**Out of scope:**
- Wykresy historyczne (trendy w czasie)
- Możliwość drążenia (drill-down) do szczegółów z poziomu dashboardu

### Motivation
Admin nie ma dziś żadnego widoku ogólnego — musi nawigować między listami, żeby uzyskać podstawowy obraz systemu.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-006-1 | `GET /api/admin/stats` zwraca poprawną liczbę użytkowników per rola | `tests/integration/admin-stats.test.ts > "[AC-006-1] …"` |
| AC-006-2 | `GET /api/admin/stats` zwraca poprawną łączną liczbę kursów i aktywnych zapisów | `tests/integration/admin-stats.test.ts > "[AC-006-2] …"` |
| AC-006-3 | `GET /api/admin/stats` zwraca poprawny procent kursów z przypisanym wykładowcą | `tests/integration/admin-stats.test.ts > "[AC-006-3] …"` |
| AC-006-4 | Endpoint zwraca 403 dla roli innej niż admin | `tests/integration/admin-stats.test.ts > "[AC-006-4] …"` |
| AC-006-5 | Strona `/admin/dashboard` wyświetla wszystkie cztery agregaty | `tests/e2e/admin-dashboard.spec.ts > "[AC-006-5] …"` |

---

## [FEAT-007] Transkrypt studenta (widok admina)
**Status:** backlog
**Size:** M
**Added:** 2026-05-17

### Description
Administrator może wyświetlić pełny transkrypt studenta: wszystkie kursy, na które był/jest zapisany, przypisane oceny oraz daty zapisów.

### Scope
**In scope:**
- Endpoint `GET /api/users/[id]/transcript` zwracający listę wpisów: kurs, data zapisu, ocena (lub brak)
- Widok w panelu admina prezentujący transkrypt wybranego studenta

**Out of scope:**
- Transkrypt dostępny dla samego studenta (osobny feature)
- Obliczanie GPA / średniej ważonej w tym widoku

### Motivation
Admin potrzebuje możliwości weryfikacji historii akademickiej studenta bez dostępu do bazy danych — np. przy rozpatrywaniu reklamacji oceny lub wniosku o urlop.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-007-1 | `GET /api/users/[id]/transcript` zwraca listę wszystkich zapisów studenta z nazwą kursu, datą zapisu i oceną | `tests/integration/student-transcript.test.ts > "[AC-007-1] …"` |
| AC-007-2 | Wpis bez oceny ma pole `grade: null` | `tests/integration/student-transcript.test.ts > "[AC-007-2] …"` |
| AC-007-3 | Endpoint zwraca 404, gdy użytkownik o podanym id nie istnieje lub nie jest studentem | `tests/integration/student-transcript.test.ts > "[AC-007-3] …"` |
| AC-007-4 | Endpoint zwraca 403 dla roli innej niż admin | `tests/integration/student-transcript.test.ts > "[AC-007-4] …"` |
| AC-007-5 | Widok admina wyświetla transkrypt wybranego studenta | `tests/e2e/student-transcript.spec.ts > "[AC-007-5] …"` |

---

## [FEAT-008] Paginacja listy studentów kursu dla wykładowcy
**Status:** backlog
**Size:** M
**Added:** 2026-05-17

### Description
Widok wykładowcy z listą studentów kursu obsługuje paginację po stronie serwera — niezbędne przy kursach z dużą pojemnością.

### Scope
**In scope:**
- Parametry `page` i `pageSize` (domyślnie 20) w endpoincie zwracającym studentów kursu
- Metadane paginacji w odpowiedzi: `total`, `page`, `pageSize`, `totalPages`
- Komponent paginacji w widoku wykładowcy

**Out of scope:**
- Wyszukiwanie i filtrowanie na liście studentów
- Sortowanie po kolumnach

### Motivation
Kursy mogą mieć pojemność kilkuset miejsc. Zwracanie wszystkich rekordów w jednym żądaniu to problem wydajnościowy i UX.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-008-1 | Endpoint przyjmuje parametry `page` i `pageSize` i zwraca odpowiedni podzbiór studentów | `tests/integration/students-pagination.test.ts > "[AC-008-1] …"` |
| AC-008-2 | Odpowiedź zawiera metadane: `total`, `page`, `pageSize`, `totalPages` | `tests/integration/students-pagination.test.ts > "[AC-008-2] …"` |
| AC-008-3 | Przy `page` wykraczającym poza zakres endpoint zwraca pustą listę (nie błąd) | `tests/integration/students-pagination.test.ts > "[AC-008-3] …"` |
| AC-008-4 | Widok wykładowcy wyświetla kontrolki paginacji i reaguje na zmianę strony | `tests/e2e/students-pagination.spec.ts > "[AC-008-4] …"` |

---

## [FEAT-009] Lista oczekujących (waitlist)
**Status:** backlog
**Size:** M
**Added:** 2026-05-17

### Description
Gdy kurs jest pełny, student może dołączyć do kolejki oczekujących. Po wypisaniu się studenta z kursu, pierwszy z kolejki automatycznie otrzymuje miejsce.

### Scope
**In scope:**
- Nowy model `Waitlist` z polami: `id`, `studentId`, `courseId`, `joinedAt`
- Endpoint `POST /api/courses/[id]/waitlist` — dołącz do kolejki
- Endpoint `DELETE /api/courses/[id]/waitlist` — opuść kolejkę
- Automatyczne promowanie pierwszego z kolejki po `UnenrollStudentUseCase` (w tej samej transakcji)
- Widok studenta informujący o pozycji w kolejce

**Out of scope:**
- Powiadomienia e-mail o awansie z kolejki
- Ręczne zarządzanie kolejką przez admina

### Motivation
Pełny kurs dziś oznacza brak możliwości zapisu bez interwencji admina. Waitlist eliminuje ten problem i wykorzystuje istniejącą atomową logikę zapisów.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-009-1 | `POST /api/courses/[id]/waitlist` dodaje studenta do kolejki, gdy kurs jest pełny | `tests/integration/waitlist.test.ts > "[AC-009-1] …"` |
| AC-009-2 | `POST /api/courses/[id]/waitlist` zwraca 409, gdy student jest już w kolejce lub zapisany na kurs | `tests/integration/waitlist.test.ts > "[AC-009-2] …"` |
| AC-009-3 | `POST /api/courses/[id]/waitlist` zwraca 400, gdy kurs ma wolne miejsca (nie trzeba czekać) | `tests/integration/waitlist.test.ts > "[AC-009-3] …"` |
| AC-009-4 | Po wypisaniu studenta z kursu, pierwszy z kolejki jest automatycznie zapisany w tej samej transakcji | `tests/integration/waitlist.test.ts > "[AC-009-4] …"` |
| AC-009-5 | `DELETE /api/courses/[id]/waitlist` usuwa studenta z kolejki | `tests/integration/waitlist.test.ts > "[AC-009-5] …"` |
| AC-009-6 | Widok studenta pokazuje pozycję w kolejce oczekujących | `tests/e2e/waitlist.spec.ts > "[AC-009-6] …"` |

---

## [FEAT-010] Terminy kursów i okno zapisów
**Status:** implemented
**Size:** L
**Added:** 2026-05-17

### Description
Kursy mają daty rozpoczęcia, zakończenia oraz deadline zapisu. Po upłynięciu terminu zapisu studenci nie mogą się zapisać. Admin zarządza tymi datami.

### Scope
**In scope:**
- Nowe pola w modelu `Course`: `startDate`, `endDate`, `enrollmentDeadline` (wszystkie opcjonalne dla kompatybilności wstecznej)
- Migracja bazy danych
- Guard w `EnrollStudentUseCase`: blokada, gdy `now > enrollmentDeadline`
- Nowy błąd domenowy `EnrollmentClosedError`
- Formularz tworzenia/edycji kursu w panelu admina rozszerzony o pola dat
- Wyświetlanie dat i statusu zapisów w widoku studenta i wykładowcy

**Out of scope:**
- Automatyczne wypisywanie studentów po zakończeniu kursu
- Harmonogram zajęć (godziny, sale)

### Motivation
Brak terminów oznacza, że student może zapisać się na kurs dowolnie późno — nawet po jego zakończeniu. Uczelnie wymagają konkretnych okien zapisów.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-010-1 | `EnrollStudentUseCase` rzuca `EnrollmentClosedError`, gdy `now > enrollmentDeadline` | `tests/unit/enrollment-deadline.test.ts > "[AC-010-1] …"` |
| AC-010-2 | `EnrollStudentUseCase` pozwala na zapis, gdy `enrollmentDeadline` jest null (brak limitu) | `tests/unit/enrollment-deadline.test.ts > "[AC-010-2] …"` |
| AC-010-3 | `POST /api/courses/[id]/enrollments` zwraca 409 z kodem `ENROLLMENT_CLOSED`, gdy deadline minął | `tests/integration/enrollment-deadline.test.ts > "[AC-010-3] …"` |
| AC-010-4 | Admin może ustawić `startDate`, `endDate`, `enrollmentDeadline` przy tworzeniu i edycji kursu | `tests/e2e/course-dates.spec.ts > "[AC-010-4] …"` |
| AC-010-5 | Widok studenta wyświetla termin zapisu i informację o zamkniętych zapisach | `tests/e2e/course-dates.spec.ts > "[AC-010-5] …"` |

---

## [FEAT-011] System powiadomień in-app
**Status:** implemented
**Size:** L
**Added:** 2026-05-17

### Description
Użytkownicy otrzymują powiadomienia w aplikacji: student — gdy zostanie oceniony; wykładowca — gdy ktoś zapisze się na jego kurs; admin — możliwość podglądu wszystkich powiadomień.

### Scope
**In scope:**
- Nowy model `Notification` z polami: `id`, `userId`, `type`, `payload` (JSON), `readAt`, `createdAt`
- Tworzenie powiadomień wewnątrz istniejących use casów (`UpsertGradeUseCase`, `EnrollStudentUseCase`) jako operacja w tej samej transakcji
- Endpoint `GET /api/notifications` — lista nieprzeczytanych dla zalogowanego użytkownika
- Endpoint `PUT /api/notifications/[id]/read` — oznacz jako przeczytane
- Wskaźnik nieprzeczytanych w nawigacji (badge z liczbą)

**Out of scope:**
- Powiadomienia push / e-mail
- Powiadomienia w czasie rzeczywistym (WebSocket / SSE)
- Konfiguracja preferencji powiadomień przez użytkownika

### Motivation
Studenci i wykładowcy nie wiedzą o zdarzeniach bez ręcznego odświeżania widoków. Powiadomienia in-app to minimalny mechanizm informowania bez złożoności real-time.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-011-1 | Po wystawieniu oceny student otrzymuje powiadomienie typu `GRADE_ASSIGNED` | `tests/integration/notifications.test.ts > "[AC-011-1] …"` |
| AC-011-2 | Po zapisaniu studenta wykładowca kursu otrzymuje powiadomienie typu `STUDENT_ENROLLED` | `tests/integration/notifications.test.ts > "[AC-011-2] …"` |
| AC-011-3 | `GET /api/notifications` zwraca tylko nieprzeczytane powiadomienia zalogowanego użytkownika | `tests/integration/notifications.test.ts > "[AC-011-3] …"` |
| AC-011-4 | `PUT /api/notifications/[id]/read` oznacza powiadomienie jako przeczytane | `tests/integration/notifications.test.ts > "[AC-011-4] …"` |
| AC-011-5 | Nawigacja wyświetla badge z liczbą nieprzeczytanych powiadomień | `tests/e2e/notifications.spec.ts > "[AC-011-5] …"` |

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
