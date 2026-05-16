# Constitution

## Non-Negotiables

### Bezpieczeństwo i autoryzacja
- Pełne RBAC (role-based access control): student, wykładowca, admin
- Autoryzacja egzekwowana na poziomie backendu — nie tylko UI
- Brak domyślnych dostępów; każda operacja wymaga jawnej weryfikacji roli
- Niemożliwe: student widzi cudze oceny, student wystawia oceny, wykładowca modyfikuje cudze kursy

### Integralność danych
- Klucze obce (FK) i constraints w bazie (NOT NULL, UNIQUE)
- Wszystkie operacje modyfikujące stan są atomowe (transakcje DB)
- Brak stanów częściowych (partial updates) — operacja albo w pełni się powiedzie, albo nie zmieni nic
- Niemożliwe: zapis bez kursu, ocena bez studenta i kursu, duplikaty zapisów

### Reguły biznesowe (Domain Invariants)
- Logika biznesowa egzekwowana wyłącznie w backendzie — nie w UI, nie w middleware
- Niemożliwe: przekroczenie limitu miejsc, podwójny zapis studenta, ocena od nieprzypisanego wykładowcy

### Odporność na race conditions
- Operacje krytyczne (zapisy, oceny) realizowane transakcyjnie z blokadami
- Brak wzorca „check then insert" bez zabezpieczenia
- Niemożliwe: dwóch studentów zajmuje to samo ostatnie miejsce

### Spójność odpowiedzi API
- API zawsze odzwierciedla rzeczywisty stan systemu
- Brak "half-success states" — response sukcesu = dane są w bazie
- Global error handler — stack trace i SQL errors nigdy nie docierają do UI

### Idempotencja kluczowych operacji
- Dwukrotne kliknięcie "zapisz się" nie tworzy dwóch zapisów
- Retry requestu nie powoduje duplikatów

### Audytowalność ocen (MVP)
- Każda zmiana oceny musi być zalogowana: kto zmienił, co zmienił, kiedy
- Niemożliwe: "kto zmienił ocenę?" → brak odpowiedzi

### Architektura
- Wyraźna separacja warstw: domena / aplikacja / infrastruktura / prezentacja
- Logika biznesowa całkowicie odseparowana od frameworka, ORM i UI
- Możliwość testowania logiki domenowej bez uruchamiania serwera HTTP ani bazy danych

## Explicit Non-Goals

- Finanse studenta (czesne, opłaty, faktury) — to domena ERP, nie LMS
- Procesy formalne dziekanatu (wnioski, podania, decyzje administracyjne) — to workflow system
- Plan zajęć, harmonogramy, zarządzanie salami — to system timetabling
- Komunikacja student–wykładowca (czat, messaging, forum) — osobny produkt
- Egzaminy online, quizy, proctoring — to oddzielny LMS exam engine
- Rekrutacja, dyplomy, cykl życia studenta poza systemem kursowym
- SSO, LDAP, OAuth jako IdP — osobna infrastruktura bezpieczeństwa
- Zaawansowana analityka, dashboardy BI, rankingi
- Automatyczne przypisywanie wykładowców, AI, optymalizacja
- System plug-in / marketplace modułów

**Test brzegowy**: Jeśli coś nie jest potrzebne do zapisania się na kurs, prowadzenia kursu albo wystawienia oceny — nie istnieje w tym systemie.

## Technical Constraints

- Clean Architecture: separacja domena / aplikacja / infrastruktura
- Logika biznesowa niezależna od technologii (framework-agnostic domain layer)
- Każdy endpoint weryfikuje autoryzację — bez wyjątków
- Operacje krytyczne: transakcje DB + blokady (bez "check then insert")
- Walidacja na poziomie backendu, nie tylko walidacja wejścia (input validation ≠ business rules)

## Timeline & Resources

- Timeline: brak deadline'u (projekt hobbystyczny)
- Team: 1 osoba (solo dev)
- Constraints: brak zewnętrznych wymagań terminowych; priorytet — solidność nad szybkością
