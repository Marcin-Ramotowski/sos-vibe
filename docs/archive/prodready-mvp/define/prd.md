# Product Requirements Document (PRD)

## 1. Executive Summary

**Product**: SOS — System Obsługi Studiów
**Problem**: Systemy uczelniane (USOS i podobne) są przestarzałe i zniechęcające — studenci otwierają je z konieczności i chcą jak najszybciej zamknąć. Papierowy obieg dokumentów jest nieefektywny dla dziekanatu i wykładowców.
**Solution**: Nowoczesna platforma zarządzania kursami z trzema rolami (student, wykładowca, admin), która digitalizuje zapisy, oceny i zarządzanie kursami — z naciskiem na poprawność danych i UX, który ludzie chcą używać.
**Target Users**: Studenci (task-oriented, sporadyczni), wykładowcy (efektywność), adminstracja dziekanatu (heavy users, kontrola).
**Success Metric**: 0 błędnych zapisów + czas zapisu studenta < 10 sekund + 0 naruszeń RBAC.

## 2. Goals & Non-Goals

### Goals
- Bezbłędne, transakcyjne zapisy na kursy odporne na race conditions
- Pełne RBAC — każda operacja weryfikowana po stronie backendu
- Audytowalność zmian ocen (kto, co, kiedy)
- Nowoczesne UI, które zachęca do używania (nie kolejny USOS z epoki dinozaurów)
- Architektura skalowalna — brak N+1, indeksy, pagination, connection pooling

### Non-Goals
- Finanse, czesne, księgowość
- Wnioski dziekańskie, podania, decyzje administracyjne
- Plan zajęć, harmonogramy, zarządzanie salami
- Komunikacja (czat, messaging, forum)
- Egzaminy online, quizy
- Rekrutacja, dyplomy, cykl życia studenta
- SSO / LDAP / enterprise IAM
- Analityka BI, dashboardy strategiczne

## 3. User Personas

### Persona 1: Student
- **Context**: Studiuje, wchodzi do systemu sporadycznie — głównie na początku semestru i po sesji
- **Pain Point**: Chaos UI, brak informacji czy zapis się udał, za dużo kliknięć, stare systemy jak z innej epoki
- **Desired Outcome**: Wchodzi, w 3 krokach zapisuje się na kurs, widzi status "zapisany" — i zamyka. Wraca po oceny.

### Persona 2: Wykładowca
- **Context**: Prowadzi zajęcia, korzysta z systemu zadaniowo w trakcie semestru i sesji
- **Pain Point**: Wolne formularze, brak zbiorczych widoków, walka z systemem przy wpisywaniu ocen
- **Desired Outcome**: Otwiera kurs, widzi tabelę studentów, wpisuje oceny inline — gotowe.

### Persona 3: Admin / Dziekanat
- **Context**: Heavy user, pracuje w systemie regularnie jak w narzędziu pracy
- **Pain Point**: Brak kontroli, błędy w przypisaniach, konieczność ręcznych napraw po błędach systemu
- **Desired Outcome**: Tworzy kurs, przypisuje wykładowcę — i system robi resztę poprawnie. Zero ręcznych korekt.

## 4. Functional Requirements

### FR-1: Uwierzytelnianie i autoryzacja
- Logowanie email/hasło, wylogowanie z unieważnieniem sesji
- Trzy role: STUDENT, LECTURER, ADMIN z pełnym RBAC
- Każdy endpoint weryfikuje rolę — brak "zapomnianych" endpointów
- **Acceptance**: Brak możliwości wykonania operacji poza zakresem roli

### FR-2: Zarządzanie kursami
- Admin tworzy kursy (nazwa, opis, capacity > 0), przypisuje wykładowcę
- Lista kursów paginowana — student widzi status (dostępny/zapisany/brak miejsc), admin widzi wszystko
- **Acceptance**: Kurs bez wykładowcy może istnieć; kurs bez nazwy lub z capacity ≤ 0 — nie

