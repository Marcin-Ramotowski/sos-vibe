# Feature Tracking

> Rules for maintaining `FEATURES.md` (project root) — the backlog and source of truth for what the product does.

## Feature Lifecycle

```
backlog → in-progress → implemented
```

- **backlog** — defined, not yet started
- **in-progress** — implementation has begun
- **implemented** — ALL Acceptance Criteria tests pass (confirmed via `verify.test`)

**A feature MUST NOT be marked `implemented` until every AC test passes.** Running `verify.test` and seeing green for those tests is the only valid proof.

## FEATURES.md Format

```markdown
## [FEAT-NNN] Title
**Status:** backlog
**Size:** S | M | L
**Added:** YYYY-MM-DD

### Description
What this feature does from the user's perspective.

### Scope
**In scope:** …
**Out of scope:** …

### Motivation
Why this feature is being built — business or technical driver.

### Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-NNN-1 | User can … | `tests/e2e/foo.spec.ts > "[AC-NNN-1] …"` |
| AC-NNN-2 | System rejects … when … | `tests/unit/bar.test.ts > "[AC-NNN-2] …"` |
```

- **FEAT-NNN** — three-digit sequential ID (001, 002, …)
- **Size** — S (< 3 steps, no arch decisions) · M (multiple layers, planned) · L (new module, full spec required)
- **AC-NNN-M** — AC item ID: feature number + item index (e.g. AC-001-1, AC-001-2)
- **Test column** — exact file path + test title; the title MUST start with `[AC-NNN-M]`

## AC → Test Mapping Convention

Each AC item maps to exactly one test. The `it()` / `test()` block title MUST begin with the AC ID:

```ts
it("[AC-001-1] student can enroll in a course with available seats", async () => { … })
```

To verify a specific AC item:

```bash
grep -r "AC-001-1" tests/
```

## Agent Rules

1. **When a new feature is requested** — add an entry to `FEATURES.md` with status `backlog` BEFORE writing any code.
2. **When implementation starts** — change status to `in-progress`.
3. **Write AC tests first** — before implementing logic, write failing tests whose titles start with AC IDs.
4. **Mark `implemented` only after** running `verify.test` and confirming all AC tests for that feature are green.
5. **Never mark implemented speculatively** — "the logic is there" is not sufficient; the test must pass.
