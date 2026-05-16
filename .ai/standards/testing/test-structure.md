# Test Structure

```
tests/unit/        — use case i encje; zero Prisma, zero HTTP
tests/integration/ — API przez HTTP na działającej aplikacji (port 3000)
tests/e2e/         — Playwright, pełny user flow przez przeglądarkę
```

**Reguła klasyfikacji:**
- Test importuje Prisma lub używa `fetch` do API → należy do `integration/`
- Test testuje use case z in-memory stubami → należy do `unit/`
- Test steruje przeglądarką → należy do `e2e/`

Plik: `tests/{type}/{domain}.test.ts` (nie `spec.ts` dla unit/integration)
