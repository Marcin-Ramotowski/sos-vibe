# Workflow Guide

> Full workflow reference for AI agents. Read when starting an M or L task.
> Quick summary lives in `AGENTS.md` → "Workflow (Feedback Loop)".

## 1. Specification and plan before coding

- Enter plan mode for non-trivial tasks (3+ steps or architectural decisions); if the task is to make the Specification - you skip the plan mode and start writing the specification directly to the file in the `.ai/specs` (details how to name file etc below),
- if there's an existing and comprehensive specification file you can skip the plan mode and proceed to task creation (the next workflow phase),
- new features should follow the specification file created in the planning phase, this step could be skipped for small improvements (no architecture decisions, less than 3 steps) or bug fixes
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
- Save context - load only these specification file that is related to the current task at hand or required for it to finish

## 2. Strict Phase Progression (M/L tasks)

**HARD RULE: After completing any phase, propose ONLY the immediate next phase. NEVER skip phases or ask about a later phase.**

| # | Phase | What you do | What you say to the user after completing |
|---|-------|-------------|-------------------------------------------|
| 1 | **Spec** | Write/verify specification | Run `spec-reviewer` agent on the spec file. If PASS → "Spec verified as self-contained. Next step: task breakdown. Should I proceed?" If NEEDS WORK → follow the Spec Review Loop below. |
| 2 | **Tasks** | TaskCreate all steps + TaskUpdate dependencies | "Tasks created ([N] tasks). Next step: inject relevant standards. I propose injecting: [list]. Confirm?" |
| 3 | **Inject** | `/inject-standards` with confirmed paths | "Standards injected. Ready to start implementation. Should I begin with task #1: [name]?" |
| 4 | **Implement** | Code, one task at a time | Mark each task completed, move to next |
| 5 | **Verify** | `/verify-standards` automatically | Report results, fix if needed |
| 6 | **Build** | Run verify gate (`verify.build` → `verify.lint` → `verify.test` → `verify.diff`) | Report results |

**Spec Review Loop (when `spec-reviewer` returns NEEDS WORK):**

1. Present the gaps list to the user
2. Split gaps into two categories:
   - **Auto-fixable** — info exists in your conversation context but wasn't written to spec. Fix these yourself immediately.
   - **Needs user input** — unclear requirements or business decisions. Ask the user.
3. **Verify all URLs** listed in the reviewer's "URLs Requiring Verification" section — use WebFetch on each one. Remove or replace any that don't resolve. Ask the user for correct URLs if needed.
4. Update the spec file with all fixes
5. Re-run `spec-reviewer` on the updated spec
6. Repeat until PASS. Do NOT proceed to tasks until the spec passes review.

**Examples of WRONG behavior:**
- ❌ After spec: "Should I start implementing?" (skips tasks + inject)
- ❌ After tasks: "Let me start coding" (skips inject)

**Examples of CORRECT behavior:**
- ✅ After spec: "Spec is ready. Next step is task breakdown. Should I create tasks?"
- ✅ After tasks: "Tasks ready. Next step is standards injection. I propose injecting: [list]"
- ✅ After inject: "Standards loaded. Starting implementation with task #1: [name]"

## 3. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## 4. Self-improvement Loop

- After ANY correction from the user: update specification file or run `/sync-standards` if it's something more general
- Write rules for yourself that prevent the same mistake and suggest updates to `AGENTS.md`
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

## 5. Verification Before Done

- Suggest user to verify the task completeness by proving it works:
  - Diff behavior between main and your changes when relevant
  - Ask yourself: "Would a staff engineer approve this?"
  - Run tests, check logs, demonstrate correctness

## 6. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Follow the project's design principles and rules defined in `GUARDRAILS.md` and `.ai/standards/`

## 7. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Go fix failing CI tests without being told how

---

## Documentation and Specifications

Architecture Decision Records (ADRs) and feature specifications are maintained in the `.ai/specs/` folder. Save context size and load only the specs related to and required to finish the task at hand.

### Spec Files (Size L)

- **Naming convention**: `SPEC-{number}-{date}-{title}.md` (e.g., `SPEC-003-2026-01-23-notifications-module.md`)
- **Number**: Sequential identifier (001, 002, 003, etc.)
- **Date**: Creation date in ISO format (YYYY-MM-DD)
- Each spec documents the module's purpose, architecture, API contracts, data models, and implementation details.
- Specs should include a **Changelog** section at the bottom.

### Quick Specs (Size S)

Lightweight plan files in `.ai/specs/quick/`:

- **Naming convention**: `{NNN}-{slug}.md` (e.g., `001-add-dark-mode-toggle.md`)
- **Content**: Scope, what to change, where, and why — no formal sections required
- Quick specs are disposable — they document intent, not architecture

### When Developing Features

1. **Before coding**: Check if a spec exists for the module you're modifying. Search for `SPEC-*-{module-name}.md`.
2. **When adding features**: Update the corresponding spec with new functionality, API changes, data model updates, and a changelog entry.
3. **When creating new modules**: Use the `/create-spec` skill for interactive, guided spec creation.

