# ALTESS FASHION — Documentation du projet

## Aperçu
Site e-commerce professionnel pour la boutique de mode ALTESS FASHION.

## Stack technique
- **Frontend**: React 19 + Vite + React Router
- **Backend**: PHP natif (API REST)
- **Base de données**: MySQL
- **Langage**: JavaScript (React), PHP (backend)

## Structure du projet
```
ALTESS-FASHION/
├── backend/              # API PHP (copier dans htdocs/altess-fashion/backend)
│   ├── api.php           # Routeur API centralisé
│   ├── config/database.php
│   ├── middleware/auth.php
│   ├── models/           # User, Product, Category, Order, Cart
│   ├── api/              # Endpoints REST (répertoires)
│   │   ├── auth/index.php
│   │   ├── products/index.php
│   │   ├── categories/index.php
│   │   ├── orders/index.php
│   │   ├── users/index.php
│   │   ├── carts/index.php
│   │   ├── stats/index.php
│   │   └── upload/index.php
│   ├── api/index.php     # Wrapper charge index.php parent
│   ├── index.php         # Connexion PDO + getDB()
│   └── database.sql      # Schéma BDD
├── public/               # Fichiers statiques
│   └── uploads/          # Images produits
├── src/                  # Frontend React
│   ├── pages/            # Pages (Home, Shop, etc.)
│   ├── pages/admin/      # Pages admin
│   ├── components/       # Composants réutilisables
│   ├── layouts/          # Header, Footer, MainLayout
│   ├── context/          # AuthContext, CartContext
│   ├── services/         # Appels API
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilitaires
│   ├── styles.css        # Styles globaux
│   └── assets/           # Images produits/catégories
├── index.html
├── vite.config.js
├── package.json
├── AGENTS.md
└── DEPLOYMENT.md
```

## Configuration locale (XAMPP/WAMP)
1. Démarrer Apache + MySQL dans XAMPP
2. Copier `backend/` vers `C:/xampp/htdocs/altess-fashion/backend/`
3. Copier `public/uploads/` vers `C:/xampp/htdocs/altess-fashion/public/uploads/`
4. Importer `backend/database.sql` dans MySQL:
   ```bash
   C:/xampp/mysql/bin/mysql.exe -u root altess_fashion < backend/database.sql
   ```
5. Lancer `npm install && npm run dev` (frontend sur :5173, API proxy vers Apache)

## Architecture API
- **Dev**: Vite proxy `/api/*` → `http://localhost/altess-fashion/backend` (rewrite `/api/` → `/api.php/`)
- **Production**: Apache reçoit `/api.php/*`, `.htaccess` rewritе vers `api.php` routeur
- **Routeur**: `backend/api.php` analyse l'URL et inclut le bon contrôleur dans `backend/api/{name}/index.php`
- **Chaque contrôleur** fait `require_once __DIR__ . '/../../index.php'` (charge `backend/index.php` avec `getDB()`)

## API Endpoints
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register.php | Inscription |
| POST | /api/auth/login.php | Connexion |
| POST | /api/auth/logout.php | Déconnexion |
| GET | /api/auth/me.php | Utilisateur courant |
| GET | /api/products.php | Liste produits |
| GET | /api/products.php?id=X | Détail produit |
| POST | /api/products.php | Créer produit |
| PUT | /api/products.php?id=X | Modifier produit |
| DELETE | /api/products.php?id=X | Supprimer produit |
| GET | /api/categories.php | Liste catégories |
| POST | /api/categories.php | Créer catégorie |
| GET | /api/orders.php | Liste commandes |
| POST | /api/orders.php | Créer commande |
| PUT | /api/orders.php?id=X | Modifier statut |
| GET | /api/users.php | Liste utilisateurs |
| GET | /api/stats.php | Statistiques |
| POST | /api/upload.php | Upload image |

## Fallback
Aucune. Toutes les pages publiques et le back-office lisent la base via l'API.
Si l'API est injoignable, l'interface affiche un état d'erreur explicite
avec un bouton « Réessayer » — aucun jeu de données `SAMPLE` ne masque une panne.
Le timeout API est 5s.

