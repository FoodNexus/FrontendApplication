import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
import { initializeKeycloak } from './init-keycloak';
import { routes } from './app.routes';
import { NutriflowHubSyncService } from './modules/valorisation-organique-economie-circulaire/angular/services/nutriflow-hub-sync.service';

/** Instancie le service une fois au démarrage pour activer pull/push si `environment.nutriflowHubBaseUrl` est défini. */
function initNutriflowHubSync(_sync: NutriflowHubSyncService): () => Promise<void> {
  return () => Promise.resolve();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initNutriflowHubSync,
      multi: true,
      deps: [NutriflowHubSyncService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true
    }
  ]
};