### Spec Changelog Format

```markdown
## Changelog

### 2026-02-05
- Added email notification channel support

### 2026-01-10
- Initial specification
```

### Auto-generating Specs

Even when not explicitly asked, agents should generate or update specs when implementing significant changes. Keep specs synchronized with the actual implementation.

---

## Task Management

> **GATE CHECK**: If you just completed a spec and are about to ask "should I start implementation?" — STOP. Next step is **task creation**, not implementation.

### When to Create Tasks

**ALWAYS after completing or verifying the specification, BEFORE inject standards and implementation.**

Order: `spec ready → TaskCreate (all steps) → TaskUpdate (dependencies) → inject standards → implement`

### Task Rules

1. **Atomic steps**: Each task = one file or one logical change
2. **Dependencies**: Set `blockedBy` — e.g., registration in manager depends on creating the class
3. **Inject standards as task #1**: First task is always injecting standards (blocks the rest)
4. **Track Progress**: Mark `in_progress` before starting, `completed` after finishing
5. **Explain Changes**: High-level summary at each step
6. **Document Results**: Add review section to specification file
7. **Capture Lessons**: Update `.ai/lessons.md` after corrections
8. **Sync to spec**: After creating tasks, write an `## Implementation Checklist` section at the end of the spec file (before Changelog). Update checkboxes as tasks complete.

   ```markdown
   ## Implementation Checklist
   - [x] Inject standards
   - [x] Create DB migration
   - [ ] Create API routes    ← in progress
   - [ ] Create state slice
   ```

### After Completing Implementation

**When ALL implementation tasks have status `completed` — automatically run `/verify-standards`** without waiting for user command. Only after verify (and any fixes) inform the user about readiness to commit.

---

## Workflow (Feedback Loop)

Classification and flow:

```
S: inject → implement → verify → build
M: inject(propose) → plan(+analogies, +user-stories) → tasks → implement(+pattern-finder) → verify → build → sync-standards
L: discover → inject(propose) → spec(+analogies, +user-stories) → tasks → implement(+pattern-finder) → verify → build → sync-standards
```

### Standards Injection Protocol (M/L tasks)

**DO NOT explore codebase** to learn patterns. Standards ALREADY document them.

1. **Read the index** — `.ai/standards/index.yml`
2. **Match to task** — determine which standard domains are needed
3. **Propose to user** specific paths to inject, e.g.:

   > This task involves a new API endpoint and database write. I suggest injecting:
   > - `api/route-structure` — route export pattern, middleware, validation
   > - `api/error-handling` — error formats, logging
   > - `database/repository-pattern` — repo structure, SQL, naming
   >
   > Do you confirm?

4. **After confirmation** — run `/inject-standards` in explicit mode
5. **DO NOT use** auto-suggest mode for M/L — always propose specific standards

### Analogy Discovery (plan/spec phase)

Find an analogous module in the codebase before writing spec or plan.

1. **Propose an analogy to the user** based on task description and "Where to Look" in AGENTS.md
2. **After confirmation** — use `codebase-pattern-finder`:

   ```
   Task(subagent_type=codebase-pattern-finder):
     "Analyze the {analogous module} structure as a pattern for a new module.
      Show: what files exist, what layers (route → repo → store → UI),
      how they're connected. Search in directories listed in AGENTS.md."
   ```

3. **Write the result** into spec/plan as a "Reference Module" section

If you don't know which analogy fits — **ask the user**. DO NOT explore the entire repo.

### User Stories (plan/spec phase — M/L only)

After analogy discovery and before writing Architecture — **write user stories**. Detailed guidelines in `.ai/specs/AGENTS.md` → "User Stories Guidelines".

1. **Identify 2-3 personas** — primary user (happy path) + alternative user
2. **Walk through screen-by-screen** — what user sees (ASCII wireframe) + what happens in background
3. **Add "Change vs. current state"** at every step that modifies existing behavior
4. **Add comparison table** if the feature has variants or replaces existing behavior
5. **3rd story for edge cases** (L specs)

### Code Pattern Finder (implement phase)

When you need a concrete code example during implementation — use `codebase-pattern-finder`. DO NOT explore the entire repo.

```
Task(subagent_type=codebase-pattern-finder):
  "Find examples of a CRUD route with validation and auth middleware
   in this codebase. Search in the directories listed in AGENTS.md."
```

DO NOT use for naming conventions or response structure — those are in standards.

### Summary: 3 Tools Instead of Explore

| Phase | Tool | What it provides | Cost |
|-------|------|------------------|------|
| Before code | `/inject-standards` explicit | Rules and conventions | Low |
| Plan/Spec | `codebase-pattern-finder` (analogy) | Reference module structure | Medium |
| Implement | `codebase-pattern-finder` (example) | Concrete code snippet | Medium |
| Any phase | Context7 (`resolve-library-id` + `query-docs`) | External library docs — **ALWAYS use this, NEVER WebSearch** | Low |

**Explore on entire repo** → NO. Use ONLY for business specifics.
