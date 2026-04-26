import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

// Keycloak désactivé pour le développement
// import { APP_INITIALIZER } from '@angular/core';
// import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
// import { initializeKeycloak } from './init-keycloak';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // KeycloakService,
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initializeKeycloak,
    //   multi: true,
    //   deps: [KeycloakService]
    // },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: KeycloakBearerInterceptor,
    //   multi: true
    // }
  ]
};