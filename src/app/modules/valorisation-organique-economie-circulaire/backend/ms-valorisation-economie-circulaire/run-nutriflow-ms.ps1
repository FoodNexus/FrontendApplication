# NutriFlow hub Spring Boot — exécution sans "mvn" dans le PATH Windows.
# Prérequis : JDK 17+ (java sur le PATH ou JAVA_HOME).

$ErrorActionPreference = 'Stop'
$scriptRoot = $PSScriptRoot
Set-Location $scriptRoot

if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
  # Déjà défini pour mvn.cmd
} elseif (-not (Get-Command java.exe -ErrorAction SilentlyContinue)) {
  Write-Error 'JDK introuvable. Installe un JDK (17+) et ajoute-le au PATH, ou définit JAVA_HOME.'
  exit 1
}

$mavenVersion = '3.9.9'
$toolsDir = Join-Path $scriptRoot '.tools'
$mavenHome = Join-Path $toolsDir "apache-maven-$mavenVersion"
$mvnCmd = Join-Path $mavenHome 'bin\mvn.cmd'

if (-not (Test-Path $mvnCmd)) {
  Write-Host "Première utilisation : téléchargement d'Apache Maven $mavenVersion dans .tools ..."
  New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
  $zipUrl =
    "https://archive.apache.org/dist/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip"
  $zipPath = Join-Path $toolsDir "apache-maven-$mavenVersion-bin.zip"
  Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
  Expand-Archive -LiteralPath $zipPath -DestinationPath $toolsDir -Force
  Remove-Item -LiteralPath $zipPath -Force
  if (-not (Test-Path $mvnCmd)) {
    Write-Error "Extraction Maven inattendue. Vérifie : $mavenHome"
    exit 1
  }
  Write-Host 'Maven installé sous .tools (ignoré par git).'
}

$mvnCmdArgs = $args
if ($mvnCmdArgs.Count -eq 0) {
  $mvnCmdArgs = @('spring-boot:run')
}

$env:M2_HOME = $mavenHome
$env:MAVEN_HOME = $mavenHome

& $mvnCmd @mvnCmdArgs
exit $LASTEXITCODE
