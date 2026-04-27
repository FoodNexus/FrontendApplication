export const APP_CONFIG = {
  // Base URLs for microservices
  // Defaulting to 8080 (ms-receveur) but can be switched to 8060 (API Gateway)
  RECEVEUR_API: 'http://localhost:8080/api/receveur',

  // Scénario 1: Le Match "Tomates Fraîches" simulation flag
  ENABLE_REALTIME_ALERTS: true,
  REFRESH_INTERVAL_MS: 30000,

  // User context
  DEFAULT_USER_ID: 1
};
