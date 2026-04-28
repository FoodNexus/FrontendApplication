# Guide d'Intégration et Scénarios de Test (FoodNexus)

Ce document explique comment connecter votre Front-end Angular avec vos microservices Spring Boot et simuler des interactions réelles entre Donneur et Receveur.

---

## 🏗️ Phase 1 : Préparation de l'Écosystème
Avant de tester les scénarios, tous les "organes" de l'application doivent fonctionner ensemble.

1.  **Lancer Eureka Server** (Port 8761) : Il permet aux microservices de se trouver entre eux.
2.  **Lancer Keycloak** (Port 8180) : Pour que les deux services (`ms-receveur` et `ms-donneur`) puissent valider les mêmes jetons de sécurité.
3.  **Lancer les Microservices** :
    *   `ms-receveur` (Port 8080)
    *   `ms-donneur-matching` (Port 8082)
4.  **Vérification** : Ouvrez `http://localhost:8761`. Vous devez voir les deux services enregistrés.

---

## 🔗 Phase 2 : Communication Inter-Services
Pour que le Receveur puisse voir les dons des Donneurs :

1.  **Feign Client** : Dans `ms-receveur`, créez une interface pour appeler le service donneur.
    ```java
    @FeignClient(name = "ms-gestionDonneur-Matching")
    public interface DonneurClient {
        @GetMapping("/api/donations/available")
        List<DonationDTO> getAvailableDonations();
    }
    ```
2.  **CORS & Gateway** : Assurez-vous que votre Front-end Angular appelle vos services via l'**API Gateway** (Port 8060 par exemple) pour éviter les erreurs de sécurité de navigateur.

---

## 🎭 Phase 3 : Création des Scénarios de Test

### Scénario 1 : Le Match "Tomates Fraîches"
*Objectif : Vérifier que le receveur est alerté quand un produit qu'il cherche est publié.*

1.  **Côté Receveur (Angular)** : 
    *   Créez un "Besoin" de **50kg de Tomates** via l'interface IA.
2.  **Côté Donneur (Simulation)** : 
    *   Via Postman ou un endpoint de test, publiez un don : `POST /api/donations` avec `{ "produit": "Tomates", "quantite": 60 }`.
3.  **Le Matching** : 
    *   Le service `ms-receveur` doit comparer sa liste de besoins avec la liste des dons.
    *   **Résultat attendu** : Une notification apparaît sur le Dashboard Angular : *"Alerte : 50kg de Tomates disponibles à 2km !"*

### Scénario 2 : Réservation de Lot
*Objectif : S'assurer que lorsqu'un receveur accepte un don, la quantité est déduite chez le donneur.*

1.  **Action Front** : Cliquez sur "Réserver" dans la notification de matching.
2.  **Action Back** : Le `ms-receveur` envoie une requête `PUT` au `ms-donneur` pour marquer le don comme "Réservé".
3.  **Vérification** : Le don ne doit plus apparaître pour les autres receveurs.

---

## 🛠️ Outils Recommandés pour Tester
*   **Postman** : Pour simuler le Service Donneur si vous ne voulez pas lancer tout le projet.
*   **IntelliJ Services Tool** : Pour surveiller la consommation mémoire de vos 4-5 microservices tournant simultanément.
*   **H2 / MySQL Console** : Vérifiez que les IDs utilisateurs (`userId`) concordent bien entre les deux bases de données.
