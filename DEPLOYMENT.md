# ALTESS FASHION — Procédure de déploiement complet

## Pour XAMPP/WAMP

### 1. Configuration XAMPP
1. Lancer Apache et MySQL via le panneau XAMPP
2. Importer `backend/database.sql` dans MySQL:
   ```bash
   C:/xampp/mysql/bin/mysql.exe -u root altess_fashion < backend/database.sql
   ```
3. Configurer `backend/config/database.php` (root / vide par défaut)

### 2. Backend PHP
Placer le dossier `backend/` dans `C:\xampp\htdocs\altess-fashion\backend\`

### 3. Frontend React
```bash
npm install
npm run dev
```
Site : http://localhost:5173

### 4. Production (optionnel)
```bash
npm run build
```
Copier le contenu de `dist/` dans `public/` pour servir via XAMPP Apache.

### 5. Structure finale pour XAMPP
```
C:\xampp\htdocs\altess-fashion\
├── backend\              # PHP API
│   ├── api.php          # Routeur principal
│   ├── config\
│   ├── models\
│   ├── middleware\
│   ├── api\             # Endpoints (directories)
│   ├── database.sql
│   └── .htaccess        # Rewrite rules
├── public\               # Frontend + uploads
│   └── uploads\
└── src\                  # (source React)
```

## Points importants
- **PDO** avec requêtes préparées partout (sécurité SQL injection)
- **password_hash()** / **password_verify()** pour les mots de passe
- **CORS** configuré sur toutes les API
- **Panier** : localStorage (invité) + BDD (connecté)
- **Commandes** : prix figé au moment de l'achat
- **Responsive** : 320px → 1440px+
- Le frontend utilise des données statiques `SAMPLE_*` quand le backend est injoignable (timeout 5s)
