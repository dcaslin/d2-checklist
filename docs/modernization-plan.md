# d2-checklist Modernization Plan

Tracking document for incremental improvements to the d2-checklist codebase. Work is ordered by priority and dependency — later phases build on earlier ones.

**Current state (as of 2026-03-21):**
- Angular 14.2.12, TypeScript 4.8.4, RxJS 6.6.6
- Zero test coverage, 7 of 7 TypeScript strict flags enabled, `strictTemplates` enabled, `no-explicit-any` warning
- `parse.service.ts` is 4,385 lines
- No bundle size budgets
- CI modernized: rsync deploys, Node 20.x, npm audit

---

## Phase 1: TypeScript Strictness

Enable strict type checking incrementally to catch bugs at compile time instead of production.

- [x] Enable `noImplicitAny`, fix resulting errors
- [x] Enable `noImplicitReturns` and `noFallthroughCasesInSwitch`
- [x] Enable `strictBindCallApply` and `strictFunctionTypes`
- [x] Enable `strictNullChecks` in `tsconfig.json`, fix resulting errors (~632 errors across 60+ files)
- [x] Enable `strictPropertyInitialization`, fix resulting errors (~211 errors across 47 files)
- [x] Enable `strictTemplates` in `angularCompilerOptions` (~212 errors across 56 template files)
- [x] Turn on ESLint rule `@typescript-eslint/no-explicit-any` as a warning (446 warnings for gradual cleanup)

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

## Phase 4: Bundle Budgets

Prevent bundle bloat.

- [ ] Add bundle size budgets to `angular.json`:
  - Initial bundle: warn at 1.5 MB, error at 2 MB
  - Vendor chunk: warn at 500 KB, error at 750 KB
  - Any component style: keep existing 6 KB limit

> **Note:** `console.log` calls are intentional — the user base is technical and uses console output for self-debugging. Do not remove or gate them.

**Done when:** Budgets are enforced in production builds.

---

## Phase 5: CI/CD Hardening

Bring the pipeline up to date and add safety checks.

- [x] Update `actions/checkout` to v4 in all workflows
- [x] Update `actions/setup-node` to v4 with built-in npm cache
- [x] Replace `scp-action` with rsync deploys (single SSH connection, no UFW spam)
- [x] Add `workflow_dispatch` trigger for manual deploys
- [x] Add `npm audit --audit-level=moderate` step
- [x] Upgrade Node from 18.x to 20.x
- [ ] Add unit test step (from Phase 2)
- [ ] Add bundle size reporting step (from Phase 4)

**Done when:** Both deploy.yml and beta-deploy.yml run tests and report bundle sizes.

---

## Phase 6: Standardize Service Providers

Eliminate the mixed `providedIn: 'root'` vs `app.module.ts` providers pattern.

- [x] Audit all services — list which use `providedIn: 'root'` vs module providers
- [x] Migrate all 9 legacy services to `providedIn: 'root'`
- [x] Remove corresponding entries from `app.module.ts` providers array
- [x] Verify tree-shaking works correctly (build compiles cleanly)

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

## Execution Order

1. ~~Phase 5: CI/CD Hardening~~ — Done
2. ~~Phase 6: Standardize Service Providers~~ — Done
3. ~~Phase 1: TypeScript Strictness~~ — Done
4. **Phase 3: Break Up parse.service.ts** — Next. Easier to split before adding tests.
5. **Phase 2: Unit Tests** — After the split, each parser file is small enough to test meaningfully.
6. **Phase 4: Bundle Budgets** — Low risk, can slot in anytime.
7. **Phase 7: Angular 18 Migration** — Last. Benefits from all prior phases.

## Notes

- Each phase should be its own PR (or set of PRs for large phases).
- Phase 3 before Phase 2 is intentional: testing a 4,385-line monolith is painful and the tests would need rewriting after the split anyway.
