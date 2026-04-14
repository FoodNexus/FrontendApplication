import { KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8080',
        realm: 'foodnexus',
        clientId: 'foodnexus-app'  // Remplacez par votre client ID
      },
      initOptions: {
        onLoad: 'login-required',  // Plus de check-sso, plus besoin du fichier HTML
        checkLoginIframe: false,
        pkceMethod: 'S256'
      },
      enableBearerInterceptor: true,
      bearerPrefix: 'Bearer',
      bearerExcludedUrls: ['/assets']
    });
}