# Response Format

## Sukces

Surowe dane — bez koperty `{ success: true }`:

```ts
// Jeden obiekt
return NextResponse.json(entity)                      // 200
return NextResponse.json(entity, { status: 201 })     // Create

// Lista
return NextResponse.json({ data: [...], pagination: { page, limit, total, totalPages } })
```

## Błąd

```ts
// Domain errors — przez handleApiError()
{ code: 'FORBIDDEN', message: '...' }      // 403
{ code: 'NOT_FOUND', message: '...' }      // 404
{ code: 'COURSE_FULL', message: '...' }   // 409

// Validation — inline
{ code: 'VALIDATION_ERROR', message: '...', errors: [...] }  // 422
```

## Paginacja

```ts
const { page, limit } = parsePagination(request.nextUrl.searchParams)
// domyślnie: page=1, limit=20, max limit=100
```

Odpowiedź list zawsze zawiera:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

> **Uwaga:** Aktualna konwencja (brak koperty) może się zmienić. Nie dodawaj koperty na własną rękę — zmiana musi być globalna.
