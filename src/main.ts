import { enableProdMode } from '@angular/core';

import { environment } from './environments/environment';
import { LoggedInGuard } from './app/guards/logged-in.guard';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AppComponent } from './app/app.component';
import { appRoutes, ManifestLoadedGuard, MyInfoGuard } from './app/app.routes';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(appRoutes),
        provideServiceWorker('ngsw-worker.js', { enabled: environment.production }),
        LoggedInGuard,
        ManifestLoadedGuard,
        MyInfoGuard,
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations()
    ]
});
