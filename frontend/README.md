# Foodi — Application Web de Livraison de Repas à Agadir

Foodi est une plateforme web moderne conçue pour la commande et la livraison express de repas dans la ville d'Agadir (Talborjt, Dakhla, Founty, Bensergao, Marina, Al Massira).

## Stack Technique

- **Framework Frontend** : React 19, TypeScript
- **Bundler & Tooling** : Vite 6
- **Routage** : React Router DOM 7
- **Styling** : Tailwind CSS v4, Plus Jakarta Sans
- **Cartographie** : Leaflet, OpenStreetMap
- **Icônes** : Lucide React
- **Conteneurisation** : Docker, Docker Compose, Nginx

## Fonctionnalités Principales

- **Page d'Accueil Interactive** : Carrousel promotionnel des grandes enseignes (McDonald's, KFC, Pizza Hut), explorateur par spécialités culinaires et sélection des restaurants partenaires.
- **Recherche Globale Plein Écran** :
  - Historique des recherches récentes persisté en `localStorage`.
  - Suggestions en un clic et filtrage en temps réel par restaurant, cuisine, quartier et plat.
- **Catalogue & Menus Détaillés** :
  - Navigation par catégories avec barre latérale fluide.
  - Modale de personnalisation des plats (tailles, boissons, sauces, accompagnements).
- **Gestion du Panier** :
  - Panier latéral slide-over avec ajustement des quantités et calcul automatique des totaux et frais de livraison.
  - Badge dynamique d'articles en direct sur l'icône du panier.
- **Gestion d'Adresse Géolocalisée** :
  - Sélection précise sur carte interactive OpenStreetMap à Agadir avec repère personnalisé.
  - Assistant de saisie en deux étapes (type de bâtiment puis détails d'accès).
- **Espace Utilisateur & Commandes** :
  - Authentification rapide (SMS / Téléphone marocain ou Email).
  - Suivi en temps réel de l'état de préparation et de livraison des commandes.
  - Re-commande en 1 clic.

## Structure du Projet

```text
src/
├── components/          # Composants UI (Header, SearchOverlay, CartDrawer, DishModal...)
├── context/             # État global de l'application (Panier, Utilisateur, Adresse)
├── services/            # Services API REST connectés au backend Laravel & MySQL
├── pages/               # Pages de l'application (Accueil, Menus, Adresse, Auth, Suivi)
├── styles/              # Styles globaux et variables de thème
└── types/               # Définitions TypeScript
```

## Démarrage Rapide

### Option 1 : Avec Node.js

```bash
npm install
npm run dev
```

L'application est disponible sur : `http://localhost:3000`

### Option 2 : Avec Docker

```bash
docker compose up -d --build
```

L'application est servie par Nginx sur : `http://localhost:3000`

Pour arrêter le conteneur :

```bash
docker compose down
```

## Build de Production

```bash
npm run build
```
