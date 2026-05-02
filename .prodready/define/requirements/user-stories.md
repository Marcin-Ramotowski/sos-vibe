# User Stories

## Epic 1: Uwierzytelnianie i autoryzacja

### US-001: Logowanie do systemu
**As a** użytkownik systemu (student / wykładowca / admin)
**I want to** zalogować się przy użyciu adresu email i hasła
**So that** mogę uzyskać dostęp do funkcji odpowiadających mojej roli

**Acceptance Criteria**:
- [ ] Given poprawne dane logowania, when wysyłam formularz, then otrzymuję token sesji i jestem przekierowany do dashboardu właściwego dla mojej roli
- [ ] Given niepoprawne hasło, when wysyłam formularz, then otrzymuję komunikat błędu bez informacji która dana jest błędna
- [ ] Given nieistniejący email, when wysyłam formularz, then otrzymuję ten sam neutralny komunikat błędu
- [ ] Given brak tokenu sesji, when próbuję uzyskać dostęp do chronionego zasobu, then otrzymuję odpowiedź 401

**Priority**: P0
**Estimate**: S

---

### US-002: Wylogowanie z systemu
**As a** zalogowany użytkownik
**I want to** wylogować się z systemu
**So that** moja sesja zostaje zakończona i żadna inna osoba nie może użyć mojego konta

**Acceptance Criteria**:
- [ ] Given zalogowany użytkownik, when klikam "wyloguj", then token sesji jest unieważniony
- [ ] Given unieważniony token, when próbuję użyć go do kolejnego requestu, then otrzymuję 401

**Priority**: P0
**Estimate**: S

---

## Epic 2: Zarządzanie kursami (Admin)

### US-003: Tworzenie kursu
**As an** admin
**I want to** utworzyć nowy kurs z nazwą, opisem i limitem miejsc
**So that** studenci mogą się na niego zapisywać

**Acceptance Criteria**:
- [ ] Given dane kursu (nazwa, opis, limit > 0), when tworzę kurs, then kurs pojawia się w systemie z unikalnym ID
- [ ] Given limit miejsc = 0 lub ujemny, when tworzę kurs, then otrzymuję błąd walidacji
- [ ] Given brak nazwy kursu, when tworzę kurs, then otrzymuję błąd walidacji
- [ ] Given rola student lub wykładowca, when próbuję utworzyć kurs, then otrzymuję 403

**Priority**: P0
**Estimate**: S

---

### US-004: Przypisanie wykładowcy do kursu
**As an** admin
**I want to** przypisać wykładowcę do istniejącego kursu
**So that** wykładowca może zarządzać kursem i wystawiać oceny

**Acceptance Criteria**:
- [ ] Given istniejący kurs i użytkownik z rolą wykładowcy, when przypisuję wykładowcę, then powiązanie zostaje zapisane
- [ ] Given użytkownik z rolą studenta, when próbuję go przypisać jako wykładowcę, then otrzymuję błąd
- [ ] Given nieistniejący kurs lub użytkownik, when próbuję przypisania, then otrzymuję 404
- [ ] Given rola student lub wykładowca, when próbuję przypisać wykładowcę, then otrzymuję 403

**Priority**: P0
**Estimate**: S

---

### US-005: Przeglądanie wszystkich kursów (Admin)
**As an** admin
**I want to** widzieć listę wszystkich kursów w systemie
**So that** mogę zarządzać ofertą dydaktyczną uczelni

**Acceptance Criteria**:
- [ ] Given zalogowany admin, when przeglądam kursy, then widzę listę ze wszystkimi kursami (nazwa, prowadzący, liczba zapisanych / limit)
- [ ] Given brak kursów, when przeglądam listę, then widzę pusty stan z komunikatem
- [ ] Wyniki są paginowane (domyślnie max 50 na stronę)

**Priority**: P0
**Estimate**: S

---

## Epic 3: Zapisy na kursy (Student)

### US-006: Przeglądanie dostępnych kursów
**As a** student
**I want to** zobaczyć listę dostępnych kursów
**So that** mogę wybrać, na które chcę się zapisać

**Acceptance Criteria**:
- [ ] Given zalogowany student, when przeglądam kursy, then widzę listę z nazwą, opisem, prowadzącym, liczbą wolnych miejsc
- [ ] Given kurs z 0 wolnymi miejscami, when go widzę na liście, then jest oznaczony jako "brak miejsc"
- [ ] Given kurs na który już jestem zapisany, when go widzę na liście, then jest oznaczony jako "zapisany"
- [ ] Wyniki są paginowane

**Priority**: P0
**Estimate**: S

---

### US-007: Zapis na kurs
**As a** student
**I want to** zapisać się na wybrany kurs
**So that** mogę uczęszczać na zajęcia i otrzymać ocenę

