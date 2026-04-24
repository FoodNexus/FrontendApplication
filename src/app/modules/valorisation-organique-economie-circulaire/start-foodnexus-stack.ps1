# Wrapper: full FoodNexus dev stack (Docker + Eureka + microservices + npm).
# Run:
#   powershell -ExecutionPolicy Bypass -File .\start-foodnexus-stack.ps1
#
# Canonical script: FrontendApplication\scripts\start-full-stack.ps1

$here = $PSScriptRoot
$frontendRoot = (Resolve-Path (Join-Path $here "..\..\..\..")).Path
$main = Join-Path $frontendRoot "scripts\start-full-stack.ps1"

if (-not (Test-Path $main)) {
    Write-Error "Not found: $main"
    exit 1
}

& $main -FrontendRoot $frontendRoot @args
