import { bungieDev } from './keys';

const packageJson = require('../../package.json');

export const environment = {
  bungie: bungieDev,
  production: false,
  versions: {
    app: packageJson.version,
    manifest: packageJson.manifest,
    angular: packageJson.dependencies['@angular/core'],
    material: packageJson.dependencies['@angular/material'],
    bootstrap: packageJson.dependencies.bootstrap,
    rxjs: packageJson.dependencies.rxjs,
    angularCli: packageJson.devDependencies['@angular/cli']
  }
};
