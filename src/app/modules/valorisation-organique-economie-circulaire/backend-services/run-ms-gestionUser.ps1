$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "ms_gestionUser")

$args = @(
  "--spring.datasource.password=root",
  "--eureka.client.enabled=false",
  "--spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/realms/foodnexus/protocol/openid-connect/certs",
  "--keycloak.admin.server-url=http://localhost:8080"
) -join " "

.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run "-Dspring-boot.run.arguments=$args"
