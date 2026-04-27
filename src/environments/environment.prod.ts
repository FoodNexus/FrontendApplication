export const environment = {
  production: true,
  keycloakUrl: 'http://localhost:8080',
  keycloakRealm: 'foodnexus',
  keycloakClientId: 'foodnexus-app',
  apiUserUrl: 'http://localhost:8087',
  apiDonneurUrl: 'http://localhost:8082',
  apiAuditUrl: 'http://localhost:8083',
  apiReceveurUrl: 'http://localhost:8084',
  nutriflowHubBaseUrl: '',
  /** Définir l’URL du service ONNX en prod (ou laisser vide si indisponible). */
  nutriflowInferenceUrl: '',
  nutriflowDevSeedCreditsByUsername: null
};
