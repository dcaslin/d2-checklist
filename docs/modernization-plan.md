# d2-checklist Modernization Plan

Tracking document for incremental improvements to the d2-checklist codebase. Work is ordered by priority and dependency — later phases build on earlier ones.

**Current state (as of 2026-04-04):**
- Angular 18.2.14, TypeScript 5.4.5, RxJS 7.8.2
- 185 unit tests across 6 spec files, 7 of 7 TypeScript strict flags enabled, `strictTemplates` enabled, `no-explicit-any` warning
- `parse.service.ts` split into 6 files (was 4,385 lines)
- Bundle size budgets enforced (warn 3.1 MB, error 3.5 MB)
- CI modernized: rsync deploys, Node 22.x, npm audit, bundle size reporting
- Git LFS replaced with build-time Bungie manifest fetch (`tools/manifest/`), InventoryItem sharded into 8 parallel loads

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

- [x] Verify Karma/Jasmine config works — installed test dependencies, created `test.ts`, fixed sass include paths
- [x] Add unit tests for `parse-utils.ts` — 51 tests covering all pure utility functions
- [x] Add unit tests for `gear-parser.service.ts` — 24 tests for static methods (cookDamageType, isDamageTypeEnergy, getPlugName)
- [x] Add unit tests for `history-parser.service.ts` — 13 tests for mergeAggHistory2
- [x] Add a CI step to run tests on every push/PR (`ci.yml` for PRs, test step in deploy workflows)
- [x] Add unit tests for `auth.service.ts` — 34 tests for static methods (cookToken, isValid, isValidRefresh, randomString, parseError)
- [x] Add unit tests for `bungie.service.ts` — 38 tests for parsePlatform, getActivityModes, parseBungieResponse
- [x] Add unit tests for `parse.service.ts` — 25 tests for static delegation methods and calculateMaxLight
- [x] Set a coverage floor and enforce in CI — global thresholds: 10% statements, 7% branches, 12% functions, 10% lines (current: ~13/10/15/13%)

**Done.** Critical services have 185 tests running in CI with a coverage gate.

---

## Phase 3: Break Up parse.service.ts

Split the 4,385-line monolith into domain-specific parsers.

- [x] Identify logical domains within `parse.service.ts` (gear, triumphs, milestones, history/stats)
- [x] Extract each domain into its own service/class:
  - `gear-parser.service.ts` (1008 lines) — inventory item parsing
  - `triumph-parser.service.ts` (666 lines) — triumphs, seals, badges, collectibles, quests
  - `milestone-parser.service.ts` (696 lines) — milestones, activities, modifiers
  - `history-parser.service.ts` (236 lines) — aggregated history stats
- [x] Keep `parse.service.ts` as a facade that delegates to the new parsers (1729 lines)
- [x] Move shared parsing utilities into `parse-utils.ts` (268 lines)
- [x] Verify existing functionality still works (manual smoke test)

**Done.** `parse.service.ts` retains ~1700 lines as the player-parsing orchestrator — further splitting would require breaking up the 640-line `parsePlayer` method.

---

## Phase 4: Bundle Budgets

Prevent bundle bloat.

- [x] Add bundle size budgets to `angular.json`:
  - Initial bundle: warn at 2.75 MB, error at 3.25 MB (current: 2.64 MB)
  - Any component style: keep existing 6 KB warning
  - Note: no vendor chunk budget needed — `vendorChunk: false` in prod config

> **Note:** `console.log` calls are intentional — the user base is technical and uses console output for self-debugging. Do not remove or gate them.

**Done.** Budgets enforced in production builds.

---

## Phase 5: CI/CD Hardening

Bring the pipeline up to date and add safety checks.

- [x] Update `actions/checkout` to v4 in all workflows
- [x] Update `actions/setup-node` to v4 with built-in npm cache
- [x] Replace `scp-action` with rsync deploys (single SSH connection, no UFW spam)
- [x] Add `workflow_dispatch` trigger for manual deploys
- [x] Add `npm audit --audit-level=moderate` step
- [x] Upgrade Node from 18.x to 22.x
- [x] Add unit test step (from Phase 2)
- [x] Add bundle size reporting step (from Phase 4)
- [x] Replace git LFS with build-time manifest fetch (`tools/manifest/`)
- [x] Add GitHub Actions cache for manifest data

**Done.** All workflows run tests, fetch manifest, and report bundle sizes.

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
- [x] Upgrade RxJS from 6.6 to 7.8 (toPromise → firstValueFrom, 17 call sites)
- [x] Upgrade TypeScript 4.8 → 5.4
- [x] Upgrade Angular Material to match each Angular version (including legacy → MDC migration)
- [x] Update FontAwesome angular-fontawesome 0.11 → 0.15, angular-eslint 14 → 18

### 7b: Angular version hops
Angular migrations must go one major version at a time:
- [x] Angular 14 → 15 (`ng update @angular/core@15 @angular/cli@15`)
- [x] Angular 15 → 16 (`ng update @angular/core@16 @angular/cli@16`)
- [x] Angular 16 → 17 (`ng update @angular/core@17 @angular/cli@17`)
- [x] Angular 17 → 18 (`ng update @angular/core@18 @angular/cli@18`)

### 7c: Post-migration modernization
- [ ] Migrate key components to standalone (remove NgModule boilerplate)
- [ ] Replace `ChildComponent` base class with `DestroyRef` + `takeUntilDestroyed`
- [ ] Adopt Angular signals where beneficial
- [ ] Evaluate esbuild-based builder (`@angular-devkit/build-angular:application`)

**Done (7a+7b).** Running on Angular 18.2.14. Post-migration modernization (7c) is optional follow-up work.

---

## Execution Order

1. ~~Phase 5: CI/CD Hardening~~ — Done
2. ~~Phase 6: Standardize Service Providers~~ — Done
3. ~~Phase 1: TypeScript Strictness~~ — Done
4. ~~Phase 3: Break Up parse.service.ts~~ — Done
5. ~~Phase 2: Unit Tests~~ — Done
6. ~~Phase 4: Bundle Budgets~~ — Done
7. ~~Phase 7: Angular 18 Migration~~ — Done (14 → 18, post-migration 7c is optional follow-up)

## Notes

- Each phase should be its own PR (or set of PRs for large phases).
- Phase 3 before Phase 2 is intentional: testing a 4,385-line monolith is painful and the tests would need rewriting after the split anyway.
