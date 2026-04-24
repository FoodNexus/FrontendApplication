export const environment = {
  production: false,
  keycloakUrl: 'http://localhost:8080',
  keycloakRealm: 'foodnexus',
  keycloakClientId: 'foodnexus-app',
  apiUserUrl: 'http://localhost:8087',
  apiDonneurUrl: 'http://localhost:8082',
  apiAuditUrl: 'http://localhost:8083',
  apiReceveurUrl: 'http://localhost:8084',
  /** Hub NutriFlow (optionnel) : synchro lots / demandes / crédits entre navigateurs. Laisser vide pour désactiver. */
  nutriflowHubBaseUrl: 'http://localhost:8095'
};
