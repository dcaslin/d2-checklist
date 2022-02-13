import { bungieProd } from './keys-prod';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json');
export const environment = {
  bungie:  bungieProd,
  production: true,
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
