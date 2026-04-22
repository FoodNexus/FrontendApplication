import { KeycloakService } from 'keycloak-angular';

/** Doit être autorisé dans le client Keycloak `foodnexus-app` (redirect + post-logout). */
function keycloakAppRedirectUri(): string {
  return `${window.location.origin}/user/home`;
}

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
        pkceMethod: 'S256',
        // Évite redirect_uri = racine `/` seule : toujours revenir sur la page d’accueil auth.
        redirectUri: keycloakAppRedirectUri()
      },
      enableBearerInterceptor: true,
      bearerPrefix: 'Bearer',
      bearerExcludedUrls: ['/assets']
    });
}