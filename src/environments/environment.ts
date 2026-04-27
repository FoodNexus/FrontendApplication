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
  nutriflowHubBaseUrl: 'http://localhost:8095',
  /** Service inférence ONNX (nutriflow-onnx-api). Laisser vide pour désactiver les appels. */
  nutriflowInferenceUrl: 'http://localhost:8096',
  /**
   * Dev local : crédits fidélité initiaux par utilisateur Keycloak (preferred_username → nombre de +1).
   * Mettre à null en prod via environment.prod.
   */
  nutriflowDevSeedCreditsByUsername: { recycler: 5, recycler1: 5 } as Record<string, number>
};
