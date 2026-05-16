# Integration Test Helpers

Każdy plik integracyjny definiuje helpery lokalnie (nie globalny setup):

```ts
async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/token=([^;]+)/)
  return match?.[1] ?? ''
}

async function authFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Cookie: `token=${token}`, 'Content-Type': 'application/json' },
  })
}
```

- `beforeAll` loguje się dla każdej roli i tworzy dane testowe przez API (nie bezpośrednio przez Prisma)
- `BASE_URL = 'http://localhost:3000'` jako stała na górze pliku
- Testy integracyjne wymagają działającej aplikacji + seedu (`npm run dev` lub `docker compose up`)
