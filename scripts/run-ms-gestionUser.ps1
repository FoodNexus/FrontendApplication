# ms_gestionUser sur http://localhost:8087 (profil local : sans Eureka).
# Prérequis : MySQL Docker + Keycloak (realm foodnexus) sur http://localhost:8080
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ms = Join-Path $root 'src\app\modules\valorisation-organique-economie-circulaire\backend-services\ms_gestionUser'
if (-not (Test-Path (Join-Path $ms 'mvnw.cmd'))) {
  Write-Error "Sous-module absent. À la racine du dépôt : git submodule update --init --recursive"
}
$env:SPRING_PROFILES_ACTIVE = 'local'
Set-Location $ms
.\mvnw.cmd spring-boot:run
