# Lance le NutriFlow hub Spring Boot (Maven bootstrap si besoin).
# Le projet Maven est sous backend/ms-valorisation-economie-circulaire/.

param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [object[]]$ArgsToScript
)

$ErrorActionPreference = 'Stop'
$hub = Join-Path $PSScriptRoot 'backend\ms-valorisation-economie-circulaire\run-nutriflow-ms.ps1'
if (-not (Test-Path $hub)) {
  Write-Error "Script introuvable : $hub"
  exit 1
}
& $hub @ArgsToScript
exit $LASTEXITCODE