### FR-3: Zapisy na kursy
- Student zapisuje się/wypisuje; system sprawdza limit atomowo (transakcja + constraint)
- Idempotentny zapis — double-click nie tworzy duplikatu
- Race condition safe — przy równoległych zapisach dokładnie jeden przechodzi gdy zostało jedno miejsce
- Jasny feedback: potwierdzenie zapisu lub czytelny błąd (brak miejsc / już zapisany)
- **Acceptance**: enrolled_count nigdy nie przekracza capacity; UNIQUE(studentId, courseId)

### FR-4: Oceny
- Wykładowca widzi paginowaną listę studentów swojego kursu z ocenami (lub "brak oceny")
- Wystawia/aktualizuje ocenę (skala: 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5)
- Każda zmiana oceny tworzy niemodyfikowalny wpis w GradeAuditLog
- Student widzi tylko własne oceny
- **Acceptance**: Wykładowca może oceniać tylko w swoich kursach; student nie może wystawiać ocen

### FR-5: Panel admina
- Lista użytkowników z możliwością podglądu i zmiany roli
- Paginacja na wszystkich listach

## 5. Non-Functional Requirements

- **Performance**: Brak N+1 queries, indeksy na FK i kolumnach WHERE/JOIN, pagination wszędzie, connection pooling. Cel: endpoint nie degraduje przy setkach równoległych userów.
- **Security**: RBAC na backendzie, brak ekspozycji danych poza zakresem roli, neutralne komunikaty błędów dla użytkownika, audit log dla ocen
- **Availability**: Docker na VPS, brak SLA (projekt hobbystyczny) — ale brak crashy przy normalnym użyciu
- **Budget**: Free tier / najtańszy VPS, wyłącznie open source

## 6. Data Model Summary

### Entities
- **User**: Użytkownik z rolą (STUDENT/LECTURER/ADMIN), email unique
- **Course**: Kurs z limitem miejsc (capacity) i denormalizowanym licznikiem (enrolled_count)
- **Enrollment**: Zapis studenta na kurs — UNIQUE(studentId, courseId), serce systemu
- **Grade**: Ocena dla danego zapisu — max jedna na enrollment; wartości z ograniczonego zbioru
- **GradeAuditLog**: Niemodyfikowalny log zmian ocen — oldValue, newValue, changedBy, changedAt

### Key Relationships
- Enrollment → Course: wiele zapisów na jeden kurs; enrolled_count aktualizowany atomowo
- Grade → Enrollment: jeden do jednego; ocena bez zapisu nie istnieje
- GradeAuditLog → Grade: historia — każda zmiana = nowy wpis

## 7. Scope & Timeline

**MVP Features**: Logowanie/RBAC, tworzenie kursów (admin), przypisanie wykładowcy, lista kursów z statusami, zapis/wypisanie studenta, lista moich kursów, wpisywanie ocen, widok ocen studenta, audit log ocen, nowoczesne UI

**Future Features**: Plan zajęć, powiadomienia, lista rezerwowa, zaawansowana analityka, audit log dla innych operacji, self-service admin, egzaminy online

**Timeline**: Brak deadline'u (projekt hobbystyczny, solo dev)

**Team**: 1 osoba

## 8. Open Questions & Risks

- **Tech stack**: Do decyzji w fazie Design — kryterium: najlepsze dopasowanie do Clean Architecture + ACID + wydajność
- **Wypisanie z kursu z oceną**: US-008 ma otwarte TBD — zablokować wypisanie gdy ocena istnieje, czy tylko ostrzec? Do rozstrzygnięcia w Design.
- **Skala ocen**: Polska skala (2.0–5.5) zakodowana jako CHECK constraint — czy potrzebna elastyczność?
- **Format tokenu sesji**: JWT vs. sesja serwerowa — wpływ na architekturę RBAC, do decyzji w Design.

## 9. References

- Szczegółowe user stories: `requirements/user-stories.md`
- Model danych: `data-model/entities.md`
- Schema SQL: `data-model/schema.sql`
- Scenariusze testowe: `test-scenarios/*.feature`
- Ograniczenia: `constraints.md`
- Konstytucja: `constitution.md`
