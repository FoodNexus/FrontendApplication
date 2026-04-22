# ms_gestionDonneur-Matching sur http://localhost:8082 (profil local : MySQL Docker, sans Eureka).
# Prérequis : .\scripts\docker-mysql-up.ps1 + Keycloak sur 8080 si vous testez l’auth ailleurs.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ms = Join-Path $root 'src\app\modules\gestion-donneur-matching\backend-services\ms_gestionDonneur-Matching'
if (-not (Test-Path (Join-Path $ms 'mvnw.cmd'))) {
  Write-Error "Sous-module absent. À la racine du dépôt : git submodule update --init --recursive"
}
$env:SPRING_PROFILES_ACTIVE = 'local'
Set-Location $ms
.\mvnw.cmd spring-boot:run
