# Naming Conventions & Imports

## Import aliases

Zawsze używaj aliasów, nigdy ścieżek względnych (`../../`):

```ts
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import prisma from '@/infrastructure/database/prisma'
import { handleApiError } from '@/presentation/api/error-handler'
```

Dostępne aliasy (tsconfig.json):
- `@/*` → `src/*`
- `@/domain/*`, `@/application/*`, `@/infrastructure/*`, `@/presentation/*`

## import type

Importy tylko-typów używają `import type`:

```ts
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { Course } from '@/domain/entities/course.entity'
import { NotFoundError } from '@/domain/errors'  // wartość (klasa), nie type
```

## Nazewnictwo plików

| Warstwa | Wzorzec | Przykład |
|---------|---------|----------|
| Encja domenowa | `{entity}.entity.ts` | `course.entity.ts` |
| Repo-interfejs | `I{Entity}Repository.ts` | `ICourseRepository.ts` |
| Repo-implementacja | `Prisma{Entity}Repository.ts` | `PrismaCourseRepository.ts` |
| Use case | `{Action}{Entity}UseCase.ts` | `EnrollStudentUseCase.ts` |
| Zod schema | `{domain}.schema.ts` | `course.schema.ts` |
| Test | `{domain}.test.ts` | `enrollment.test.ts` |

Klasy i interfejsy: PascalCase. Pliki domenowe: kebab-case. Pliki klas (repo, use case): PascalCase.
