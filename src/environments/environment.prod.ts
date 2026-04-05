import { bungieProd } from './keys-prod';
import packageJson from '../../package.json';
export const environment = {
  bungie:  bungieProd,
  production: true,
  versions: {
    app: packageJson.version,
    manifest: packageJson.manifest,
    angular: packageJson.dependencies['@angular/core'],
    material: packageJson.dependencies['@angular/material'],
    rxjs: packageJson.dependencies.rxjs,
    angularCli: packageJson.devDependencies['@angular/cli']
  }
};
