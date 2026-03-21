# d2-checklist Modernization Plan

Tracking document for incremental improvements to the d2-checklist codebase. Work is ordered by priority and dependency — later phases build on earlier ones.

**Current state (as of 2026-03-20):**
- Angular 14.2.12, TypeScript 4.8.4, RxJS 6.6.6
- Zero test coverage, TypeScript strict mode disabled
- `parse.service.ts` is 4,385 lines
- No bundle size budgets, 154 stray console.log calls
- CI actions outdated, no `npm audit` in pipeline

---

## Phase 1: TypeScript Strictness

Enable strict type checking incrementally to catch bugs at compile time instead of production.

- [ ] Enable `strictNullChecks` in `tsconfig.json`, fix resulting errors
- [ ] Enable `noImplicitAny`, fix resulting errors
- [ ] Enable `noImplicitReturns` and `noFallthroughCasesInSwitch`
- [ ] Enable `strictTemplates` in `angularCompilerOptions`
- [ ] Turn on ESLint rule `@typescript-eslint/no-explicit-any` as a warning
- [ ] Enable remaining `strict` flags (`strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`)

**Done when:** `"strict": true` in tsconfig.json and `strictTemplates: true` in angular compiler options.

---

## Phase 2: Unit Tests for Critical Services

Add test infrastructure and cover the highest-risk code paths.

- [ ] Verify Karma/Jasmine config works (or switch to Jest if preferred)
- [ ] Add unit tests for `auth.service.ts`
- [ ] Add unit tests for `bungie.service.ts` (mock HTTP calls)
- [ ] Add unit tests for `parse.service.ts` — focus on public methods with complex logic
- [ ] Add unit tests for `gear.service.ts`
- [ ] Add a CI step to run tests on every push/PR
- [ ] Set a coverage floor (e.g., 30% for critical services) and enforce in CI

**Done when:** Critical services have tests running in CI with a coverage gate.

---

## Phase 3: Break Up parse.service.ts

Split the 4,385-line monolith into domain-specific parsers.

- [ ] Identify logical domains within `parse.service.ts` (gear, triumphs, milestones, perks/buffs, stats, vendors, etc.)
- [ ] Extract each domain into its own service/class (e.g., `gear-parser.service.ts`, `triumph-parser.service.ts`)
- [ ] Keep `parse.service.ts` as a thin facade that delegates to the new parsers
- [ ] Move shared parsing utilities into a `parse-utils.ts` helper
- [ ] Ensure no file exceeds ~800 lines
- [ ] Verify existing functionality still works (manual smoke test + any new unit tests)

**Done when:** `parse.service.ts` is under 500 lines and each extracted parser has its own file and tests.

---

## Phase 4: Bundle Budgets & Console Cleanup

Prevent bundle bloat and clean up debug noise.

- [ ] Add bundle size budgets to `angular.json`:
  - Initial bundle: warn at 1.5 MB, error at 2 MB
  - Vendor chunk: warn at 500 KB, error at 750 KB
  - Any component style: keep existing 6 KB limit
- [ ] Remove or gate all 154 `console.log` / `console.warn` calls behind an `environment.production` check
- [ ] Consider adding a `LogService` wrapper or an ESLint rule (`no-console`) to prevent new stray logs

**Done when:** Budgets are enforced in production builds and `console.log` count is zero outside of a logging service.

---

## Phase 5: CI/CD Hardening

Bring the pipeline up to date and add safety checks.

- [ ] Update `actions/checkout` from v2 to v4 in all workflows
- [ ] Update `actions/cache` to v4 in all workflows (currently v3 in deploy, v1 in beta)
- [ ] Add `npm audit --audit-level=moderate` step before build
- [ ] Add unit test step (from Phase 2)
- [ ] Add bundle size reporting step (compare against budgets from Phase 4)
- [ ] Standardize Node version across workflows (currently 18.x — consider 20.x)

**Done when:** Both deploy.yml and beta-deploy.yml use current action versions, run tests, and audit dependencies.

---

## Phase 6: Standardize Service Providers

Eliminate the mixed `providedIn: 'root'` vs `app.module.ts` providers pattern.

- [ ] Audit all services — list which use `providedIn: 'root'` vs module providers
- [ ] Migrate all services to `providedIn: 'root'` (modern Angular standard)
- [ ] Remove corresponding entries from `app.module.ts` providers array
- [ ] Verify tree-shaking works correctly (unused services excluded from bundle)

**Done when:** All services use `providedIn: 'root'` and `app.module.ts` providers array contains only non-service tokens.

---

## Phase 7: Angular 18+ Migration

The biggest effort. Phases 1–6 reduce risk and make this migration smoother.

### 7a: Pre-migration prep
- [ ] Upgrade RxJS from 6.6 to 7.x (required for Angular 16+)
- [ ] Upgrade TypeScript to 5.x
- [ ] Upgrade Angular Material to match each Angular version
- [ ] Update `bungie-api-ts` and other dependencies to latest compatible versions

### 7b: Angular version hops
Angular migrations must go one major version at a time:
- [ ] Angular 14 → 15 (`ng update @angular/core@15 @angular/cli@15`)
- [ ] Angular 15 → 16 (`ng update @angular/core@16 @angular/cli@16`)
- [ ] Angular 16 → 17 (`ng update @angular/core@17 @angular/cli@17`)
- [ ] Angular 17 → 18 (`ng update @angular/core@18 @angular/cli@18`)

### 7c: Post-migration modernization
- [ ] Migrate key components to standalone (remove NgModule boilerplate)
- [ ] Replace `ChildComponent` base class with `DestroyRef` + `takeUntilDestroyed`
- [ ] Adopt Angular signals where beneficial
- [ ] Evaluate esbuild-based builder (`@angular-devkit/build-angular:application`)

**Done when:** Running on Angular 18+ with standalone components for new code.

---

## Notes

- Each phase should be its own PR (or set of PRs for large phases).
- Phases 1–5 are independent of each other and can be worked in parallel.
- Phase 6 is low risk and can happen anytime.
- Phase 7 depends on Phases 1–2 for safety, and benefits from Phase 3 for reduced merge conflicts.