**Acceptance Criteria**:
- [ ] Given kurs z wolnymi miejscami, when zapisuję się, then jestem zapisany i liczba wolnych miejsc maleje o 1
- [ ] Given kurs bez wolnych miejsc, when próbuję się zapisać, then otrzymuję czytelny komunikat "brak miejsc" i nie jestem zapisany
- [ ] Given że już jestem zapisany na kurs, when próbuję się zapisać ponownie, then otrzymuję informację "już zapisany" (idempotencja)
- [ ] Given dwóch studentów jednocześnie zapisujących się na ostatnie miejsce, when oba requesty trafiają, then dokładnie jeden zostaje zapisany, drugi otrzymuje "brak miejsc"
- [ ] Given rola wykładowcy lub admina, when próbuję się zapisać jako student, then otrzymuję 403

**Priority**: P0
**Estimate**: M

---

### US-008: Wypisanie się z kursu
**As a** student
**I want to** wypisać się z kursu
**So that** mogę zwolnić miejsce i zaktualizować swój plan

**Acceptance Criteria**:
- [ ] Given że jestem zapisany na kurs, when wypisuję się, then mój zapis znika i liczba wolnych miejsc rośnie o 1
- [ ] Given że nie jestem zapisany na kurs, when próbuję się wypisać, then otrzymuję 404 lub "nie jesteś zapisany"
- [ ] Given że kurs ma już wystawioną ocenę dla mnie, when próbuję się wypisać, then system informuje o konsekwencji (TBD: blokada lub ostrzeżenie)

**Priority**: P0
**Estimate**: S

---

### US-009: Podgląd moich kursów
**As a** student
**I want to** zobaczyć listę kursów, na które jestem zapisany
**So that** wiem "czy wszystko ogarnąłem na semestr?"

**Acceptance Criteria**:
- [ ] Given zalogowany student, when przechodzę do "moje kursy", then widzę tylko kursy, na które jestem zapisany
- [ ] Given kurs na liście moich kursów, when go widzę, then widzę też moją ocenę (jeśli wystawiona)
- [ ] Given brak zapisów, when przechodzę do "moje kursy", then widzę pusty stan z komunikatem

**Priority**: P0
**Estimate**: S

---

## Epic 4: Zarządzanie ocenami (Wykładowca)

### US-010: Przeglądanie studentów w kursie
**As a** wykładowca
**I want to** zobaczyć listę studentów zapisanych na mój kurs
**So that** wiem kogo muszę ocenić

**Acceptance Criteria**:
- [ ] Given zalogowany wykładowca, when przeglądam swój kurs, then widzę listę studentów (imię/email) z ich ocenami lub statusem "brak oceny"
- [ ] Given kurs, który nie jest mój, when próbuję zobaczyć studentów, then otrzymuję 403
- [ ] Wyniki są paginowane

**Priority**: P0
**Estimate**: S

---

### US-011: Wystawienie oceny
**As a** wykładowca
**I want to** wystawić lub zaktualizować ocenę studentowi w moim kursie
**So that** student może sprawdzić swój wynik

**Acceptance Criteria**:
- [ ] Given student zapisany na mój kurs, when wystawiam mu ocenę (2.0–5.0 lub 5.5), then ocena jest zapisana i widoczna dla studenta
- [ ] Given ocena poza dopuszczalną skalą, when próbuję ją zapisać, then otrzymuję błąd walidacji
- [ ] Given że student nie jest zapisany na kurs, when próbuję wystawić ocenę, then otrzymuję błąd
- [ ] Given że kurs nie jest mój, when próbuję wystawić ocenę, then otrzymuję 403
- [ ] Given każda zmiana oceny, when zostaje zapisana, then tworzony jest wpis audit logu (kto, co zmienił, kiedy)
- [ ] Given ponowne wystawienie oceny (update), when ocena się zmienia, then audit log zawiera starą i nową wartość

**Priority**: P0
**Estimate**: M

---

### US-012: Podgląd moich ocen (Student)
**As a** student
**I want to** zobaczyć moje oceny ze wszystkich kursów
**So that** wiem jak idzie mi semestr

**Acceptance Criteria**:
- [ ] Given zalogowany student, when przechodzę do "moje oceny", then widzę listę: kurs, prowadzący, ocena (lub "brak oceny")
- [ ] Given oceny innego studenta, when próbuję je zobaczyć (np. przez manipulację URL), then otrzymuję 403
- [ ] Given brak ocen, when przeglądam widok, then widzę odpowiedni komunikat

**Priority**: P0
**Estimate**: S

---

## Epic 5: Panel Admina

### US-013: Zarządzanie użytkownikami
**As an** admin
**I want to** przeglądać listę użytkowników i zarządzać ich rolami
**So that** mogę kontrolować kto ma dostęp do czego w systemie

**Acceptance Criteria**:
- [ ] Given zalogowany admin, when przeglądam użytkowników, then widzę listę z emailem i rolą
- [ ] Given użytkownik na liście, when zmieniam jego rolę, then zmiana jest zapisana i nowa rola obowiązuje przy następnym logowaniu
- [ ] Given rola student lub wykładowca, when próbuję zarządzać użytkownikami, then otrzymuję 403
- [ ] Wyniki są paginowane

**Priority**: P1
**Estimate**: S
