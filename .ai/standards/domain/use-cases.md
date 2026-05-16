# Use Case Structure

Każdy use case to klasa z konstruktorem i jedną metodą `execute`.

```ts
// Input i output typowane w tym samym pliku
export interface UpsertGradeInput {
  courseId: string
  studentId: string
  value: number
  lecturerId: string
}

export class UpsertGradeUseCase {
  constructor(
    private readonly gradeRepo: IGradeRepository,
    private readonly courseRepo: ICourseRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(input: UpsertGradeInput): Promise<Grade> {
    // walidacja domenowa
    // sprawdzenie uprawnień (własność zasobu)
    // operacja przez repo
  }
}
```

- Konstruktor przyjmuje **wyłącznie interfejsy** repozytoriów (nigdy konkretne klasy Prisma)
- Use case nie wie o istnieniu Prisma, Next.js, HTTP
- Autoryzacja na poziomie zasobu ("czy to mój kurs") żyje tutaj, nie w Route Handlerze
- Plik: `src/application/use-cases/{domain}/{Name}UseCase.ts`
