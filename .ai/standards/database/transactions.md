# Transactions

Dwa wzorce — używaj tego który pasuje do operacji:

## 1. Multi-step atomic operation

Używaj dla: upsert + audit log, delete + decrement, kilka powiązanych zmian.

```ts
await prisma.$transaction(async (tx) => {
  const existing = await tx.grade.findUnique({ where: { enrollmentId } })
  const grade = await tx.grade.upsert({ ... })
  await tx.gradeAuditLog.create({ ... })  // powiązana zmiana w tej samej tx
  return grade
})
```

## 2. Atomic conditional UPDATE ($executeRaw)

Używaj TYLKO dla: operacji których nie można wyrazić przez Prisma ORM (atomowy increment z warunkiem).

```ts
await prisma.$transaction(async (tx) => {
  const result = await tx.$executeRaw`
    UPDATE courses
    SET "enrolledCount" = "enrolledCount" + 1
    WHERE id = ${courseId} AND "enrolledCount" < capacity
  `
  if (result === 0) throw new CourseFullError()
  await tx.enrollment.create({ data: { studentId, courseId } })
})
```

- `$executeRaw` poza tym wzorcem — NIGDY
- Błąd P2002 (duplicate key) po transakcji = `AlreadyEnrolledError` (race condition)
- Nie używaj `prisma.$transaction([op1, op2])` (batch API) — tylko formę async callback
