# Vision

## Problem Statement
Polskie uczelnie działają na systemach takich jak USOS, które są przestarzałe, nieintuicyjne i zniechęcają użytkowników — studenci otwierają je z konieczności i chcą jak najszybciej zamknąć. Brakuje systemu obsługi studiów, który digitalizuje procesy uczelniane (zapisy, oceny, zarządzanie kursami) i jednocześnie jest na tyle przyjazny, że użytkownicy chcą go używać.

## Target Users

### Student (użytkownik sporadyczny, priorytet: prostota)
Studiuje, korzysta z systemu zadaniowo — na początku semestru (zapisy) i po sesji (oceny). Nie chce „systemu" — chce szybko coś załatwić. Kluczowe potrzeby: sprawdzenie zapisów, ocen, dostępnych kursów, prosty zapis/wypisanie bez frustracji, jasny status („czy wszystko ogarnąłem?").

### Wykładowca (użytkownik zadaniowy, priorytet: efektywność)
Prowadzący zajęcia, korzysta rzadziej ale „roboczo". Potrzebuje dostępu do swoich kursów, listy studentów i wygodnego wpisywania ocen. Klucz: ogarnąć kurs i zaliczenia bez walki z systemem.

### Admin / Dziekanat (heavy user, priorytet: kontrola)
Osoba administracyjna pracująca w systemie jak w narzędziu pracy. Zarządza kursami, użytkownikami, przypisaniami. Klucz: wszystko pod kontrolą, działające przewidywalnie, bez potrzeby ręcznych napraw.

## Core Value Proposition
Bezbłędne, transakcyjne zapisy na kursy z żelazną kontrolą ról — w systemie, który student chce otworzyć, a nie musi.

## Success Metrics

### Metryki funkcjonalne (must not fail)
- 0 przypadków przekroczenia limitu miejsc na kursie
- 0 duplikatów zapisów (race condition safety)
- 0 naruszeń RBAC (student nie widzi cudzych ocen, nie wpisuje ocen)
- Brak utraconych/zmienionych ocen bez autoryzacji

### Metryki użytkowe
- Czas zapisu studenta na kurs < 10 sekund
- Liczba kroków do zapisu ≤ 3
- Czas wpisania oceny dla 1 studenta < 5 sekund
- 0 potrzeby ręcznych napraw przez admina po typowych operacjach

## MVP Scope

### Must Have (MVP)

**Użytkownicy i autoryzacja (fundament)**
- Logowanie / wylogowanie
- Role: student, wykładowca, admin
- RBAC — kontrola dostępu na poziomie endpointów, nie tylko UI

**Kursy**
- Tworzenie kursu (admin): nazwa, opis, limit miejsc
- Przypisanie wykładowcy do kursu
- Lista dostępnych kursów

**Zapisy studentów (core value)**
- Zapis na kurs z walidacją limitu miejsc (transakcyjnie, odporne na race conditions)
- Wypisanie się z kursu
- Widok „moje kursy" dla studenta
- Jasny status: zapisany / brak miejsc

**Oceny**
- Wykładowca widzi listę studentów w swoim kursie
- Wpisywanie i edycja ocen
- Student widzi swoje oceny

**UI: nowoczesne i czyste od dnia zero**
- Współczesna szata graficzna (nie szkielet — studenci mają wiedzieć od razu, że to nie USOS z epoki dinozaurów)
- Minimalna liczba kroków, czytelne statusy, feedback po każdej akcji

### Nice to Have (Faza 2+)
- Plan zajęć (harmonogramy, sale, godziny)
- Powiadomienia (email, push, alerty o zapisach)
- Audit log / historia zmian ocen
- Lista rezerwowa (waiting list)
- Zaawansowana analityka i dashboardy
- Self-service admin (edycja profili, zmiana ról przez UI)
- Zaawansowane animacje i SPA optimization
