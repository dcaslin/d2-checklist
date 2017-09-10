// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

const packageJson = require('../../package.json');

export const environment = {
  bungie: {
    apiKey: "c0e2cdba952945ec8a988fcfcf47441e",
    authUrl: "https://www.bungie.net/en/OAuth/Authorize",
    clientId: "21055",
    clientSecret: "niRAEaUutpPWxkBOoFhAbf2XRAY587B7sC.N7rat3yI"
  },
  production: false,
  versions: {
    app: packageJson.version,
    angular: packageJson.dependencies['@angular/core'],
    ngrx: packageJson.dependencies['@ngrx/store'],
    material: packageJson.dependencies['@angular/material'],
    bootstrap: packageJson.dependencies.bootstrap,
    rxjs: packageJson.dependencies.rxjs,
    angularCli: packageJson.devDependencies['@angular/cli']
  }
};
