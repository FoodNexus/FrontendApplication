$ErrorActionPreference = "Stop"

Write-Host "Starting backend services for local development..."
Write-Host "1) Make sure Docker Desktop is running."
Write-Host "2) Run: docker compose up -d mysql keycloak"
Write-Host ""

function Start-ServiceWindow {
  param(
    [string]$Name,
    [string]$WorkingDir,
    [string]$Command
  )

  Start-Process powershell -ArgumentList "-NoExit", "-Command", $Command -WorkingDirectory $WorkingDir | Out-Null
  Write-Host "Started $Name in a new terminal window."
}

$eurekaDir = Join-Path $PSScriptRoot "EurekaServer"
$gatewayDir = Join-Path $PSScriptRoot "APIGateway"
Start-ServiceWindow -Name "EurekaServer" -WorkingDir $eurekaDir -Command ".\mvnw.cmd spring-boot:run"

Start-ServiceWindow -Name "ms_gestionUser" -WorkingDir $PSScriptRoot -Command ".\run-ms-gestionUser.ps1"
Start-ServiceWindow -Name "ms_auditConformite_ContratNumerique" -WorkingDir $PSScriptRoot -Command ".\run-ms-audit.ps1"
Start-ServiceWindow -Name "APIGateway" -WorkingDir $gatewayDir -Command ".\mvnw.cmd spring-boot:run"

Write-Host ""
Write-Host "Backend startup triggered."
Write-Host "Expected endpoints:"
Write-Host "- Eureka:   http://localhost:8761"
Write-Host "- Gateway:  http://localhost:8089"
Write-Host "- Keycloak: http://localhost:8080"
Write-Host "- Users:    http://localhost:8087"
Write-Host "- Audit / contrats: http://localhost:8083"
