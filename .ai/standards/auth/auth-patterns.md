# Auth Patterns

## JWT Cookie

Token podpisywany przez `jose` (HS256), przechowywany w HTTP-only cookie:

```ts
response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',  // HTTPS tylko na prod
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,  // 7 dni
  path: '/',
})
```

Payload zawiera pełny profil użytkownika — żeby middleware mógł wstrzyknąć headers bez query do DB:

```ts
interface JWTPayload {
  sub: string      // userId
  role: UserRole
  firstName: string
  lastName: string
  email: string
}
```

## Neutralny błąd logowania

I 'user not found' i 'wrong password' zwracają **identyczny** komunikat:

```ts
if (!user) throw new UnauthorizedError('Nieprawidłowy email lub hasło')
const valid = await comparePassword(password, user.passwordHash)
if (!valid) throw new UnauthorizedError('Nieprawidłowy email lub hasło')
```

Nigdy nie rozróżniaj która dana jest błędna — to ujawnia czy email istnieje w systemie.

## Hashowanie haseł

`bcryptjs` z `SALT_ROUNDS = 10`. Kolumna w DB: `passwordHash`.

```ts
// Przy tworzeniu użytkownika
const hash = await hashPassword(plainPassword)

// Przy logowaniu
const valid = await comparePassword(plainPassword, user.passwordHash)
```

Nigdy nie przechowuj plaintext password. Nigdy nie loguj wartości `passwordHash`.
