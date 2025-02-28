import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideAuth } from 'angular-auth-oidc-client';

import { routes } from './sidenav/sitenav-routing.module';
import { authConfig } from './config/configuration';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), provideAnimationsAsync(), 

    provideHttpClient(),
    provideAuth(authConfig)
  ]
};

