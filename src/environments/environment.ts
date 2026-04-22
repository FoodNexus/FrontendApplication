/**
 * Configuration front (dev par défaut).
 * `nutriflowHubBaseUrl` : URL du hub de sync NutriFlow (voir backend-services/nutriflow-hub-server).
 * Laisser vide pour n’utiliser que le stockage local navigateur (pas de partage entre comptes / machines).
 */
export const environment = {
  production: false,
  nutriflowHubBaseUrl: 'http://localhost:8095',
  /**
   * API Spring **ms_gestionDonneur-Matching** (sous-module Git :
   * `gestion-donneur-matching/backend-services/ms_gestionDonneur-Matching`, port 8082 par défaut).
   * Voir `gestion-donneur-matching/backend-services/README.md`.
   */
  matchingApiBaseUrl: 'http://localhost:8082'
};
