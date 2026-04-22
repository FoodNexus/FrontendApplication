# Démarrage du hub NutriFlow (sync multi-utilisateurs pour lots / demandes / crédits).
# Prérequis : Java 17+, Maven dans le PATH.
$root = Join-Path $PSScriptRoot "nutriflow-hub-server"
Set-Location $root
Write-Host "NutriFlow hub: http://localhost:8095 (données dans nutriflow-hub-data/)"
mvn -q spring-boot:run
