# UI Components

Stack: shadcn/ui (base) + Tailwind CSS 4 + custom wrappers gdzie potrzeba.
Komponenty z shadcn/ui kopiowane do projektu — pełna kontrola, brak vendor lock.

## Primitives (shadcn/ui — gotowe)

- [x] Button — primary, secondary, ghost, destructive, loading state
- [x] Input — text, email, password z error state
- [x] Select — dropdown z search
- [x] Checkbox
- [x] Badge — status enrollment (ENROLLED / AVAILABLE / FULL) + oceny
- [x] Separator
- [x] Skeleton — loading placeholders

## Composite (shadcn/ui + customizacja)

- [x] Form — react-hook-form + zod integration, inline errors
- [x] Card — surface, header, content, footer
- [x] Dialog / Modal — confirm actions, form modals
- [x] Toast / Sonner — sukces/błąd po każdej operacji (wymaganie konstytucji: feedback użytkownika)
- [x] Table — sortowalna, z paginacją, loading state
- [x] DropdownMenu — akcje kontekstowe (zmień rolę, wypisz, etc.)
- [x] Avatar — inicjały użytkownika

## Domain Components (custom)

### CourseCard
Karta kursu na liście — nazwa, prowadzący, `freeSpots`, status badge (ENROLLED/AVAILABLE/FULL), CTA button.

### EnrollButton
Przycisk zapisu z loading state i optymistycznym UI — natychmiastowa zmiana statusu po kliknięciu, rollback przy błędzie.

### GradeCell / GradeInput
Komórka tabeli z oceną — "brak oceny" albo wartość. Dla wykładowcy: inline select z polską skalą (2.0–5.5).

### StudentGradeTable
Tabelaryczny widok studentów kursu z inline edycją ocen. Loading, empty state, pagination.

### MyCoursesGrid
Siatka kart "moje kursy" dla studenta — kurs, prowadzący, ocena lub status.

### RoleBadge
Badge z rolą użytkownika — kolorowy, czytelny.

## Layout

- AppShell — sidebar + main content area
- Sidebar — nawigacja role-aware (różne linki dla studenta/wykładowcy/admina)
- PageHeader — tytuł strony + opcjonalne akcje
- PageContent — main content z max-width constraint
- AuthLayout — centered layout dla strony logowania

## Pages (per rola)

### Student
- `/` → redirect to `/courses`
- `/courses` — lista dostępnych kursów z filtrem
- `/my-courses` — moje zapisy + oceny
- `/grades` — wszystkie moje oceny

### Wykładowca
- `/courses` — moje kursy
- `/courses/[id]/students` — lista studentów + oceny

### Admin
- `/admin/courses` — wszystkie kursy, tworzenie, przypisywanie wykładowcy
- `/admin/users` — lista użytkowników, zmiana ról

### Shared
- `/login` — formularz logowania
