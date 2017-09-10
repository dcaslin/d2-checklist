const packageJson = require('../../package.json');

export const environment = {
  bungie: {
    apiKey: "a313d9ebfcd741688d76ab8e9549f322",
    authUrl: "https://www.bungie.net/en/OAuth/Authorize",
    clientId: "21084",
    clientSecret: "VfL62EnXGVQK3mYJadHW4Dhi-2i7jamZGm7oEPjDWVo"
  },
  production: true,
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
