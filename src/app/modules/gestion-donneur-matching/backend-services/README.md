# Backend donneur / matching

Le module Angular **`gestion-donneur-matching`** (`/donneur/lots`, produits, matching, OCR, etc.) appelle l’API configurée dans `src/environments/environment.ts` (`matchingApiBaseUrl`, par défaut **`http://localhost:8082`**).

## Microservice

| Dépôt | Port |
|--------|------|
| [FoodNexus/ms_gestionDonneur-Matching](https://github.com/FoodNexus/ms_gestionDonneur-Matching) | **8082** (`server.port` dans `application.properties`) |

Ce dossier est un **sous-module Git** : après clone du front, exécutez à la racine du dépôt :

```bash
git submodule update --init --recursive
```

### Démarrage rapide (recommandé, racine du dépôt front)

1. **MySQL** (mot de passe root `root`, bases créées par Hibernate) :  
   `.\scripts\docker-mysql-up.ps1`  
   (ajout du service `mysql` dans le `docker-compose.yml` à la racine.)
2. **Matching** (port **8082**, profil `local` : mot de passe MySQL + pas d’Eureka) :  
   `.\scripts\run-ms-gestionDonneur-Matching.ps1`
3. **Profil Angular / lots** : `ms_gestionUser` sur **8087** (voir `.\scripts\run-ms-gestionUser.ps1`) + Keycloak sur **8080** (`docker compose up -d keycloak`).

Le fichier `application-local.properties` dans le sous-module active le profil **`local`** (mot de passe `root` pour Docker, `register-with-eureka=false`).

Sans les scripts : dans `ms_gestionDonneur-Matching`,  
`$env:SPRING_PROFILES_ACTIVE='local'; .\mvnw.cmd spring-boot:run`

Le front autorise déjà **CORS** pour `http://localhost:4200` côté matching.
