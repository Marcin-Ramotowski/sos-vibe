# Data Model

## Entities

### User
Użytkownik systemu — student, wykładowca lub admin.

- id: UUID
- email: String (unique)
- passwordHash: String
- role: Enum (STUDENT, LECTURER, ADMIN)
- firstName: String
- lastName: String
- createdAt: DateTime
- updatedAt: DateTime

### Course
Kurs (przedmiot) oferowany przez uczelnię.

- id: UUID
- name: String
- description: String (nullable)
- capacity: Int (> 0)
- lecturerId: UUID → User (FK, nullable — kurs może istnieć bez przypisanego wykładowcy)
- createdAt: DateTime
- updatedAt: DateTime

### Enrollment
Zapis studenta na kurs. Jeden student może być zapisany na dany kurs tylko raz.

- id: UUID
- studentId: UUID → User (FK)
- courseId: UUID → Course (FK)
- enrolledAt: DateTime
- UNIQUE(studentId, courseId)

### Grade
Ocena studenta w ramach konkretnego zapisu na kurs.

- id: UUID
- enrollmentId: UUID → Enrollment (FK, unique — jeden zapis = jedna ocena)
- value: Decimal (2.0 | 3.0 | 3.5 | 4.0 | 4.5 | 5.0 | 5.5)
- gradedById: UUID → User (FK — wykładowca wystawiający ocenę)
- createdAt: DateTime
- updatedAt: DateTime

### GradeAuditLog
Niezmienialny log każdej zmiany oceny — kto, co zmienił, kiedy.

- id: UUID
- gradeId: UUID → Grade (FK)
- enrollmentId: UUID → Enrollment (FK — redundantne, ułatwia query)
- oldValue: Decimal (nullable — null = pierwsze wystawienie)
- newValue: Decimal
- changedById: UUID → User (FK)
- changedAt: DateTime

## Relationships

- User 1:N Course (User jako Lecturer — jeden wykładowca może prowadzić wiele kursów)
- User 1:N Enrollment (jeden student może być zapisany na wiele kursów)
- Course 1:N Enrollment (jeden kurs ma wielu zapisanych studentów)
- Enrollment 0:1 Grade (jeden zapis ma co najwyżej jedną ocenę)
- Grade 1:N GradeAuditLog (jedna ocena ma historię zmian)

## Indexes

### Wymagane (correctness)
- User.email — UNIQUE
- Enrollment(studentId, courseId) — UNIQUE (blokada duplikatów)

### Wydajnościowe (performance)
- Enrollment.courseId — szybkie liczenie zapisanych (COUNT przy sprawdzaniu limitu)
- Enrollment.studentId — szybkie pobieranie kursów studenta
- Course.lecturerId — szybkie pobieranie kursów wykładowcy
- GradeAuditLog.gradeId — szybkie pobieranie historii oceny
- GradeAuditLog.enrollmentId — szybkie pobieranie historii dla zapisu

## Uwagi projektowe

### Ochrona przed race conditions przy zapisach
Przy zapisie studenta na kurs musimy użyć jednej z:
- `SELECT FOR UPDATE` na wierszu kursu (pessimistic locking)
- Atomic `UPDATE courses SET enrolledCount = enrolledCount + 1 WHERE id = ? AND enrolledCount < capacity` z kontrolą affected rows
- Alternatywnie: `enrolledCount` jako kolumna denormalizowana na Course, aktualizowana atomowo

Rekomendacja: przechowuj `enrolledCount` jako denormalizowaną kolumnę na Course, aktualizowaną atomowo w tej samej transakcji co INSERT do Enrollment. Unika kosztownych COUNT() przy każdym sprawdzeniu.

### Brak soft delete w MVP
Brak `deletedAt` / soft delete — usuniętych danych nie przywracamy w MVP.
