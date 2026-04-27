# Guide d'Intégration et Scénarios NutriFlow

Ce document détaille l'intégration des utilisateurs et les scénarios multi-services au sein du frontend NutriFlow.

## 1. Intégration Utilisateur (Authentification)

L'authentification est centralisée via **Keycloak**. 

### Configuration Technique
- **Serveur** : `http://localhost:8180`
- **Realm** : `foodnexus`
- **Client ID** : `foodnexus-app`
- **Librairie** : `keycloak-angular`

### Fonctionnement dans le code
1. **Initialisation** : Le service est initialisé au démarrage via `APP_INITIALIZER` dans `app.config.ts` en appelant `initializeKeycloak()`.
2. **Propagation du Token** : L'intercepteur `KeycloakBearerInterceptor` ajoute automatiquement le JWT Token (`Authorization: Bearer <token>`) à tous les appels HTTP vers les microservices.
3. **Récupération du contexte** : Pour identifier l'utilisateur (Receveur ou Donneur), on extrait le `subject` (UUID) ou le `preferred_username` depuis le token Keycloak.

---

## 2. Scénarios d'Intégration Inter-Services

### Scénario 1 : Le Match Parfait (Matchmaking Service)
- **Acteurs** : Receveur + Donneur + IA Matcher.
- **Flux** :
    1. Un **Receveur** publie un `Besoin` (ex: 50kg de Tomates).
    2. Un **Donneur** publie une `Offre` correspondante.
    3. Le **Matcher Service** détecte la correspondance et envoie un événement via Kafka/RabbitMQ.
    4. Le microservice Receveur crée une `Alerte`.
    5. Le Frontend (via `NotificationBellComponent`) rafraîchit les alertes et affiche une notification premium au receveur.

### Scénario 2 : Validation de Capacité Logistique
- **Acteurs** : Receveur + Service Logistique.
- **Flux** :
    1. Lors de l'acceptation d'un don, le frontend appelle `canReceiveDon(userId, quantite, besoinFrigo)`.
    2. Le service vérifie le `Stockage` actuel du receveur.
    3. Si la capacité est dépassée, un message d'erreur premium est affiché avant toute validation transactionnelle.

---

## 3. Mode Simulation (Développement)

Puisque les services ne sont pas toujours lancés simultanément en local, nous utilisons un **Mode Simulation** configuré dans `app.constants.ts` :

- `ENABLE_REALTIME_ALERTS: true` : Simule l'arrivée continue de nouvelles alertes.
- `DEFAULT_USER_ID: 1` : Utilise un utilisateur statique pour tester les CRUD sans Keycloak complet.

---

## 4. Étapes Suivantes

1. **Re-activation de Keycloak** : Décommenter les providers dans `app.config.ts`.
2. **Implémentation des Guards** : Créer un `AuthGuard` pour protéger les routes `/receveur/*`.
3. **Simulation de push notification** : Créer un endpoint de test pour injecter des alertes "Match" en base de données.