## Modèle de données catalogue
- `products.category_id` pointe vers la **catégorie feuille** (ex. `Robes`).
- `products.subcategory_id` pointe vers la **catégorie racine/parent** (ex. `Vêtements`).
- `subcategory_id` est **toujours dérivé côté serveur** du `parent_id` de la
  catégorie choisie ; le formulaire ne l'envoie pas. Un produit ne peut donc pas
  se retrouver avec une catégorie et un parent incohérents.
- Le filtre `category_id` de l'API matche toute la branche : la catégorie, ses
  enfants et `subcategory_id`. Filtrer sur une racine renvoie ses sous-catégories.
- Les racines sont scopées par `target_audience` : un même nom peut exister en
  version `female`, `male` et `unisex`. La page d'accueil regroupe par nom et
  conserve la branche contenant le plus de produits. Le formulaire admin
  regroupe aussi les rayons par racine et suffixe le public cible.
- `is_active` est toujours forcé à `1` côté boutique ; seul le back-office voit
  les produits et catégories désactivés.
- Un produit référencé par une commande ne peut pas être supprimé (clé
  étrangère `order_items`) : l'API renvoie un 409 explicite invitant à le
  désactiver, jamais une erreur 500.

## Images en développement
Apache sert le projet sur `http://localhost/altess-fashion`, uploads compris.
Le serveur Vite doit donc relayer `/altess-fashion/public` vers Apache, sinon
cette URL tombe sur le fallback SPA et renvoie `text/html` : l'image est
« ajoutée » côté base mais invisible dans le navigateur. Ce proxy est déclaré
dans `vite.config.js` — ne pas le retirer.

## Pièges PDO à connaître
Les native prepares de MySQL **refusent un paramètre nommé réutilisé** dans la
même requête (`SQLSTATE[HY093]`). `backend/models/Product.php` contourne cela
pour `search` et `category_id` en échappant via `PDO::quote()` puis en
interpolant dans la chaîne SQL. Les valeurs concernées sont déjà validées ou
échappées en amont. Ne pas réintroduire de `:search` répété.

## Tri
Clés acceptées par `products.php?sort=` : `newest`, `oldest`, `name`,
`name_desc`, `price`, `price_desc`, `stock`, `stock_desc`. Toute clé inconnue
retombe sur `newest`. Chaque tri a un départage sur `p.id` pour que la
pagination `LIMIT/OFFSET` reste stable quand `created_at` ou `stock` sont égaux.

## Catalogue public
`/boutique`, `/femme` et `/homme` partagent `src/components/catalog/CatalogPage.jsx` :
lecture, filtres, tri et pagination vivent dans ce seul composant, alimenté par
`productService` / `categoryService`. Aucune page ne possède sa propre liste.
`/mon-compte` (profil + mot de passe) et `/mes-commandes` lisent également l'API ;
l'email est en lecture seule car `auth/profile.php` ne l'expose pas en écriture.

## Design system
Noir / doré / ivoire. Fichiers : `src/index.css` (tokens, boutons, champs),
`src/styles.css` (site public), `src/admin.css` (back-office).

Les tokens vivent dans `:root` et se pilotent tous par le haut :
`--rayon*` (12px par défaut, `--rayon-pill` pour les pastilles),
`--ombre-sm` / `--ombre` / `--ombre-lg`, `--degrade-or`, `--degrade-noir`,
`--bordure*`, `--transition*`. Changer un rayon ou une ombre se répercute sur
le site public **et** le back-office — ne pas réintroduire de valeurs en dur
dans les composants. Chaque titre de section porte un liseré doré
(`.section h2::after`) repris à l'identique sous le header et le pied de page.

## Coordonnées de la boutique
Téléphone, email, adresse et liens sociaux sont centralisés dans `src/global.jsx`
(`Contact_Infos`, `WhatsApp_Lien`). WhatsApp n'accepte que les chiffres avec
l'indicatif pays, sans `+` ni séparateur. Ne pas les recopier en dur dans les
pages : la page Contact et le pied de page lisent tous deux ces constantes.

## Compte de test admin
`blanche@gmail.com` / `Admin@2026` — à changer avant toute mise en production.

## Auteurs
ALTESS FASHION Team
