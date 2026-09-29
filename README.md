# ALTESS FASHION — Guide de démarrage rapide

## Prérequis
- **XAMPP** installé (https://www.apachefriends.org/)
- **Node.js** 18+ installé (https://nodejs.org/)

---

## Étape 1 : Lancer XAMPP
1. Ouvrez le panneau de contrôle XAMPP
2. Démarrez **Apache** et **MySQL**
3. Vérifiez que http://localhost fonctionne

## Étape 2 : Importer la base de données
1. Ouvrez phpMyAdmin : http://localhost/phpmyadmin
2. Cliquez sur **Nouvelle** dans le menu gauche
3. Nom de la base : `altess_fashion`, Collation : `utf8mb4_unicode_ci`
4. Cliquez **Créer**
5. Cliquez sur la base `altess_fashion`
6. Onglet **Importer** → Sélectionnez le fichier `backend/database.sql` → Exécuter

## Étape 3 : Démarrer le frontend
```bash
cd C:\Users\Moi\Desktop\ALTESS-FASHION
npm install
npm run dev
```

Le site est sur : **http://localhost:5173**

## Étape 4 : Tester l'API
Ouvrez dans le navigateur :
- http://localhost/altess-fashion/backend/api.php/products.php → devrait afficher du JSON
- http://localhost/altess-fashion/backend/test.php → test de connexion

> Si vous n'avez pas copié les fichiers dans XAMPP, l'API ne fonctionnera pas en production. Le dev server Vite (port 5173) fonctionne indépendamment pour le frontend.

---

## Structure rapide
```
backend/api.php           ← Routeur API (toutes les requêtes passent par ici)
backend/database.sql      ← Schéma MySQL à importer
backend/config/database.php ← Configurez ici vos identifiants MySQL
public/uploads/           ← Images uploadées par l'admin
src/                      ← Frontend React
```

## Routes du site
| URL | Page |
|-----|------|
| http://localhost:5173 | Accueil |
| http://localhost:5173/boutique | Boutique |
| http://localhost:5173/femme | Collection Femme |
| http://localhost:5173/homme | Collection Homme |
| http://localhost:5173/produit/xxx | Détail produit |
| http://localhost:5173/panier | Panier |
| http://localhost:5173/connexion | Connexion |
| http://localhost:5173/inscription | Inscription |
| http://localhost:5173/mon-compte | Mon compte |
| http://localhost:5173/contact | Contact |
| http://localhost:5173/a-propos | À propos |
| http://localhost:5173/admin | Admin (nécessite rôle admin) |

## Configuration MySQL (si besoin)
Éditez `backend/config/database.php` si votre XAMPP utilise un mot de passe MySQL :
```php
return [
    'host'     => 'localhost',
    'dbname'   => 'altess_fashion',
    'username' => 'root',    // Par défaut XAMPP
    'password' => '',          // Par défaut XAMPP = vide
    'charset'  => 'utf8mb4',
];
```
