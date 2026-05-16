# Route Handler Structure

Każdy Route Handler ma identyczny szkielet:

```ts
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    // 1. role check (throw ForbiddenError jeśli niedozwolona rola)
    // 2. parse params / body
    // 3. new ConcreteRepo(), new UseCase(repo)
    // 4. await useCase.execute(...)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
```

- Handler nie zawiera logiki biznesowej — tylko: walidacja wejścia + wywołanie use case + mapowanie odpowiedzi
- Repos i use case są tworzone przez `new` bezpośrednio w handlerze (brak kontenera DI)
- Każdy catch blok kończy się `return handleApiError(error)` — bez wyjątków
- Nie ma return poza blokiem try (handler zawsze wraca z try lub catch)
- Import `UserRole` z `@/domain/entities/user.entity`, nie z Prisma
