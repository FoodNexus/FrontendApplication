$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "ms_auditConformite-ContratNumerique")

# Aligné sur docker-compose (MySQL root/root). Sans Eureka local si le serveur 8761 n’est pas démarré.
$args = @(
  "--spring.datasource.password=root",
  "--eureka.client.enabled=false",
  "--spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/realms/foodnexus/protocol/openid-connect/certs"
) -join " "

.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run "-Dspring-boot.run.arguments=$args"
