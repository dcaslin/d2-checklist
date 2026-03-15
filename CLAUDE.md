# CLAUDE.md

## Project overview

d2-checklist is the Angular front end for [d2checklist.com](https://www.d2checklist.com), a Destiny 2 companion app. It uses Angular 14, Angular Material, and the Bungie API.

## Build and run

```bash
npm install          # also runs `git lfs install` via prepare script
npm start            # serves on https://localhost:4200
npm run build        # development build
npm run build:prod   # production build
npm run lint         # eslint
```

## Project structure

- `src/app/` - Angular application source
  - `service/` - Core services (bungie.service, parse.service, gear.service, etc.)
  - `shared/` - Shared module with reusable components, pipes, and utilities
  - `player/`, `clan/`, `gear/`, `friends/`, `history/`, `vendors/`, `pgcr/` - Feature modules
  - `app-routing.module.ts` - All routes
  - `app.module.ts` - Root module declarations and providers
- `src/environments/` - Environment configs; `keys.ts` (gitignored) holds Bungie API credentials
- `src/assets/` - Static assets (JSON files tracked via git LFS)
- `.github/workflows/` - CI/CD (deploy.yml, beta-deploy.yml)

## Key patterns

- Module-based Angular architecture (not standalone components)
- Many components extend `ChildComponent` (abstract base) for shared state/lifecycle
- Services are provided in `app.module.ts`, not `providedIn: 'root'`
- `SharedModule` re-exports Angular Material modules and common components
- `parse.service.ts` is the largest file (~4k lines) - handles Bungie API response parsing

## Git LFS

`src/assets/*.json` files are tracked with git LFS. The `prepare` script in package.json runs `git lfs install` automatically on `npm install`.

## Deployment

Production deploys are triggered by pushes to `master` via GitHub Actions. Bump `version` in `package.json` with each release to force the service worker to pick up changes.
