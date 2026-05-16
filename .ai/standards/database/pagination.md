# Paginated Queries

Każde zapytanie zwracające listę używa `Promise.all` dla równoległego pobrania danych i liczby:

```ts
const { page, limit } = params
const skip = (page - 1) * limit

const [items, total] = await Promise.all([
  prisma.entity.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    // include / select ...
  }),
  prisma.entity.count({ where }),  // ten sam where co findMany
])

return {
  data: items.map(mapEntity),
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
}
```

- Nigdy dwa osobne `await` (sekwencyjne) — tylko `Promise.all`
- `where` musi być identyczny w `findMany` i `count`
- `orderBy` zawsze obecny (deterministyczna kolejność): `createdAt: 'desc'` lub `enrolledAt: 'asc'`
- Relacje ładowane przez `include` lub `select` (nigdy dodatkowe zapytanie w pętli)
