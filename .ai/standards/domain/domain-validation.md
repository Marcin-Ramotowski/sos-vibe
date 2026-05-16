# Domain Validation

Reguły biznesowe kodowane jako czyste funkcje w pliku encji:

```ts
// src/domain/entities/grade.entity.ts
export const VALID_GRADES = [2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5] as const
export type GradeValue = (typeof VALID_GRADES)[number]

export function isValidGrade(value: number): value is GradeValue {
  return VALID_GRADES.includes(value as GradeValue)
}
```

Używane w use case:
```ts
if (!isValidGrade(input.value)) throw new ValidationError('...')
```

- Stałe domenowe (`VALID_GRADES`) jako `as const` — dają union type gratis
- Predykaty jako type guard (`value is GradeValue`) dla type safety
- Walidacja domenowa w encji, walidacja formatu wejścia w Zod schema (to dwie różne rzeczy)
