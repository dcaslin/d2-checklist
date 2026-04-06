# CLAUDE.md

## Project overview

d2-checklist is the Angular front end for [d2checklist.com](https://www.d2checklist.com), a Destiny 2 companion app. It uses Angular 19, Angular Material, and the Bungie API.

## Build and run

```bash
npm install          # install dependencies
npm start            # serves on https://localhost:4200
npm run build        # development build
npm run build:prod   # production build
npm run lint         # eslint
```

## IMPORTANT NOTES

ALWAYS bump the version in package.json for each new PR. If the bungie manifest version changes, also bump package.json's "manifest" value. These two values are used to bust caches on browser clients, if not bumped the clients won't see the new values.

## Project structure

- `src/app/` - Angular application source
  - `service/` - Core services (bungie.service, parse.service, gear.service, etc.)
  - `shared/` - Reusable standalone components, pipes, and utilities
  - `player/`, `clan/`, `gear/`, `friends/`, `history/`, `vendors/`, `pgcr/` - Feature directories
  - `app.routes.ts` - All routes and route guards
  - `main.ts` - Bootstrap entry point (`bootstrapApplication`)
- `src/environments/` - Environment configs; `keys.ts` (gitignored) holds Bungie API credentials
- `src/assets/` - Static assets (manifest JSON generated at build time by `tools/manifest/`, plus godroll and fallback data)
- `.github/workflows/` - CI/CD (deploy.yml, beta-deploy.yml)

## Key patterns

- Standalone component architecture (no NgModules) — each component imports its own dependencies
- Many components extend `ChildComponent` for shared state (delegates to `AppStateService`)
- Services use `providedIn: 'root'`; route guards provided in `main.ts` bootstrap
- `parse.service.ts` (~1700 lines) orchestrates Bungie API response parsing, delegating to domain-specific parsers

## FontAwesome Pro

FontAwesome Pro icon packages are vendored as tarballs in `vendor-packages/` so no private registry auth is needed. The free FA packages are installed normally from npm. All FA packages should be kept at the same major version.

## Console logging

`console.log` calls are intentional. The user base is technical and uses browser console output to self-debug. Do not remove, gate, or lint against `console.log` / `console.warn` / `console.error` calls.

## Deployment

Production deploys are triggered by pushes to `master` via GitHub Actions. Bump `version` in `package.json` with each release to force the service worker to pick up changes.
