# d2-checklist

Front end for [d2checklist.com](https://www.d2checklist.com), built with Angular 14 and Angular Material.

## Getting set up

### Register a Bungie app

Create an application at the [Bungie Application Portal](https://www.bungie.net/en/Application):

* Application Name: whatever you want
* Application Status: Private
* OAuth Client type: `Confidential`
* Redirect URL: `https://localhost:4200/auth`
* Scope: check all boxes (except "Administrate groups and clans", which is optional)

### Install and run

1. Install Node.js and npm
2. Clone this repository
3. Copy `src/environments/keys.example.ts` to `src/environments/keys.ts` and fill in your Bungie API credentials
4. `npm install` (this also sets up git LFS automatically)
5. `npm start`
6. Visit https://localhost:4200 (ignore the self-signed cert warning)

## Contributing

Pull requests welcome. FontAwesome Pro icon packages are vendored as tarballs in `vendor-packages/` — no private registry auth needed.

## Notes

- Local development uses included self-signed certs on https://localhost:4200
- Production deployments via GitHub Actions on push to master
- NPM (not Yarn) is the package manager
- JSON files in `src/assets/` are tracked with git LFS
- Bump `version` in `package.json` with each release to force the service worker to pick up changes