# Unit Test Stubs

Każdy plik testów jednostkowych definiuje funkcje fabrykujące stuby repozytoriów:

```ts
const makeEnrollmentRepo = (
  overrides: Partial<IEnrollmentRepository> = {}
): IEnrollmentRepository => ({
  findById: vi.fn(),
  findByStudentAndCourse: vi.fn(),
  enrollAtomic: vi.fn(),
  unenroll: vi.fn(),
  hasGrade: vi.fn(),
  ...overrides,
})

// Użycie w teście:
const repo = makeEnrollmentRepo({
  enrollAtomic: vi.fn().mockResolvedValue(mockEnrollment),
})
```

- Stub implementuje **pełny interfejs** (`Partial<I*Repository>` tylko dla overrideów)
- Funkcja per interfejs, definiowana na górze pliku (przed `describe`)
- Dane testowe jako `const mockXxx` — stałe obiekty również na górze pliku
- Zero importów Prisma w `tests/unit/`
