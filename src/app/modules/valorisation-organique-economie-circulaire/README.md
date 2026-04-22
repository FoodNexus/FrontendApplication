# Valorisation organique & économie circulaire

Module Angular NutriFlow : espace **recycleur**, catalogue **produits recyclables** (local / admin), et mécaniques de **crédits** liées aux opérations validées par l’administrateur.

---

## Rapport d’activité (changelog)

Les entrées ci-dessous documentent les évolutions notables. **À chaque nouvelle opération** sur ce module, ajouter une ligne dans la section correspondante (date ISO + courte description + fichiers ou routes touchés si utile).

### 2026-04-21

| # | Sujet | Détail |
|---|--------|--------|
| 1 | **Crédits recycleur + validation admin** | Flux : le recycleur déclare une opération « terminée » → statut `pending_verification` → l’admin approuve (`verified` + **+1 crédit**, idempotent par id de demande) ou rejette (`verification_rejected` + message). Données persistées en `localStorage` (`gestion-receveur-requests`, `nutriflow-recycler-credits`) jusqu’à branchement API. |
| 2 | **Fichiers & services ajoutés ou étendus** | `recycler-operations.storage.ts` (types + load/save des demandes), `services/recycler-credits.service.ts`, `components/admin-recycler-verification/` (page admin), `AuthService.getCreditsUserKey()` (clé stable `id:<idUser>` ou `sub:<keycloak>`). |
| 3 | **Routes & navigation** | `/user/admin/recycler-verification` (rôle ADMIN). Lien depuis le dashboard admin (« Valider opérations recycleurs »). Barre NutriFlow recycleur : badge crédits + raccourci admin si `ADMIN`. |
| 4 | **Interface recycleur** | `recycler-requests.component.ts` : métrique « Mes crédits », colonne vérification, historique des crédits, filtrage des demandes par recycleur, bouton « Declare done (admin review) » au lieu d’un « done » immédiat. |
| 5 | **Suppression du tableau de bord recycleur dédié** | Retrait de la route composant `DashboardLayoutComponent` sous `/user/recycler/dashboard` et des liens « Statistiques » / « Tableau de Bord ». **Redirection** : `/user/recycler/dashboard` → `/user/recycler`. Le composant `dashboard-layout` reste utilisé **côté admin** (stats embarquées produits recyclables). |
| 6 | **Documentation donateur Keycloak** | Section **Compte donateur (rôle DONOR)** : realm `foodnexus`, rôle **`DONOR`** ; création d’utilisateurs via inscription (realm export) ou console admin. |
| 7 | **Alignement Keycloak sur `main` + reset volume** | `init-keycloak.ts` repris depuis **`origin/main`** (URL **`http://localhost:8080`**). Scripts Spring : issuer/JWKS en **8080**. |
| 8 | **Realm Keycloak d’équipe (export complet)** | Fichier racine **`keycloak-realm-foodnexus.json`** (copie de l’export admin Keycloak). `docker-compose` monte ce fichier vers `/opt/keycloak/data/import/`. Ancien **`keycloak-init.json`** retiré. **Après mise à jour :** `docker compose down`, `docker volume rm …_keycloak_data`, `docker compose up -d mysql keycloak`. Realm **`foodnexus`**, client SPA **`foodnexus-app`** (inchangé dans `init-keycloak.ts`). Rôles realm exportés : **ADMIN, RECEIVER, DONOR, RECYCLER, AUDITOR, TRANSPORTER**. L’export ne contient qu’un utilisateur technique (**service-account-foodnexus-admin**) ; les comptes humains se créent par **inscription** (`registrationAllowed: true`) ou via la console admin. |
| 9 | **401 profil / donateur & écran recycleur** | **`AuthService`** : `updateToken(30)` avant `/me` ; **ne plus** mettre `isBlocked` sur **401** (évite tableau de bord masqué) ; `isBlocked` seulement si `actif === false` après succès ou **403** ; reset `isBlocked` / `currentUser` sur login & logout. **`docker-compose`** : `KC_HOSTNAME` + `KC_HOSTNAME_STRICT` pour issuer JWT stable. **Dashboard** : lien explicite « NutriFlow (crédits) » vs « Produits recyclables (catalogue admin) ». |
| 10 | **Keycloak « already authenticated as different user »** | **`logout(redirectUri)`** et **`login({ redirectUri })`** vers `/user/home`. Méthode **`forceKeycloakServerLogout()`** + lien accueil. |
| 11 | **401 JWT ms_gestionUser / « re-authenticate »** | **`JwtDecoder`** explicite (`NimbusJwtDecoder.withJwkSetUri`) dans **ms_gestionUser** et **ms_audit** : validation par clés JWKS **sans** `issuer-uri` stricte (évite `iss` ≠ URL Spring). Retrait de **`prompt: 'login'`** sur login/register Angular (boucles Keycloak). **Redémarrer** les microservices après changement. |
| 12 | **401 persistant /me** | Validateur JWT limité à **`JwtTimestampValidator`** via `setJwtValidator(DelegatingOAuth2TokenValidator)` (pas de contrôle `iss`). **OPTIONS /** en **permitAll**. Angular : **`updateToken` en `.catch(() => false)`** ; message d’erreur 401 plus explicite sur la page d’accueil. |

### Travaux connexes (hors dossier de ce module, mais liés au même lot produit)

Ces points ont été traités dans le dépôt au même titre ; les garder ici pour contexte produit / intégration.

| Date | Sujet | Détail |
|------|--------|--------|
| 2026-04-21 | **Profil utilisateur après Keycloak** | Message d’erreur plus explicite sur `/user/home` si `GET /api/users/me` échoue (ms_gestionUser `http://localhost:8087`, CORS, 401/403). Fichier : `gestion-user/components/home/home.component.ts`. |
| 2026-04-21 | **Utilisateur test donateur Keycloak** | Historique : ancien `keycloak-init.json` avec compte `donateur`. Remplacé par l’**export realm équipe** (`keycloak-realm-foodnexus.json`) : créer un utilisateur **DONOR** via inscription ou admin (voir section ci-dessous). |
| 2026-04-21 | **Git** | `git fetch origin main` + `git merge origin/main` (branche déjà à jour à ce moment). |

### Idées notées (non implémentées dans le code)

- **Offres / paliers** : remises sur « plan » (ex. -50 %) après seuil de crédits ; intégration paiement (ex. Stripe) — discussion produit seulement.
- **Production** : remplacer la persistance `localStorage` par des endpoints microservices (même modèle métier : soumission, approbation, ledger).

---

## Structure utile du module

| Élément | Rôle |
|---------|------|
| `nutriflow-recycler-shell.component.ts` | Layout + nav recycleur (crédits, liens). |
| `recycler-requests.component.ts` | Demandes de recyclage + déclaration pour validation + historique crédits. |
| `recyclables-crud.component.ts` | CRUD catalogue (stockage local partagé avec la clé `gestion-receveur-recyclables`). |
| `dashboard-layout.component.ts` | Graphiques / stats (réutilisé par les écrans admin produits recyclables, pas par la route recycleur supprimée). |
| `valorisation-organique-economie-circulaire-routing.module.ts` | Enfants sous `/user/recycler` : `''`, `requests`, redirect `dashboard` → `''`. |
| `recycler-operations.storage.ts` | Contrat des statuts de demande + persistance partagée avec l’admin. |
| `services/recycler-credits.service.ts` | Solde, ledger, attribution idempotente. |

---

## Comment ajouter une entrée au rapport (convention)

À chaque PR / changement sur ce module, ajouter une ligne sous **2026-04-21** (ou créer un sous-titre `### YYYY-MM-DD`) :

```markdown
| n | **Titre court** | Fichiers : `…` — Comportement : … |
```

Ou en liste :

```markdown
- **YYYY-MM-DD** — Description. Routes / fichiers : …
```

---

## Compte donateur (rôle `DONOR`)

Le **rôle realm** s’appelle **`DONOR`** (aligné sur `RoleType` côté **ms_gestionUser**). Le realm d’équipe est dans **`keycloak-realm-foodnexus.json`** (roles **DONOR**, **RECYCLER**, etc.).

### Importer / mettre à jour le realm

Keycloak n’importe les fichiers du dossier `import` **qu’au premier démarrage** d’un volume vide (comportement usuel). Après un changement de fichier realm :

```powershell
docker compose down
docker volume rm frontendapplication-main_keycloak_data
docker compose up -d mysql keycloak
```

(Remplace le nom du volume par celui affiché par `docker volume ls` si différent.)

### Créer un utilisateur donateur

L’export ne contient **pas** de comptes humains prêts à l’emploi (hors service account). Deux approches :

1. **Inscription** depuis l’UI Keycloak / flux app si activé, puis dans la console admin : **Role mapping** → assigner **`DONOR`**.
2. **Console admin** (sans réinitialiser tout le realm) : ouvre **`http://localhost:8080/admin`** (ou **8180** selon le compose), connecte-toi (**`admin` / `admin`** en dev), realm **`foodnexus`**. Le rôle **`DONOR`** est déjà dans l’export ; crée un utilisateur (**Users** → mot de passe, **Role mapping** → **`DONOR`**).

### Côté application après connexion

1. **ms_gestionUser** doit tourner (**`http://localhost:8087`**) pour que **`/api/users/me`** crée ou charge l’utilisateur avec le rôle dérivé du JWT (dont **`DONOR`**).
2. Le dashboard NutriFlow affiche la carte **donneur** lorsque le profil en base a le rôle **`DONOR`** (`AuthService` lit le rôle depuis le profil API, pas seulement depuis Keycloak).

### Fichier realm dans le dépôt

| Fichier | Rôle |
|---------|------|
| `keycloak-realm-foodnexus.json` | Export complet realm **`foodnexus`** (clients **`foodnexus-app`**, **`foodnexus-admin`**, flows, rôles, etc.). |

---

## Prérequis locaux (rappel)

- **Keycloak** + **MySQL** (souvent via `docker compose` à la racine du dépôt).
- **ms_gestionUser** sur **8087** pour le profil applicatif (`/api/users/me`), indépendamment des crédits recycleur actuellement en local.
