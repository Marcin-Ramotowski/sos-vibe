# Domain Errors

Wszystkie błędy domenowe w jednym pliku:
`src/domain/errors/index.ts`

```ts
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) { ... }
}

export class CourseFullError extends DomainError {
  constructor() { super('COURSE_FULL', 'Brak wolnych miejsc') }
}
```

Mapa code → HTTP status w `handleApiError`:

| code | status |
|------|--------|
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| COURSE_FULL | 409 |
| ALREADY_ENROLLED | 409 |
| GRADE_EXISTS | 409 |
| VALIDATION_ERROR | 422 |

- Nowy błąd = nowy wpis w `errors/index.ts` + nowy case w `handleApiError`
- `code` to string maszynowy (SCREAMING_SNAKE_CASE), nigdy nie zmieniać po wdrożeniu
- Błędy domenowe rzucane z use casów (nie z routerów ani repo)
