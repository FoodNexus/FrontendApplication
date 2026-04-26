import { KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8180',
        realm: 'foodnexus',
        clientId: 'foodnexus-app'
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html'
      },
      // Habilite la capture du bearer token pour les appels API
      enableBearerInterceptor: true,
      bearerExcludedUrls: ['/assets', '/clients/public'],
    });
}
