# Repository Pattern

## Struktura

```
src/domain/repositories/I{Entity}Repository.ts          ← interfejs (port)
src/infrastructure/repositories/Prisma{Entity}Repository.ts  ← implementacja (adapter)
```

Interfejs definiuje typy domenowe. Implementacja zawiera Prisma i mapuje jego typy na domenowe.

## Reguły

- Interfejs w domain/ używa tylko typów z `../entities/` — zero Prisma
- Implementacja importuje `prisma` z `@/infrastructure/database/prisma`
- Każda implementacja ma funkcję `mapXxx()` która konwertuje surowy typ Prisma na domenowy;
  może być funkcją modułową lub prywatną metodą klasy
- Typy Prisma (np. `PrismaClientKnownRequestError`) nie wychodzą poza plik implementacji

## Przykład

```ts
// domain/repositories/ICourseRepository.ts
export interface ICourseRepository {
  findById(id: string): Promise<CourseWithLecturer | null>
  create(data: CreateCourseData): Promise<Course>
  // ...
}

// infrastructure/repositories/PrismaCourseRepository.ts
function mapCourse(c: PrismaCourseWithLecturer): CourseWithLecturer { ... }

export class PrismaCourseRepository implements ICourseRepository {
  async findById(id: string) {
    const c = await prisma.course.findUnique({ where: { id }, include: lecturerInclude })
    if (!c) return null
    return mapCourse(c)   // ← konwersja do typu domenowego
  }
}
```
