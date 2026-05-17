# Verify Gate

> Mandatory checkpoint before any commit. All four commands must pass — in order.

## Commands

| Field | Command | Passes when |
|-------|---------|-------------|
| `verify.build` | `npm run build` | Exit code 0, zero TypeScript / Next.js compilation errors |
| `verify.lint` | `npm run lint && npx tsc --noEmit` | Zero ESLint errors, zero type errors |
| `verify.test` | `npm test` | All unit and integration tests green |
| `verify.diff` | `git diff main...HEAD --stat` | Agent review: only expected files changed, no debug artifacts |

## Agent Rules

- Run in order: **build → lint → test → diff**. If any fails — stop, fix, restart from the top.
- `verify.diff` is a **review step**, not a pass/fail command. After running it the agent must:
  1. Confirm only expected files are modified.
  2. Confirm no debug artifacts (`console.log`, `TODO`, hardcoded values) remain.
  3. Report the diff summary to the user before proposing a commit.
