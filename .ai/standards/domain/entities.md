# Domain Entities

Encje domenowe to czyste TypeScript `interface` — bez klas, bez metod, bez dekoratorów.

```ts
// Baza
export interface Course {
  id: string
  name: string
  capacity: number
  // ...
}

// Rozszerzenia przez extends
export interface CourseWithLecturer extends Course {
  lecturer: { id: string; firstName: string; lastName: string } | null
}

export interface CourseWithStatus extends CourseWithLecturer {
  enrollmentStatus?: 'ENROLLED' | 'NOT_ENROLLED' | 'FULL'
}
```

- Zero importów z Prisma, Next.js ani żadnej biblioteki
- Metody repozytoriów zwracają konkretną wariant (np. `CourseWithLecturer`), nie zawsze bazę
- Typy pomocnicze (jak `EnrollmentStatus`) żyją w pliku encji, nie w osobnym pliku
- Plik: `src/domain/entities/{entity}.entity.ts`
