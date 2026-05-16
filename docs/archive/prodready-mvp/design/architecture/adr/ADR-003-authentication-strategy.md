# ADR-003: Authentication Strategy

## Status
Accepted

## Date
2026-05-02

## Context
System SOS wymaga uwierzytelniania email/hasło z RBAC (3 role). Sesja musi być weryfikowalna na każdym Route Handler. Projekt hobbystyczny, brak wymagań SSO/OAuth. Bezpieczeństwo: odporność na XSS, CSRF.

## Decision
Używamy **JWT w HTTP-only cookie**, weryfikowanego przez Next.js middleware.

- **Generowanie tokena**: `jose` library (Web Crypto API, zero Node.js-specific deps)
- **Payload**: `{ sub: userId, role: UserRole, iat, exp }`
- **Cookie**: `HttpOnly=true; Secure=true; SameSite=Lax; Path=/; Max-Age=86400`
- **Weryfikacja**: Next.js `middleware.ts` — każdy request do `/api/*` przechodzi przez weryfikację JWT przed dotarciem do Route Handler
- **RBAC**: Middleware dekoduje token, dodaje `x-user-id` i `x-user-role` do request headers; Route Handler czyta nagłówki (zero kolejnego query DB)

```
Request → middleware.ts (weryfikuj JWT, dodaj headers) → Route Handler (czyta role z headers) → Use Case
```

- **Wylogowanie**: Usunięcie cookie po stronie serwera (`Set-Cookie: token=; Max-Age=0`)

## Consequences

### Positive
- HTTP-only cookie = niewidoczny dla JavaScript → odporność na XSS
- SameSite=Lax chroni przed CSRF dla standardowych formularzy
- Bezstanowy backend — brak session store, prosta skalowalność
- Rola w JWT = zero query DB przy każdym requeście dla RBAC

### Negative
- Token nie może być unieważniony przed wygaśnięciem (24h window). **Mitigacja**: Krótki TTL (24h) akceptowalny dla projektu edukacyjnego; w produkcji: token blacklist w Redis
- Zmiana roli użytkownika wymaga ponownego logowania (nowy token z nową rolą)

### Risks
- **Ryzyko**: Niezabezpieczony endpoint bez middleware. **Mitigacja**: Next.js middleware z konfiguracją `matcher` — ALL `/api/*` routes wymagają weryfikacji, whitelist tylko dla `/api/auth/login`

## Alternatives Considered
1. **JWT w localStorage**: Odrzucone — podatny na XSS; każdy script na stronie może ukraść token
2. **Sesja serwerowa (Redis/DB)**: Odrzucone — wymaga session store (dodatkowy kontener/usługa); więcej złożoności dla solo deva; JWT jest wystarczający dla MVP
3. **NextAuth.js v5**: Odrzucone — over-engineering dla prostego email/hasło bez OAuth; dodaje abstrakcje które utrudniają czysty RBAC
