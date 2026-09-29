# ALTESS FASHION — Script d'installation rapide XAMPP
# Placer ce fichier à la racine du projet
# Exécuter : powershell -ExecutionPolicy Bypass .\install.ps1

Write-Host "=== ALTESS FASHION - Installation XAMPP ===" -ForegroundColor Cyan

# Vérifier XAMPP
if (!(Test-Path "C:\xampp\htdocs")) {
    Write-Host "ERREUR: XAMPP non trouvé dans C:\xampp" -ForegroundColor Red
    exit
}

# Créer le dossier du projet dans XAMPP
$targetDir = "C:\xampp\htdocs\altess-fashion"
if (!(Test-Path $targetDir)) {
    Write-Host "Création du dossier XAMPP..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Copier les fichiers
Write-Host "Copie des fichiers vers XAMPP..." -ForegroundColor Yellow
Copy-Item -Path "backend" -Destination "$targetDir\backend" -Recurse -Force
Copy-Item -Path "public" -Destination "$targetDir\public" -Recurse -Force
Copy-Item -Path "src\assets\logo.png" -Destination "$targetDir\public\logo.png" -Force
Copy-Item -Path "src\assets\hero.png" -Destination "$targetDir\public\hero.png" -Force

Write-Host ""
Write-Host "=== Installation terminée ! ===" -ForegroundColor Green
Write-Host ""
Write-Host "ETAPES SUIVANTES :" -ForegroundColor Cyan
Write-Host "1. Lancer XAMPP (Apache + MySQL)" -ForegroundColor White
Write-Host "2. Ouvrir phpMyAdmin et importer le fichier: backend\database.sql" -ForegroundColor White
Write-Host "3. Ouvrir le test: http://localhost/altess-fashion/backend/test.php" -ForegroundColor White
Write-Host "4. Lancer le dev server: npm run dev" -ForegroundColor White
Write-Host "5. Site: http://localhost:5173" -ForegroundColor White
Write-Host ""
