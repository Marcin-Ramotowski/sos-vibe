# Authorization

Rola pochodzi z nagłówka `x-user-role` ustawionego przez middleware — nigdy z zapytania do DB.

```ts
const userRole = request.headers.get('x-user-role') as UserRole
if (userRole !== 'ADMIN') throw new ForbiddenError()
```

- Role check jest pierwszą instrukcją po odczycie headers — przed parsowaniem body
- Nieautoryzowana rola = `throw new ForbiddenError()`, nie `return NextResponse`
  (błąd i tak trafi do `handleApiError` w catch)
- Role check weryfikuje czy rola jest w ogóle dopuszczona do endpointu;
  własność zasobu (np. "czy to mój kurs") weryfikuje use case, nie handler
- `userId` = `request.headers.get('x-user-id')!` — przekazywany do use case, który używa go do filtrowania

Publiczne endpointy (whitelist w middleware): `/api/auth/login`, `/api/auth/logout`, `/api/health` —
nie sprawdzają roli.
