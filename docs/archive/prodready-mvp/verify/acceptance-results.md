# Acceptance Test Results

Generated: 2026-05-02
Test Framework: Playwright (Chromium)

## Summary

| Status | Count |
|--------|-------|
| ✓ Passed | 18 |
| ✗ Failed | 0 |
| ⊘ Skipped | 0 |
| **Total** | **18** |

## Test Traceability

| User Story | Feature File | E2E Test | Result |
|------------|--------------|----------|--------|
| US-001 | auth.feature | auth.spec.ts | ✓ Pass |
| US-002 | auth.feature | auth.spec.ts | ✓ Pass |
| US-003 | admin.feature | admin.spec.ts | ✓ Pass |
| US-004 | admin.feature | admin.spec.ts | ✓ Pass |
| US-005 | admin.feature | admin.spec.ts | ✓ Pass |
| US-006 | enrollment.feature | enrollment.spec.ts | ✓ Pass |
| US-007 | enrollment.feature | enrollment.spec.ts | ✓ Pass |
| US-008 | enrollment.feature | enrollment.spec.ts | ✓ Pass |
| US-009 | enrollment.feature | enrollment.spec.ts | ✓ Pass |
| US-010 | grades.feature | grades.spec.ts | ✓ Pass |
| US-011 | grades.feature | grades.spec.ts | ✓ Pass |
| US-012 | grades.feature | grades.spec.ts | ✓ Pass |
| US-013 | admin.feature | admin.spec.ts | ✓ Pass |

## Test Details

### auth.spec.ts (6 tests)

- ✓ should redirect unauthenticated user to login (664ms)
- ✓ should login student and redirect to student dashboard (1.3s)
- ✓ should login lecturer and redirect to lecturer dashboard (1.3s)
- ✓ should login admin and redirect to admin dashboard (1.2s)
- ✓ should show error for wrong password without revealing which field is wrong (1.4s)
- ✓ should logout and clear session (2.8s)

### enrollment.spec.ts (4 tests)

- ✓ should show available courses with enrollment status badges (1.7s)
- ✓ should enroll in a course and show ENROLLED status (3.5s)
- ✓ should show my courses page with enrolled courses (2.5s)
- ✓ should show my grades page (2.5s)

### grades.spec.ts (3 tests)

- ✓ lecturer should see their courses list (2.1s)
- ✓ lecturer courses page should load and show course list or empty state (2.8s)
- ✓ student grades page should show grades or empty state (2.5s)

### admin.spec.ts (5 tests)

- ✓ admin courses page should load with course table (2.7s)
- ✓ admin should be able to open create course dialog (2.3s)
- ✓ admin should be able to create a new course (3.9s)
- ✓ admin users page should load with user table (3.1s)
- ✓ student cannot access admin pages (3.0s)

## Failures

None.

## Result

**All acceptance tests passed: ✓ (18/18)**
