# Remove Dead Code and Crust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unused components, dead exports, and abandoned scripts from the CSSI QA Hub codebase without breaking any production functionality.

**Architecture:** This is a pure removal task — no new code is written, only dead code is deleted and unused imports are cleaned up. Each removal is verified independently with tests and type-checking.

**Tech Stack:** TypeScript, Next.js 16, Vitest, shadcn/ui

## Global Constraints

- **No breaking changes**: All production functionality must continue to work after cleanup
- **Type safety**: `bun run typecheck` must pass with zero errors after each task
- **Test coverage**: All existing tests must continue to pass (`bun run test -- lib/`)
- **No partial removals**: If a component is removed, all imports of it must be cleaned up in the same commit
- **Atomic commits**: Each logical removal is its own commit with a descriptive message

---

### Task 1: Remove Unused DropdownMenu Component

**Files:**
- Delete: `components/ui/dropdown-menu.tsx` (272 lines)

**Interfaces:**
- Consumes: None (this component has zero imports anywhere in the codebase)
- Produces: Nothing (no other code depends on this component)

**Verification before start:**
```bash
grep -rn "dropdown-menu" components/ app/ lib/ services/ constants/ hooks/ --include="*.tsx" --include="*.ts" | grep -v "dropdown-menu.tsx"
```
Expected output: (empty — no imports found)

- [ ] **Step 1: Verify no imports exist**

Run:
```bash
grep -rn "from.*@/components/ui/dropdown-menu" /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Expected: No output (zero matches)

- [ ] **Step 2: Delete the file**

Run:
```bash
rm /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub/components/ui/dropdown-menu.tsx
```

- [ ] **Step 3: Verify typecheck still passes**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run typecheck
```
Expected: `✓ No errors found` or similar success message

- [ ] **Step 4: Verify tests still pass**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run test -- lib/
```
Expected: All 15 test files pass, 61 tests pass

- [ ] **Step 5: Commit**

```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub
git add -A
git commit -m "chore: remove unused DropdownMenu component (272 lines)"
```

---

### Task 2: Remove Unused isSupabaseAdminConfigured Export

**Files:**
- Modify: `lib/env.server.ts:14-16` (remove the function)

**Interfaces:**
- Consumes: `serverEnv` (must remain exported)
- Produces: Nothing (this function is never called outside its own file)

**Verification before start:**
```bash
grep -rn "isSupabaseAdminConfigured" /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "env.server.ts"
```
Expected: No output (only self-reference in env.server.ts)

- [ ] **Step 1: Verify no external imports**

Run:
```bash
grep -rn "isSupabaseAdminConfigured" /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Expected output:
```
lib/env.server.ts:14:export function isSupabaseAdminConfigured() {
```
(Only the definition itself, no usage)

- [ ] **Step 2: Remove the function**

Edit `lib/env.server.ts` to remove lines 14-16. The file should become:

```typescript
import "server-only"

function readServerSecret() {
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  return secret && secret.length > 0 ? secret : null
}

export const serverEnv = {
  supabaseSecretKey: readServerSecret(),
}
```

- [ ] **Step 3: Verify typecheck still passes**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run typecheck
```
Expected: `✓ No errors found`

- [ ] **Step 4: Verify tests still pass**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run test -- lib/
```
Expected: All 15 test files pass, 61 tests pass

- [ ] **Step 5: Commit**

```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub
git add lib/env.server.ts
git commit -m "chore: remove unused isSupabaseAdminConfigured export"
```

---

### Task 3: Remove Abandoned SQL Migration Scripts

**Files:**
- Delete: `scripts/reset-phase3-plan-verification.sql` (108 bytes)
- Delete: `scripts/reset-phase4-run-verification.sql` (106 bytes)
- Delete: `scripts/reset-phase5-execution-verification.sql` (802 bytes)
- Delete: `scripts/seed-phase3-plan-reference.sql` (844 bytes)

**Interfaces:**
- Consumes: None (these scripts are not imported or referenced anywhere)
- Produces: Nothing (no other code depends on these scripts)

**Verification before start:**
```bash
grep -rn "reset-phase\|seed-phase3" /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub --include="*.tsx" --include="*.ts" --include="*.json" --include="*.md" --include="*.sh" | grep -v node_modules | grep -v "scripts/"
```
Expected: No output (no references outside the scripts directory)

- [ ] **Step 1: Verify no references exist**

Run:
```bash
grep -rn "reset-phase\|seed-phase3" /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub --include="*.tsx" --include="*.ts" --include="*.json" --include="*.md" --include="*.sh" | grep -v node_modules
```
Expected: No output (or only references within the scripts/ directory itself)

- [ ] **Step 2: Delete all four SQL files**

Run:
```bash
rm /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub/scripts/reset-phase3-plan-verification.sql
rm /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub/scripts/reset-phase4-run-verification.sql
rm /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub/scripts/reset-phase5-execution-verification.sql
rm /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub/scripts/seed-phase3-plan-reference.sql
```

- [ ] **Step 3: Verify typecheck still passes**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run typecheck
```
Expected: `✓ No errors found`

- [ ] **Step 4: Verify tests still pass**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run test -- lib/
```
Expected: All 15 test files pass, 61 tests pass

- [ ] **Step 5: Commit**

```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub
git add -A
git commit -m "chore: remove abandoned SQL verification scripts (4 files, ~1KB)"
```

---

### Task 4: Final Verification and Push

**Files:** None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Clean working tree, all tests passing

- [ ] **Step 1: Verify working tree is clean**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && git status
```
Expected: `nothing to commit, working tree clean`

- [ ] **Step 2: Run full typecheck**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run typecheck
```
Expected: Zero errors

- [ ] **Step 3: Run all tests**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run test -- lib/
```
Expected: 15 test files passed, 61 tests passed

- [ ] **Step 4: Verify build succeeds**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && bun run build
```
Expected: `✓ Ready for production` or similar success message

- [ ] **Step 5: Push to remote**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && git push origin master
```
Expected: Successful push with 3 new commits

- [ ] **Step 6: Show summary**

Run:
```bash
cd /home/kiyaya/kiyadev/kbvs/kbvs-front/cssi-qa-hub && git log --oneline -5 && echo "---" && git diff HEAD~3 --stat
```

Expected output:
```
[commit hash] chore: remove abandoned SQL verification scripts
[commit hash] chore: remove unused isSupabaseAdminConfigured export
[commit hash] chore: remove unused DropdownMenu component
...
 components/ui/dropdown-menu.tsx         | 272 -------------
 lib/env.server.ts                       |   3 -
 scripts/reset-phase3-plan-verification.sql |  13 --
 scripts/reset-phase4-run-verification.sql  |  13 --
 scripts/reset-phase5-execution-verification.sql |  34 --
 scripts/seed-phase3-plan-reference.sql     |  29 --
 6 files changed, 364 deletions(-)
```
