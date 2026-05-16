# Validation

Walidacja body przez `.safeParse()`, nie `.parse()`. Błąd walidacji zwraca status 422 z listą
wszystkich issue (nie tylko pierwszego).

```ts
// Schemat: src/presentation/api/schemas/<domain>.schema.ts
const parsed = schema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message: 'Dane wejściowe są niepoprawne',
      errors: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    },
    { status: 422 },
  )
}
```

- Schematy żyją w `src/presentation/api/schemas/`, jeden plik per domena (course.schema.ts etc.)
- Eksportują typ przez `z.infer<typeof schema>`
- Błąd walidacji NIE przechodzi przez `handleApiError` — jest zwracany inline przed blokiem try
- `status: 422` (Unprocessable Entity), nie 400

> **Uwaga:** Aktualny kod zwraca tylko `issues[0]?.message`. Przy najbliższej okazji zmienić na powyższy format.
