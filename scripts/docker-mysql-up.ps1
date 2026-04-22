# Démarre MySQL (root / root) pour foodnexus_donneur et foodnexus_user.
# Exécuter depuis la racine du dépôt FrontendApplication : .\scripts\docker-mysql-up.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
docker compose up -d mysql
Write-Host "MySQL : localhost:3306 (root / root). Attendre ~20 s le healthcheck, puis lancer les microservices."
