import { bungieProd } from './keys';

const packageJson = require('../../package.json');
export const environment = {
  bungie:  {
    apiKey: process.env.API_KEY,
    authUrl: 'https://www.bungie.net/en/OAuth/Authorize',
    clientId: '21084',
    clientSecret: process.env.CLIENT_SECRET
  },
  production: true,
  versions: {
    app: packageJson.version,
    angular: packageJson.dependencies['@angular/core'],
    material: packageJson.dependencies['@angular/material'],
    bootstrap: packageJson.dependencies.bootstrap,
    rxjs: packageJson.dependencies.rxjs,
    angularCli: packageJson.devDependencies['@angular/cli']
  }
};