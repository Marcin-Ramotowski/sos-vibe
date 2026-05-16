# Decimal Fields

Prisma zwraca pola `@db.Decimal` jako obiekt `Decimal`, nie `number`.
Zawsze konwertuj przez `Number()` przy mapowaniu do typu domenowego.

```ts
// ✗ błąd — g.value to Decimal, nie number
return { value: g.value }

// ✓ poprawnie
return { value: Number(g.value) }
```

Dotyczy: `Grade.value` (`@db.Decimal(3,1)`). Jeśli dodajesz nowe pole `Decimal` —
zawsze mapuj przez `Number()`.
