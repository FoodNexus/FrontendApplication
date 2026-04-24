# FoodNexus full local dev: Docker (this repo), Eureka + microservices (sibling folder), Angular.
#
# Layout (default):
#   Desktop\FrontendApplication\   <- this repo (npm / this script)
#   Desktop\FoodNexus-microservices\  <- Java services + Eureka (cloned separately)
#
# Usage (from repo root):
#   .\scripts\start-full-stack.ps1
#   .\scripts\start-full-stack.ps1 -NoFrontend
#   .\scripts\start-full-stack.ps1 -SkipDocker
#
# Optional:
#   -FoodNexusRoot 'D:\path\FoodNexus-microservices'
#   -FrontendRoot 'D:\path\FrontendApplication'

param(
    [string]$FoodNexusRoot = "",
    [string]$FrontendRoot = "",
    [string]$DockerComposeDir = "",
    [switch]$SkipDocker,
    [switch]$NoFrontend
)

$ErrorActionPreference = "Stop"

if (-not $FrontendRoot) {
    $FrontendRoot = Split-Path $PSScriptRoot -Parent
}
$FrontendRoot = (Resolve-Path $FrontendRoot).Path

if (-not $FoodNexusRoot) {
    $FoodNexusRoot = Join-Path $FrontendRoot "..\FoodNexus-microservices"
}
if (-not (Test-Path $FoodNexusRoot)) {
    Write-Error "FoodNexus-microservices not found at: $FoodNexusRoot`nClone it next to FrontendApplication or pass -FoodNexusRoot."
    exit 1
}
$FoodNexusRoot = (Resolve-Path $FoodNexusRoot).Path

if (-not $DockerComposeDir) {
    $DockerComposeDir = Join-Path $PSScriptRoot "foodnexus-docker"
}
$DockerComposeDir = (Resolve-Path $DockerComposeDir).Path

if (-not (Test-Path (Join-Path $DockerComposeDir "docker-compose.yml"))) {
    Write-Error "docker-compose.yml not found in $DockerComposeDir"
    exit 1
}

function Wait-TcpPort {
    param([string]$HostName = "127.0.0.1", [int]$Port, [int]$TimeoutSec = 120, [string]$Label = "")
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $iar = $c.BeginConnect($HostName, $Port, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(2000, $false)) {
                $c.EndConnect($iar)
                $c.Close()
                if ($Label) { Write-Host "OK: $Label ($HostName`:$Port)" -ForegroundColor Green }
                return $true
            }
            $c.Close()
        } catch { }
        Start-Sleep -Seconds 2
    }
    if ($Label) { Write-Warning "Timeout waiting for $Label ($HostName`:$Port)" }
    return $false
}

function Start-ServiceWindow {
    param([string]$Title, [string]$WorkingDirectory, [string]$Command)
    $wd = (Resolve-Path $WorkingDirectory).Path
    $cmd = "Set-Location -LiteralPath '$wd'; $Command"
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host '$Title' -ForegroundColor Cyan; $cmd"
    ) | Out-Null
}

Write-Host "Frontend root:     $FrontendRoot" -ForegroundColor Cyan
Write-Host "FoodNexus (Java):  $FoodNexusRoot" -ForegroundColor Cyan
Write-Host "Docker compose:    $DockerComposeDir" -ForegroundColor Cyan

if (-not $SkipDocker) {
    Write-Host "Starting Docker (MySQL + Keycloak)..." -ForegroundColor Yellow
    Push-Location $DockerComposeDir
    try {
        docker compose up -d
    } finally {
        Pop-Location
    }
    if (-not (Wait-TcpPort -Port 3306 -TimeoutSec 90 -Label "MySQL")) {
        Write-Warning "MySQL not reachable."
    }
    if (-not (Wait-TcpPort -Port 8080 -TimeoutSec 120 -Label "Keycloak")) {
        Write-Warning "Keycloak not reachable."
    }
} else {
    Write-Host "Skipping Docker (--SkipDocker)." -ForegroundColor DarkYellow
}

Write-Host "Starting Eureka (8761)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Eureka 8761" -WorkingDirectory (Join-Path $FoodNexusRoot "EurekaServer") -Command ".\mvnw.cmd spring-boot:run -DskipTests"
if (-not (Wait-TcpPort -Port 8761 -TimeoutSec 180 -Label "Eureka")) {
    Write-Warning "Eureka did not open in time."
}

Write-Host "Starting microservices..." -ForegroundColor Yellow
Start-ServiceWindow -Title "ms_gestionUser 8087" -WorkingDirectory (Join-Path $FoodNexusRoot "ms_gestionUser") -Command ".\mvnw.cmd spring-boot:run -DskipTests"
Start-ServiceWindow -Title "ms_gestionDonneur-Matching 8082" -WorkingDirectory (Join-Path $FoodNexusRoot "ms_gestionDonneur-Matching") -Command ".\mvnw.cmd spring-boot:run -DskipTests"
Start-ServiceWindow -Title "ms_auditConformite 8083" -WorkingDirectory (Join-Path $FoodNexusRoot "ms_auditConformite-ContratNumerique") -Command ".\mvnw.cmd spring-boot:run -DskipTests"

Start-Sleep -Seconds 3
Write-Host "Waiting for API ports (first boot can take minutes)..." -ForegroundColor DarkGray
Wait-TcpPort -Port 8087 -TimeoutSec 240 -Label "User API" | Out-Null
Wait-TcpPort -Port 8082 -TimeoutSec 240 -Label "Matching API" | Out-Null
Wait-TcpPort -Port 8083 -TimeoutSec 240 -Label "Audit API" | Out-Null

if (-not $NoFrontend -and (Test-Path (Join-Path $FrontendRoot "package.json"))) {
    Write-Host "Starting Angular (npm start)..." -ForegroundColor Yellow
    Start-ServiceWindow -Title "FrontendApplication :4200" -WorkingDirectory $FrontendRoot -Command "npm start"
} elseif (-not $NoFrontend) {
    Write-Warning "package.json not found; skipped npm start."
}

$composeFile = Join-Path $DockerComposeDir "docker-compose.yml"
Write-Host ""
Write-Host "Done. http://localhost:4200" -ForegroundColor Green
Write-Host "Docker down: docker compose -f `"$composeFile`" down" -ForegroundColor DarkGray
